var fs = require('fs');
var path = require('path');
var EventSocket = require('/event-socket/event-socket');
var es = new EventSocket('ws://event-socket:8080/');

es.bind('open', function() {
  console.log('OPENED');
  var count = 0;

  es.bind('pong', function(resp) {
    console.log('PONG: ', resp);
    setTimeout(function() {
      es.send('ping', resp+=1);
    }, 3000);
  });

  es.send('ping', count);

  var testfile = "test.js";
  var filestream = fs.createReadStream(testfile);
  es.pipe(filestream, { filename: path.basename(testfile) });
});

