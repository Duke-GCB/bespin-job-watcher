var chai = require('chai');
var expect = chai.expect;
var proxyquire =  require('proxyquire')
    , assert = require('assert')
    , httpsStub =  {}
    , fsStub = {}
    , wsStub = {};

function fakeExpress() {
    return {
        use: function() {

        }
    }
}

var jobWatcherData = {};
function fakeJobWatchers() {
    return {
        notify: function(jobId, data) {
            jobWatcherData.jobId = jobId;
            jobWatcherData.data = data;
        }
    }
}

var Webserver = proxyquire('../webserver', {
    'fs': fsStub,
    'express': fakeExpress,
    'https': httpsStub,
    'ws': wsStub,
    './job-watchers': fakeJobWatchers
});

describe('Webserver', function() {
    it('constructor/listen() parses config correctly', function() {
        var config = {
            webserver: {
                "host": "121.0.0.1",
                "port": 8081,
                "key": "mykey.pem",
                "cert": "mycert.pem"
            }
        };
        var createServerOptions = {};
        var serverListenOptions = {};
        httpsStub.createServer = function (options, app) {
            createServerOptions = options;
            return {
                listen: function(options) {
                    serverListenOptions = options;
                }
            }
        };
        wsStub.Server = function (server) {
            return {
                on: function () {

                }
            };
        };
        fsStub.readFileSync = function (filename) {
            if (filename === 'mykey.pem') {
                return 'keydata';
            }
            if (filename === 'mycert.pem') {
                return 'certdata';
            }
            return '';
        };
        var webserver = Webserver(config);
        webserver.listen();
        expect(createServerOptions.key).to.equal('keydata');
        expect(createServerOptions.cert).to.equal('certdata');
        expect(serverListenOptions.host).to.equal('121.0.0.1');
        expect(serverListenOptions.port).to.equal(8081);
    });
    it('broadCastJobStatus will call jobWatchers.notify', function() {
        var config = {
            webserver: {
                "host": "121.0.0.1",
                "port": 8081,
                "key": "mykey.pem",
                "cert": "mycert.pem"
            }
        };
        var createServerOptions = {};
        var serverListenOptions = {};
        httpsStub.createServer = function (options, app) {
            createServerOptions = options;
            return {}
        };
        wsStub.Server = function (server) {
            return {
                on: function () {

                }
            };
        };
        fsStub.readFileSync = function (filename) {
            if (filename === 'mykey.pem') {
                return 'keydata';
            }
            if (filename === 'mycert.pem') {
                return 'certdata';
            }
            return '';
        };
        var webserver = Webserver(config);
        jobWatcherData = {};
        webserver.broadCastJobStatus('{"job":1, "status":"Not good"}');
        expect(jobWatcherData.jobId).to.equal(1);
        expect(jobWatcherData.data).to.deep.equal({"job":1, "status":"Not good"});
    });
});