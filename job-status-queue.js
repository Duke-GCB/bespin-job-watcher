const rabbit = require('rabbit.js');

function JobStatusQueue(config) {
    const connectionString = makeConnectionStr(config);
    const context = rabbit.createContext(connectionString);
    return {
        listenToExchange: function (onReady, onData) {
            listenToExchange(context, config.rabbit.exchange, onReady, onData)
        }
    };
}

function makeConnectionStr(config) {
    const protocol = config.rabbit.protocol;
    const user = config.rabbit.user;
    const password = config.rabbit.password;
    const host = config.rabbit.host;
    const port = config.rabbit.port;
    return protocol + '://' + user + ":" + password + "@" + host + ":" + port;
}

function listenToExchange(context, exchangeName, onReady, onData) {
    context.on('ready', function () {
        subscribeToExchange(context, exchangeName, onData);
        onReady()
    });
}

function subscribeToExchange(context, exchangeName, onData) {
    const subscription = context.socket('SUB');
    subscription.setEncoding('utf8');
    subscription.on('data', onData);
    subscription.connect(exchangeName, function () {
        console.log("JobStatusQueue: Connected to " + exchangeName + " exchange.");
    });
}

module.exports = JobStatusQueue;