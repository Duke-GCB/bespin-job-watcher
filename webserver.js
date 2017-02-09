/**
 * Runs webserver serving static/index.html and handles websockets.
 * Websockets send messages to register themselves to listen for particular jobs.
 * The broadCastJobStatus is called to send updates to the Websockets associated with a job.
 */
const express = require('express');
const https = require('https');
const WebSocket = require('ws');
const url = require('url');
const fs = require('fs');
var BespinApi = require('./bespin-api');
var JobWatchers = require("./job-watchers");

function WebServer(config) {
    const bespinApi = BespinApi(config);
    const jobWatchers = JobWatchers(sendJobStatusToWebsocket);
    const app = express();
    app.use('/', express.static('static'));
    const server = createServer(config, app);
    setupWebSocketServer(server);
    return {
        listen: function () {
            server.listen(config.webserver.port, function listening() {
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

function createServer(config, app) {
    const options = {
        key: fs.readFileSync(config.webserver.key),
        cert: fs.readFileSync(config.webserver.cert)
    };
    return https.createServer(options, app);
}

function setupWebSocketServer(server) {
    const wss = new WebSocket.Server({ server });
    wss.on('connection', function connection(ws) {
        webSocketConnection = WebSocketConnection(ws, jobWatchers, bespinApi);
        ws.on('message', webSocketConnection.onData);
        ws.on('close', webSocketConnection.close);
    });
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