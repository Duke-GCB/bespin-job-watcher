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
    return 'amqp://' + config.rabbituser + ":" + config.rabbitpassword + "@" +
        config.rabbithost + ":" + config.rabbitport;
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
        console.log("Connected to " + exchangeName + " exchange.");
    });
}

module.exports = JobStatusQueue;