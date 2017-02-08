var config = require("./config.json");
var WebServer = require("./webserver");
var WebSockets = require("./websockets");
var JobStatusQueue = require('./job-status-queue');

var webServer = WebServer(config);
var webSockets = WebSockets(config, webServer);
var jobStatusQueue = JobStatusQueue(config);

function onJobStatusQueueReady() {
    webSockets.listenForConnections();
    webServer.listen();
}

function onJobStatusData(jsonString) {
    webSockets.broadCastJobStatus(jsonString);
}

jobStatusQueue.listenToExchange(onJobStatusQueueReady, onJobStatusData);