var chai = require('chai');
var expect = chai.expect;
var proxyquire =  require('proxyquire')
    , assert     =  require('assert')
    , requestStub   =  { };

var lastRequest = {};
function fakeRequest(options, func) {
    lastRequest.options = options;
    lastRequest.func = func;
}
var BespinApi = proxyquire('../bespin-api', { 'request': fakeRequest });

describe('BespinApi', function() {
    it('makeRequestOptions() builds structure with expected URL', function() {
        var config = {
            bespinapi: {
                protocol: "https",
                host: "127.0.0.1",
                port: "12345"
            }
        };
        var jobId = "541";
        var token = "abcdefg";
        var bespinApi = BespinApi(config);
        var requestOptions = bespinApi.makeRequestOptions(jobId, token);
        expect(requestOptions.url).to.equal('https://127.0.0.1:12345/api/jobs/541/');
        expect(requestOptions.headers['Authorization']).to.equal('Token abcdefg');
    });
    it('verifyToken() calls onValidToken when good', function() {
        var config = {
            bespinapi: {
                protocol: "https",
                host: "127.0.0.1",
                port: "12345"
            }
        };
        var jobId = "541";
        var token = "abcdefg";
        var bespinApi = BespinApi(config);
        var result = '';
        function onValidToken(jobId) {
            result = 'Valid ' + jobId;
        }
        function onInvalidToken(error) {
            result = 'Error ' + error;
        }
        bespinApi.verifyToken(jobId, token, onValidToken, onInvalidToken);
        var error = '';
        var response = {
            statusCode: 200
        };
        lastRequest.func(error, response);
        expect(result).to.equal('Valid 541');
    });
    it('verifyToken() calls onInvalidToken when bad', function() {
        var config = {
            bespinapi: {
                protocol: "https",
                host: "127.0.0.1",
                port: "12345"
            }
        };
        var jobId = "541";
        var token = "abcdefg";
        var bespinApi = BespinApi(config);
        var result = '';
        function onValidToken(jobId) {
            result = 'Valid ' + jobId;
        }
        function onInvalidToken(error) {
            result = 'Error ' + error;
        }
        bespinApi.verifyToken(jobId, token, onValidToken, onInvalidToken);
        var error = 'bad';
        var response = {
            statusCode: 404,
            error: 'oops'
        };
        lastRequest.func(error, response);
        expect(result).to.equal('Error Checking authorization failed with status:404:bad');
    });
});