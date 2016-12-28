var EventSocket = require('/event-socket/event-socket'),
    WebSocketServer = require('ws').Server,
    archiver = require('archiver'),
    PassThrough = require('stream').PassThrough,
    port = process.env.PORT || 8080
  ;

var wss = new WebSocketServer({ port: port });

wss.on('connection', function(socket) {
  var es = new EventSocket(socket);
  var archive = archiver('zip', { store: false, zlib: { level: 0 }});
  var pipes = {}; // filename => passthru

  es.on('close', function() {
    archive = null;
  });

  es.on('pipe', function(data) {
    es.pipe(archive, data);
  });

  es.on('append', function(data) {
    console.log("ZIP APPEND: ", data);
    if(data.name) {
      var passthru = new PassThrough();
      archive.append(passthru, data);
      pipes[data.name] = passthru;
    } else {
      console.log("Zip append must have a 'name' option", data);
    }
  });

  es.on('stream', function(data) {
    if(data.chunk && data.name) {
      pipes[data.name].write(new Buffer(data.chunk, 'base64'));
//      pipes[data.name].write(base64.decode(data.chunk));
    } else {
      console.log("No chunk or name supplied!", data);
    }
  });

  es.on('stream:end', function(data) {
    pipes[data.name].end();
  });

  es.on('finalize', function() {
    archive.finalize();
  });
});
