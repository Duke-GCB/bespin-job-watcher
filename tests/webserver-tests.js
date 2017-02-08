var chai = require('chai');
var expect = chai.expect;
var proxyquire =  require('proxyquire')
    , assert     =  require('assert')
    , httpStub   =  { };
var Webserver = proxyquire('../webserver', {
    'http': httpStub
});

describe('Webserver', function() {
    it('listen() pulls port and host from config', function() {
        var config = {
            "webserverport": 8081,
            "webserverhost": "123.0.0.5",
        };
        var port = '';
        var host = '';
        httpStub.createServer = function(someFunc) {
            return {
                listen: function (somePort, someHost) {
                    port = somePort;
                    host = someHost;
                }
            };
        };
        var webserver = Webserver(config);
        webserver.listen();
        expect(port).to.equal(8081);
        expect(host).to.equal("123.0.0.5");
    });
});