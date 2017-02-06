var Duplex = require('stream').Duplex;

module.exports = function() {
  var stream = new Duplex();
  var requestIdToSocketId = {};

  var messageListener = function(socketId, data) {
    var message;
    try {
      message = JSON.parse(data);
    } catch(err) {
      console.error('Error parsing incoming message', err);
      return;
    }

    if (Array.isArray(message)) {
      message.forEach(function(item) {
        if (item.id) {
          requestIdToSocketId[item.id] = socketId;
        }
      });
    } else {
      if (message.id) {
        requestIdToSocketId[message.id] = socketId;
      }
    }

    stream.push(data);
  };

  stream.socket = null;

  stream.attach = function(socket) {
    if (this.socket) {
      this.socket.removeListener('message', messageListener);
    }

    this.socket = socket;

    this.socket.addListener('message', messageListener);

    return this;
  };

  stream._write = function(chunk, encoding, callback) {
    if (!this.socket) {
      return callback(new Error('Missing socket'));
    }

    var data;
    var socketId;

    try {
      data = JSON.parse(chunk);
    } catch(err) {
      return callback(err);
    }

    // Assume everything in a reply array should go to same requester
    if (Array.isArray(data)) {
      data.forEach(function(item) {
        if (item.id) {
          socketId = requestIdToSocketId[item.id];
          delete requestIdToSocketId[item.id];
        }

      })
    } else {
      if (data.id) {
        socketId = requestIdToSocketId[data.id];
        delete requestIdToSocketId[data.id];
      }
    }

    if (!socketId) {
      return callback(new Error('Missing correlation id'));
    }

    this.socket.send([socketId, chunk]);
    callback();
  };

  stream._read = function(size) {};

  return stream;
};
