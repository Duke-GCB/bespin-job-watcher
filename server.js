'use strict';


var http = require('http');
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

var httpserver = http.createServer(handler);// Listen for SockJS connections
var sockjs_opts = {
    sockjs_url: "http://cdn.sockjs.org/sockjs-0.2.min.js"
};
var sjs = sockjs.createServer(sockjs_opts);
sjs.installHandlers(httpserver, {prefix: '[/]socks'});

function writeDataToConnection(connection, data) {
    connection.write(data);
}

context.on('ready', function () {
    var jobWatchers = JobWatchers(writeDataToConnection);
    var sub = context.socket('SUB');
    sub.setEncoding('utf8');
    sub.on('data', function (jsonString) {
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
    });
    sub.connect('job_status', function () {
        console.log("Connected to job_status exchange.");
    });
    // Hook requesting sockets up
    sjs.on('connection', function (conn) {
        //jobWatchers.add()
        conn.on('data', function (message) {
            try {
                var data = JSON.parse(jsonString);
                var jobId = data['job'];
                var command = data['command'];
                if (jobId && command) {
                    if (command === 'add') {
                        jobWatchers.add(jobId, conn);
                    } else if (command == 'remove') {
                        jobWatchers.remove(jobId, conn);
                    } else {
                        console.log("Invalid command on web socket: " + jsonString);
                    }

                } else {
                    console.log("Invalid job data received on web socket: " + jsonString);
                }
            } catch (e) {
                console.log(e);
            }
        });
        conn.on('close', function () {
            jobWatchers.removeForAllJobIds(conn);
        });
    });
    // And finally, start the web server.
    httpserver.listen(port, '0.0.0.0');
});

// ==== boring details

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
