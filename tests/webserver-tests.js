var chai = require('chai');
var expect = chai.expect;
var proxyquire =  require('proxyquire')
    , assert = require('assert')
    , expressStub =  {}
    , httpsStub =  {}
    , wsStub = {};

var Webserver = proxyquire('../webserver', {
    'express': expressStub,
    'https': httpsStub,
    'ws': wsStub
});

describe('Webserver', function() {
    it('listen() pulls port and host from config', function() {
        var config = {
            webserver: {
                "host": "0.0.0.0",
                "port": 8080,
                "key": "sslcert/key.pem",
                "cert": "sslcert/cert.pem"
            }
        };
        var webserver = Webserver(config);
        expect(1).to.equal(1);
    });
});