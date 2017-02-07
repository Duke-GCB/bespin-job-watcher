'use strict';

var http = require('http');
var request = require('request');
var url = require('url');
var fs = require('fs');
var config = require("./config.json");
var sockjs = require('sockjs');
var amqpConnection = 'amqp://' + config.rabbithost + ":" + config.rabbitport;
var context = require('rabbit.js').createContext(amqpConnection);
var port = config.webserverport;
var JobWatchers = require('./job-watchers');

// Create a web server on which we'll serve our demo page, and listen
// for SockJS connections.

var jobWatchers = JobWatchers(sendJobStatusToWebsocket);
var httpserver = http.createServer(handler);// Listen for SockJS connections
var sockjs_opts = {
    sockjs_url: "https://cdn.jsdelivr.net/sockjs/1/sockjs.min.js"
};
var sjs = sockjs.createServer(sockjs_opts);
sjs.installHandlers(httpserver, {prefix: '[/]socks'});

function makeWebsocketPayload(data, status) {
    return JSON.stringify(
        {
            "status": status,
            "data": data
        }
    )
}

function sendJobStatusToWebsocket(connection, data) {
    connection.write(makeWebsocketPayload(data, "ok"));
}

function sendErrorToWebsocket(connection, errorMessage) {
    connection.write(makeWebsocketPayload({
        "message": errorMessage
    }, "error"));
}

function listenForTaskChanges() {
    var subscription = context.socket('SUB');
    subscription.setEncoding('utf8');
    subscription.on('data', notifyJobWatchers);
    subscription.connect('job_status', function () {
        console.log("Connected to job_status exchange.");
    });
}

function notifyJobWatchers(jsonString) {
    try {
        var data = JSON.parse(jsonString);
        console.log(data);
        var jobId = data['job'];
        if (jobId) {
            jobWatchers.notify(jobId, data);
        } else {
            console.log("Invalid job data received from rabbit: " + jsonString);
        }
    } catch (e) {
        console.log(e);
    }
}

function processWebsocketCommand(conn, jsonString) {
    try {
        var data = JSON.parse(jsonString);
        var jobId = data['job'];
        var token = data['token'];
        verifyToken(conn, jobId, token, function () {
            var command = data['command'];
            if (jobId && command) {
                if (command === 'add') {
                    console.log("Start watching " + jobId);
                    jobWatchers.add(jobId, conn);
                } else if (command == 'remove') {
                    console.log("Stop watching " + jobId);
                    jobWatchers.remove(jobId, conn);
                } else {
                    console.log("Invalid command on web socket: " + jsonString);

                }
            } else {
                console.log("Invalid job data received on web socket: " + jsonString);
            }
        });
    } catch (e) {
        console.log(e);
    }
}

function verifyToken(conn, jobId, token, onValidToken) {
    var url = 'http://' + config.bespinapihost + ':' + config.bespinapiport + '/api/jobs/' + jobId + '/';
    var options = {
        url: url,
        headers: {
            'Authorization': 'Token ' + token
        }
    };
    request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            onValidToken();
        } else {
            var errorMessage = 'Checking authorization failed with status:' + response.statusCode + ":" + error;
            console.log(errorMessage);
            sendErrorToWebsocket(conn, errorMessage);
        }
    });
}

context.on('ready', function () {
    listenForTaskChanges();
    // Hook requesting sockets up
    sjs.on('connection', function (conn) {
        function onData(data) {
            processWebsocketCommand(conn, data)
        }
        conn.on('data', onData)
        conn.on('close', function () {
            jobWatchers.removeForAllJobIds(conn);
        });
    });
    // And finally, start the web server.
    httpserver.listen(port, '0.0.0.0');
});

function handler(req, res) {
    var path = url.parse(req.url).pathname;
    switch (path) {
        case '/':
        case '/index.html':
            fs.readFile(__dirname + '/index.html', function (err, data) {
                if (err) return send404(res);
                res.writeHead(200, {'Content-Type': 'text/html'});
                res.write(data, 'utf8');
                res.end();
            });
            break;
        default:
            send404(res);
    }
}

function send404(res) {
    res.writeHead(404);
    res.write('404');
    return res.end();
}
