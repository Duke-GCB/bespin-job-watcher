"use strict";
const request = require('request');

function BespinApiClient(config) {
    return {
        verifyToken: function (jobId, token, onValidToken, onInvalidToken) {
            const options = this.makeRequestOptions(jobId, token);
            request(options, function (error, response, body) {
                const statusCode = response && response.statusCode;
                if (!error && statusCode === 200) {
                    onValidToken(jobId);
                } else {
                    let errorMessage = 'Checking authorization failed with:' + error;
                    if (statusCode) {
                        errorMessage += " (" + statusCode + ")";
                    }
                    onInvalidToken(errorMessage);
                }
            });
        },
        makeURL: function(jobId) {
            return config.bespinapi.url + '/jobs/' + jobId + '/';
        },
        makeRequestOptions: function(jobId, token) {
            return {
                url: this.makeURL(jobId),
                headers: {
                        'Authorization': 'Token ' + token
                }
            };
        }
    };
}

module.exports = BespinApiClient;
