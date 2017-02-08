/**
 * Runs http server that serves up index.html and can have websocket support added to httpserver.
 */
var http = require('http');
var fs = require('fs');
var url = require('url');

function WebServer(config) {
    var host = config.webserverhost;
    var port = config.webserverport;
    var httpserver = http.createServer(handleHTTPRequest);
    return {
        httpserver: httpserver,
        listen: function() {
            httpserver.listen(port, host);
        }
    };
}

function handleHTTPRequest(req, res) {
    var path = url.parse(req.url).pathname;
    console.log(path);
    switch (path) {
        case '/':
        case '/index.html':
            console.log(process.cwd() + '/index.html');
            fs.readFile(process.cwd() + '/index.html', function (err, data) {
                if (err) return send404(res);
                console.log('oko');
                res.writeHead(200, {'Content-Type': 'text/html'});
                res.write(data, 'utf8');
                res.end();
            });
            break;
        default:
            console.log('up');
            res.writeHead(404);
            res.write('404');
            return res.end();
    }
}

module.exports = WebServer;