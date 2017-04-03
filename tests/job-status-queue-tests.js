"use strict";
const chai = require('chai');
const expect = chai.expect;
const proxyquire = require('proxyquire')
    , assert = require('assert')
    , rabbitStub = {};
const JobStatusQueue = proxyquire('../job-status-queue', { 'rabbit.js': rabbitStub });

describe('JobStatusQueue', function() {
    it('constructor() can build context from ampq connection string from config', function() {
        const config = {
            rabbit: {
                protocol: "amqp",
                user: 'joe',
                password: 'secret',
                host: '127.0.0.1',
                port: '123456'
            }
        };
        let connectionString = "";
        rabbitStub.createContext = function (data) { connectionString = data; return {};};
        const jobStatusQueue = JobStatusQueue(config);
        expect(connectionString).to.equal('amqp://joe:secret@127.0.0.1:123456');
    });

    it('listenToExchange() calls onReady and sets up onData', function() {
        const config = {
            rabbit: {
                protocol: 'amqp',
                exchange: 'job_status2',
                user: 'joe',
                password: 'secret',
                host: '127.0.0.1',
                port: '123456'
            }
        };
        let readyCalled = '';
        let connectionString = "";
        let contextOnParam = '';
        let subscriptionExchange = '';
        let subscriptionOnDataParam = '';
        let subscriptionOnDataFunc = '';
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
        const jobStatusQueue = JobStatusQueue(config);
        function onReady() {
            readyCalled = 'true';
        }
        function onData() {}
        jobStatusQueue.listenToExchange(onReady, onData);
        expect(contextOnParam).to.equal('ready');
        expect(subscriptionExchange).to.equal('job_status2');
        expect(subscriptionOnDataParam).to.equal('data');
        expect(subscriptionOnDataFunc).to.equal(onData);
    });
});