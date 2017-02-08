var sockjs = require('sockjs');
var BespinApi = require('./bespin-api');
var JobWatchers = require("./job-watchers");

function WebSockets(config, webServer) {
    var httpserver = webServer.httpserver;
    var sjs = createSockJS(httpserver);
    var bespinApi = BespinApi(config);
    var jobWatchers = JobWatchers(sendJobStatusToWebsocket)
    return {
        listenForConnections: function() {
            sjs.on('connection', function (sjsConnection) {
                webSocketConnection = WebSocketConnection(sjsConnection, jobWatchers, bespinApi);
                sjsConnection.on('data', webSocketConnection.onData);
                sjsConnection.on('close', webSocketConnection.close);
            });
        },
        broadCastJobStatus: function (jsonString) {
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
    }
}

function sendJobStatusToWebsocket(connection, data) {
    connection.write(makeWebsocketPayload(data, "ok"));
}

function createSockJS(httpserver) {
    var sockjs_opts = {
        sockjs_url: "https://cdn.jsdelivr.net/sockjs/1/sockjs.min.js"
    };
    var sjs = sockjs.createServer(sockjs_opts);
    sjs.installHandlers(httpserver, {prefix: '[/]socks'});
    return sjs;
}

function WebSocketConnection(sjsConnection, jobWatchers, bespinApi) {

    function onValidToken(jobId, command) {
        if (command === 'add') {
            console.log("Start watching " + jobId);
            jobWatchers.add(jobId, sjsConnection);
        } else if (command == 'remove') {
            console.log("Stop watching " + jobId);
            jobWatchers.remove(jobId, sjsConnection);
        } else {
            this.onVerifyError("Invalid command on web socket: " + command)
        }
    }
    function onVerifyError(errorMessage) {
        sjsConnection.write(makeWebsocketPayload({
            "message": errorMessage
        }, "error"));
    }
    return {
        onData: function(jsonString) {
            try {
                var data = JSON.parse(jsonString);
                var jobId = data['job'];
                var token = data['token'];
                var command = data['command'];
                if (jobId && token && command) {
                    console.log("OK", this);
                    bespinApi.verifyToken(jobId, token, function() {
                        onValidToken(jobId, command);
                    }, onVerifyError);
                } else {
                    onVerifyError("Missing required job, token or command: " + jsonString)
                }
            } catch (e) {
                console.log(e);
            }
        },

        close: function() {
            jobWatchers.removeForAllJobIds(sjsConnection);
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

module.exports = WebSockets;