var fs = require('fs'),
    path = require('path'),
    async = require('async'),
    EventSocket = require('/event-socket/event-socket'),
    es = new EventSocket('ws://zip-socket:8080/')
  ;

es.bind('open', function() {
  var output = fs.createWriteStream("output.zip");

  es.send("pipe", {});

  es.on("stream", function(data) {
    console.log("OUTPUT STREAM...", data);
    if(data.chunk) {
      output.write(new Buffer(data.chunk, 'base64'));
//      output.write(base64.decode(data.chunk));
    } else {
      console.log("Output Chunk missing: ", data);
    }
  });

  es.on("stream:end", function(data) {
    console.log("OUTPUT STREAM COMPLETE!");
    output.end();
  });

  setTimeout(function() {
    // Read each file in current directory and stream it to zip socket
    fs.readdir(".", function(err, files) {
      var appendStream = function(file, cb) {
        var readstream = fs.createReadStream(file);

        es.send("append", { name: path.basename(file) });

        es.pipe(readstream, {
          name: path.basename(file)
        });

        readstream.on('end', cb);
      };

      async.eachSeries(files, appendStream, function(err) {
        if(err) {
          console.error("Error Streaming Files: ", err);
        }
        console.log("All file streams complete, finalizing zip...");
        es.send("finalize", {});
      });
    });
  }, 3000);
});

