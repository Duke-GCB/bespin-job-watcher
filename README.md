# bespin-job-watcher
Allows users to receive job status notification updates for [bespin-api](https://github.com/Duke-GCB/bespin-api).
Server subscribes to a rabbitmq exchange named 'job_status' and sends job status notifications to Websockets
that have presented valid credentials for those jobs.

## Requirements:
- [nodejs 6.9.5+](https://nodejs.org/en/) - installed 
- [Rabbitmq](http://www.rabbitmq.com/) - running instance
- [bespin-api](https://github.com/Duke-GCB/bespin-api) - running instance

## Setup:
#### Install node modules
```
npm install
```

#### Update Config
Edit config.json changing it as necessary for RabbitMQ and bespin-api. 

As long as both are running locally the default values in config.json should be fine.

## Run
```
node index.js
```

## Demo Webpage
Browse to demo webpage: [http://localhost:8080/](http://localhost:8080/)

- Enter a user token from bespin-api and a job id owned by the specified token.
- Click `Start Watching(add)`.
At the bottom of the screen you will see any job messages as a JSON string.

Browse to your rabbitmq web portal (If locally running rabbit [http://127.0.0.1:15672](http://127.0.0.1:15672)).
- Click Exchanges
- Click __job_status__
- Expand __Publish message__ 
- Enter a job status payload in JSON format. Example `{"job":"123", "state":"R"}`.
- Click __Publish Message__
If you subscribed to this message you should see this message show up at the bottom of the Demo webpage.

## Usage
Users should connect a websocket and send an __add__ message passing the __jobId__ and their bespin-api __authToken__.
The websocket will receive the messages of status "ok" or "error".

Example good message:
```
{
  "status":"ok",
  "data":{
    "job":"16",
    "state":"R",
    "step":"V"
  }
}
```
Example error message:
```
{
  "status":"error",
  "data":{
    "message":"Checking authorization failed with status:404:null"
  }
}
```
See static/index.html for sample Javascript.


## Run with https
#### Create certificates
```
mkdir sslcert
cd sslcert && openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes && cd ..
```
You can just hit enter for all the openssl prompts.

#### Update config.json
You must specify the locations of the key and cert at listenOn.key and listenOn.cert:
```
...
  "listenOn": {
     "key": "sslcert/key.pem",
     "cert": "sslcert/cert.pem",
...
```

#### Update static/index.html
You will need to change the sample test program to use the __wss__ protocol instead of __ws__.
```
<script>
   ...
   var ws = new WebSocket('wss://' + host + ':8080');
   ...
```

#### Run as you normally would
```
node index.js
```

## Running in docker
A docker container is automatically built for this repo at [quay.io/repository/dukegcb/bespin-job-watcher](https://quay.io/repository/dukegcb/bespin-job-watcher).
It can be run from the command line like so:
```
docker run quay.io/dukegcb/bespin-job-watcher 
```
You can override the configuration by creating a file externally and overriding /usr/src/app/config.json inside the container.





