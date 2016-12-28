"use strict";

(function(exports) {
  var root = this;
  var WebSocket = WebSocket || require('ws');

  var EventSocket = function(url_or_socket) {
    if(!(this instanceof EventSocket)) {
      return new EventSocket(url_or_socket);
    }
    var conn = null;

    if(typeof url_or_socket === 'string') {
      var conn = new WebSocket(url_or_socket);
    } else {
      var conn = url_or_socket;
    }

    var callbacks = {};

    this.on = this.bind = function(event_name, callback) {
      callbacks[event_name] = callbacks[event_name] || [];
      callbacks[event_name].push(callback);
      return this; //chainable
    };

    this.send = function(event_name, event_data) {
      var payload = JSON.stringify({ event: event_name, data: event_data });
      conn.send(payload);
      return this;
    };

    this.pipe = function(stream, data) {
      var stream_id = Math.random().toString().replace(".","");
      var count = 0;

      stream.on('data', function(chunk) {
        var encoded = new Buffer(chunk, 'binary').toString('base64');
        var evt_data = { id: stream_id, count: count, chunk: encoded };
        for(var key in data) { evt_data[key] = data[key]; }

        var payload = JSON.stringify({ event: "stream", data: evt_data });
        console.log("PAYLOAD: ", payload);
        conn.send(payload);
        count += 1;
      });

      stream.on('end', function() {
        var evt_data = { id: stream_id, count: count };
        for(var key in data) { evt_data[key] = data[key]; }
        var payload = JSON.stringify({ event: "stream:end", data: evt_data });
        conn.send(payload);
      });

      return this;
    };

    conn.onmessage = function(evt) {
      var json = JSON.parse(evt.data);
      dispatch(json.event, json.data);
      if(json.data.subevent) {
        // es.on('create:user', createPerson)
        // es.on('stream:zip', handleZipStream)
        dispatch([json.event,json.data.subevent].join(':'), json.data);
      }
    };

    conn.onclose = function() { dispatch('close', null) }
    conn.onopen = function() { dispatch('open',null) }

    var dispatch = function(event_name, message) {
      var chain = callbacks[event_name];
      if(typeof chain === 'undefined') { return; }
      for(var i=0; i < chain.length; i++) {
        chain[i]( message );
      }
    };
  };

  if(typeof module === 'undefined') {
    exports = EventSocket;
  } else {
    exports = module.exports = EventSocket;
  }

})(typeof exports === 'undefined' ? this.EventSocket = {} : exports);
