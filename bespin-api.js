const request = require('request');

function BespinApiClient(config) {
    return {
        verifyToken: function (jobId, token, onValidToken, onInvalidToken) {
            const options = this.makeRequestOptions(jobId, token);
            request(options, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    onValidToken(jobId);
                } else {
                    const errorMessage = 'Checking authorization failed with status:' + response.statusCode + ":" + error;
                    onInvalidToken(errorMessage);
                }
            });
        },
        makeURL: function(jobId) {
            const protocol = config.bespinapi.protocol;
            const host = config.bespinapi.host;
            const port = config.bespinapi.port;
            return protocol + '://'+ host + ':' + port + '/api/jobs/' + jobId + '/';
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
