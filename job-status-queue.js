var rabbit = require('rabbit.js');
var EXCHANGE_NAME = "job_status";

function JobStatusQueue(config) {
    var connectionString = makeConnectionStr(config);
    var context = rabbit.createContext(connectionString);
    return {
        listenToExchange: function (onReady, onData) {
            listenToExchange(context, onReady, onData)
        }
    };
}

function makeConnectionStr(config) {
    var protocol = config.rabbit.protocol;
    var user = config.rabbit.user;
    var password = config.rabbit.password;
    var host = config.rabbit.host;
    var port = config.rabbit.port;
    return protocol + '://' + user + ":" + password + "@" + host + ":" + port;
}

function listenToExchange(context, onReady, onData) {
    context.on('ready', function () {
        subscribeToExchange(context, EXCHANGE_NAME, onData);
        onReady()
    });
}

function subscribeToExchange(context, exchangeName, onData) {
    var subscription = context.socket('SUB');
    subscription.setEncoding('utf8');
    subscription.on('data', onData);
    subscription.connect(exchangeName, function () {
        console.log("JobStatusQueue: Connected to " + exchangeName + " exchange.");
    });
}

module.exports = JobStatusQueue;