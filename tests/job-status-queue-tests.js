var chai = require('chai');
var expect = chai.expect; // we are using the "expect" style of Chai
var proxyquire =  require('proxyquire')
    , assert     =  require('assert')
    , rabbitStub   =  { };

var JobStatusQueue = proxyquire('../job-status-queue', { 'rabbit.js': rabbitStub });

describe('JobStatusQueue', function() {
    it('constructor() can build context from ampq connection string from config', function() {
        var config = {
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
});