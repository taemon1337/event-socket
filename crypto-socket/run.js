var EventSocket = require('/event-socket/event-socket'),
    WebSocketServer = require('ws').Server,
    Transform = require('stream').Transform,
    PassThrough = require('stream').PassThrough,
    crypto = require('crypto'),
    port = process.env.PORT || 8080
  ;

var wss = new WebSocketServer({ port: port });

wss.on('connection', function(socket) {
  var es = new EventSocket(socket);
  var ciphers = {};
  var streams = {};

  es.on('stream:init', function(data) {
    if(data.id) {
      var cipher = null;

      if(data.decrypt || data.crypt === "decrypt") {
        cipher = crypto.createDecipher(data.cipher || 'aes-256-cbc', data.passphrase);
      } else {
        cipher = crypto.createCipher(data.cipher || 'aes-256-cbc', data.passphrase);
      }

      ciphers[data.id] = cipher;
      streams[data.id] = new PassThrough();
    } else {
      console.warn("No stream id provided");
    }
  });

  es.on('pipe', function(data) {
    if(streams[data.id]) {
      es.pipe(streams[data.id], data);
    }
  });

  es.on('stream', function(data) {
    if(data.chunk && ciphers[data.id]) {
      streams[data.id].write(ciphers[data.id].update(new Buffer(data.chunk, 'base64')));
    } else {
      console.log("No chunk or invalid cipher id supplied!", data);
    }
  });

  es.on('stream:end', function(data) {
    if(streams[data.id]) {
      streams[data.id].write(ciphers[data.id].final());
      delete streams[data.id];
      delete ciphers[data.id];
    }
  });

});
