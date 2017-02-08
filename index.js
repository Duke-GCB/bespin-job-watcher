var config = require("./config.json");
var WebServer = require("./webserver");
var JobStatusQueue = require('./job-status-queue');

var webServer = WebServer(config);
var jobStatusQueue = JobStatusQueue(config);

function onJobStatusQueueReady() {
    webServer.listen();
}

function onJobStatusData(jsonString) {
    webServer.broadCastJobStatus(jsonString);
}

jobStatusQueue.listenToExchange(onJobStatusQueueReady, onJobStatusData);