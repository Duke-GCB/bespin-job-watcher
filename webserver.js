/**
 * Runs webserver serving static/index.html and handles websockets.
 * Websockets send messages to register themselves to listen for particular jobs.
 * The broadCastJobStatus is called to send updates to the Websockets associated with a job.
 */
const express = require('express');
const https = require('https');
const url = require('url');
const WebSocket = require('ws');
const fs = require('fs');
var BespinApi = require('./bespin-api');
var JobWatchers = require("./job-watchers");

function WebServer(config) {
    var bespinApi = BespinApi(config);
    var jobWatchers = JobWatchers(sendJobStatusToWebsocket);

    const app = express();
    app.use('/', express.static('static'));
    const options = {
        key: fs.readFileSync('sslcert/key.pem'),
        cert: fs.readFileSync('sslcert/cert.pem')
    };
    const server = https.createServer(options, app);
    const wss = new WebSocket.Server({ server });
    wss.on('connection', function connection(ws) {
        webSocketConnection = WebSocketConnection(ws, jobWatchers, bespinApi);
        ws.on('message', webSocketConnection.onData);
        ws.on('close', webSocketConnection.close);
    });
    return {
        listen: function () {
            server.listen(8080, function listening() {
                console.log('Listening on %d', server.address().port);
            });
        },
        broadCastJobStatus(jsonString) {
            var data = parseJSON(jsonString);
            if (data) {
                var jobId = data['job'];
                if (jobId) {
                    jobWatchers.notify(jobId, data);
                } else {
                    console.log("WebSockets: Invalid job data received from rabbit: " + jsonString);
                }
            } else {
                console.log("WebSockets: Invalid job status JSON received: " + jsonString);
            }
        }
    }
}

/**
 * Returns parsed json object or undefined if jsonString is invalid
 * @param jsonString string that may contain JSON data
 */
function parseJSON(jsonString) {
    try {
        var data = JSON.parse(jsonString);
        return data;
    } catch (e) {
        return undefined;
    }
}

function sendJobStatusToWebsocket(ws, data) {
    ws.send(makeWebsocketPayload(data, "ok"));
}

function WebSocketConnection(ws, jobWatchers, bespinApi) {

    function onValidToken(jobId, command) {
        if (command === 'add') {
            jobWatchers.add(jobId, ws);
        } else if (command == 'remove') {
            jobWatchers.remove(jobId, ws);
        } else {
            this.onVerifyError("Invalid command on web socket: " + command)
        }
    }
    function onVerifyError(errorMessage) {
        console.log("WebSocketConnection:" + errorMessage);
        ws.send(makeWebsocketPayload({
            "message": errorMessage
        }, "error"));
    }
    return {
        onData: function(jsonString) {
            var data = parseJSON(jsonString);
            if (data) {
                var jobId = data['job'];
                var token = data['token'];
                var command = data['command'];
                if (jobId && token && command) {
                    bespinApi.verifyToken(jobId, token, function() {
                        onValidToken(jobId, command);
                    }, onVerifyError);
                } else {
                    onVerifyError("Missing required job, token or command: " + jsonString)
                }
            } else {
                onVerifyError("Invalid JSON received: " + jsonString)
            }
        },

        close: function() {
            jobWatchers.removeForAllJobIds(ws);
        }
    };
}

function makeWebsocketPayload(data, status) {
    return JSON.stringify(
        {
            "status": status,
            "data": data
        }
    );
}


module.exports = WebServer;