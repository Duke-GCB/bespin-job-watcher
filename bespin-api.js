var request = require('request');


function BespinApi(config) {
    return {
        verifyToken: function (jobId, token, onValidToken, onInvalidToken) {
            console.log(jobId, token, onValidToken, onInvalidToken);
            var options = this.makeRequestOptions(jobId, token);
            request(options, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    onValidToken(jobId);
                } else {
                    var errorMessage = 'Checking authorization failed with status:' + response.statusCode + ":" + error;

                    onInvalidToken(errorMessage);
                }
            });
        },
        makeURL: function(jobId) {
            return 'http://'+ config.bespinapihost + ':' + config.bespinapiport + '/api/jobs/' + jobId + '/';
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

module.exports = BespinApi;