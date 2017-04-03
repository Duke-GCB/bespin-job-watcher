"use strict";
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
const BespinApiClient = require('./bespin-api');
const JobWatchers = require("./job-watchers");

/**
 * Creates webserver that will broadcast job status messages to websockets.
 * @param config: global configuration settings from config.json
 * @returns {{listen: listen, broadCastJobStatus: (function(*=))}}
 * @constructor
 */
function WebServer(config) {
    const bespinApiClient = BespinApiClient(config);
    const jobWatchers = JobWatchers(sendJobStatusToWebsocket);
    const app = express();
    app.use(express.static('static'));
    const server = createServer(config, app);
    setupWebSocketServer(server, jobWatchers, bespinApiClient);
    return {
        listen: function () {
            const options = {
                'host': config.webserver.host,
                'port': config.webserver.port
            };
            server.listen(options, function listening() {
                console.log('Listening on %d', server.address().port);
            });
        },
        broadCastJobStatus(jsonString) {
            const data = parseJSON(jsonString);
            if (data) {
                const jobId = data['job'];
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

function setupWebSocketServer(server, jobWatchers, bespinApiClient) {
    const wss = new WebSocket.Server({ server });
    wss.on('connection', function connection(ws) {
        webSocketConnection = WebSocketConnection(ws, jobWatchers, bespinApiClient);
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
        const data = JSON.parse(jsonString);
        return data;
    } catch (e) {
        return undefined;
    }
}

function sendJobStatusToWebsocket(ws, data) {
    ws.send(makeWebsocketPayload(data, "ok"));
}

function WebSocketConnection(ws, jobWatchers, bespinApiClient) {
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
            const data = parseJSON(jsonString);
            if (data) {
                const jobId = data['job'];
                const token = data['token'];
                const command = data['command'];
                if (jobId && token && command) {
                    bespinApiClient.verifyToken(jobId, token, function() {
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
