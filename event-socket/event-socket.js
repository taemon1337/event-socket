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

      stream.on('data', function(chunk) {
        var payload = JSON.stringify({
          id: stream_id,
          event: "stream",
          chunk: chunk.toString('base64'),
          data: data
        });
        conn.send(payload);
      });

      stream.on('end', function() {
        var payload = JSON.stringify({
          id: stream_id,
          event: "stream",
          chunk: null, 
          data: data
        });
        conn.send(payload);
      });

      return this;
    };

    conn.onmessage = function(evt) {
      var json = JSON.parse(evt.data);
      dispatch(json.event, json.data);
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
