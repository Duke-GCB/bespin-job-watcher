var chai = require('chai');
var expect = chai.expect;
var proxyquire =  require('proxyquire')
    , assert     =  require('assert')
    , rabbitStub   =  { };
var JobStatusQueue = proxyquire('../job-status-queue', { 'rabbit.js': rabbitStub });

describe('JobStatusQueue', function() {
    it('constructor() can build context from ampq connection string from config', function() {
        var config = {
            rabbitprotocol: "amqp",
            rabbituser: 'joe',
            rabbitpassword: 'secret',
            rabbithost: '127.0.0.1',
            rabbitport: '123456'
        };
        var connectionString = "";
        rabbitStub.createContext = function (data) { connectionString = data; return {};};
        var jobStatusQueue = JobStatusQueue(config);
        expect(connectionString).to.equal('amqp://joe:secret@127.0.0.1:123456');
    });

    it('listenToExchange() calls onReady and sets up onData', function() {
        var config = {
            rabbitprotocol: "amqp",
            rabbituser: 'joe',
            rabbitpassword: 'secret',
            rabbithost: '127.0.0.1',
            rabbitport: '123456'
        };
        var readyCalled = '';
        var connectionString = "";
        var contextOnParam = '';
        var subscriptionExchange = '';
        var subscriptionOnDataParam = '';
        var subscriptionOnDataFunc = '';
        rabbitStub.createContext = function (data) { connectionString = data; return {
            on: function(param, func) {
                contextOnParam = param;
                func();
            },
            socket: function () {
                return { //subscription
                    setEncoding: function() {},
                    on: function(param, func) {
                        subscriptionOnDataParam = param;
                        subscriptionOnDataFunc = func;
                    },
                    connect: function(exchangeName) {
                        subscriptionExchange = exchangeName;
                    }
                }
            }
        };};
        var jobStatusQueue = JobStatusQueue(config);
        function onReady() {
            readyCalled = 'true';
        }
        function onData() {}
        jobStatusQueue.listenToExchange(onReady, onData);
        expect(contextOnParam).to.equal('ready');
        expect(subscriptionExchange).to.equal('job_status');
        expect(subscriptionOnDataParam).to.equal('data');
        expect(subscriptionOnDataFunc).to.equal(onData);
    });
});