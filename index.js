var zmq = require('zeromq');
var jsonRpcServerStream = require('json-rpc-server-stream');
var routerSocketStream = require('./lib/router-socket-stream');

module.exports = function(endpoint, opts) {
  opts = opts || {};

  var socket = zmq.socket('router');
  var serverStream = jsonRpcServerStream(opts);
  var serverSocketStream = routerSocketStream().attach(socket);
  
  socket.bindSync(endpoint);
  
  serverStream.pipe(serverSocketStream).pipe(serverStream);

  serverStream.rpc.socket = socket;
  
  return serverStream.rpc;
};


