"use strict";
const config = require("./config.json");
const WebServer = require("./webserver");
const JobStatusQueue = require('./job-status-queue');

const webServer = WebServer(config);
const jobStatusQueue = JobStatusQueue(config);

jobStatusQueue.listenToExchange(
    function onJobStatusQueueReady() {
        webServer.listen();
    }, function onJobStatusData(jsonString) {
        webServer.broadCastJobStatus(jsonString);
    }
);