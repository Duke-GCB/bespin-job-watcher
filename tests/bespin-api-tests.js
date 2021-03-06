"use strict";
const chai = require('chai');
const expect = chai.expect;
const proxyquire = require('proxyquire')
    , assert = require('assert')
    , requestStub = {};

const lastRequest = {};
function fakeRequest(options, func) {
    lastRequest.options = options;
    lastRequest.func = func;
}
const BespinApiClient = proxyquire('../bespin-api', { 'request': fakeRequest });

describe('BespinApiClient', function() {
    it('makeRequestOptions() builds structure with expected URL', function() {
        const config = {
            bespinapi: {
                url: 'https://127.0.0.1:12345/api'
            }
        };
        const jobId = "541";
        const token = "abcdefg";
        const bespinApiClient = BespinApiClient(config);
        const requestOptions = bespinApiClient.makeRequestOptions(jobId, token);
        expect(requestOptions.url).to.equal('https://127.0.0.1:12345/api/jobs/541/');
        expect(requestOptions.headers['Authorization']).to.equal('JWT abcdefg');
    });
    it('verifyToken() calls onValidToken when good', function() {
        const config = {
            bespinapi: {
                url: 'https://127.0.0.1:12345/api'
            }
        };
        const jobId = "541";
        const token = "abcdefg";
        const bespinApiClient = BespinApiClient(config);
        let result = '';
        function onValidToken(jobId) {
            result = 'Valid ' + jobId;
        }
        function onInvalidToken(error) {
            result = 'Error ' + error;
        }
        bespinApiClient.verifyToken(jobId, token, onValidToken, onInvalidToken);
        const error = '';
        const response = {
            statusCode: 200
        };
        lastRequest.func(error, response);
        expect(result).to.equal('Valid 541');
    });
    it('verifyToken() calls onInvalidToken when bad with null response', function() {
        const config = {
            bespinapi: {
                url: 'https://127.0.0.1:12345/api'
            }
        };
        const jobId = "541";
        const token = "abcdefg";
        const bespinApiClient = BespinApiClient(config);
        let result = '';
        function onValidToken(jobId) {
            result = 'Valid ' + jobId;
        }
        function onInvalidToken(error) {
            result = 'Error ' + error;
        }
        bespinApiClient.verifyToken(jobId, token, onValidToken, onInvalidToken);
        const error = 'bad';
        lastRequest.func(error, null);
        expect(result).to.equal('Error Checking authorization failed with:bad');
    });
    it('verifyToken() calls onInvalidToken when bad 404 response', function() {
        const config = {
            bespinapi: {
                url: 'https://127.0.0.1:12345/api'
            }
        };
        const jobId = "541";
        const token = "abcdefg";
        const bespinApiClient = BespinApiClient(config);
        let result = '';
        function onValidToken(jobId) {
            result = 'Valid ' + jobId;
        }
        function onInvalidToken(error) {
            result = 'Error ' + error;
        }
        bespinApiClient.verifyToken(jobId, token, onValidToken, onInvalidToken);
        const error = 'bad';
        const response = {
            statusCode: 404,
            error: 'oops'
        };
        lastRequest.func(error, response);
        expect(result).to.equal('Error Checking authorization failed with:bad (404)');
    });
});