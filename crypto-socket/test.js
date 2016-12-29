var fs = require('fs'),
    path = require('path'),
    EventSocket = require('/event-socket/event-socket'),
    es = new EventSocket('ws://crypto-socket:8080/')
  ;

es.bind('open', function() {
  var input = fs.createReadStream("plaintext.txt");
  var output = fs.createWriteStream("plaintext.txt.aes-256-cbc");

  es.send("pipe", {});

  es.pipe(input, { cipher: 'aes-256-cbc', passphrase: 'test' });

  es.on("stream", function(data) {
    console.log("OUTPUT STREAM...", data);
    if(data.chunk) {
      output.write(new Buffer(data.chunk, 'base64'));
    } else {
      console.log("Output Chunk missing: ", data);
    }
  });

});

