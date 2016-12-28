var EventSocket = require('./event-socket'),
    WebSocketServer = require('ws').Server,
    port = process.env.PORT || 8080
  ;

var wss = new WebSocketServer({ port: port });

wss.on('connection', function(socket) {
  console.log("CONNECTION");
  var es = new EventSocket(socket);

  es.send("welcome", "You are now connected.");

  es.on('ping', function(data) {
    es.send('pong', data);
  });

  es.on('stream', function(data) {
    console.log('STREAM DATA: ', data);
  });
});
