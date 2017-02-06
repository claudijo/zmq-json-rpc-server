# ZMQ JSON-RPC Server

JSON-RPC 2.0 server implementation using a ZeroMQ socket as transport mechanism. 
More precisely a `router` socket is used for the server, in line with the [asynchronous clients / servers pattern](http://zguide.zeromq.org/page:all#The-Asynchronous-Client-Server-Pattern)
of ZeroMQ.

For corresponding client implementation, see [zmq-json-rpc-client](https://github.com/claudijo/zmq-json-rpc-client).

## Installation

```
npm install zmq-json-rpc-client
```

## Usage

Create a JSON RPC server with a ZeroMQ endpoint and receive requests or 
notifications.

### server = zmqJsonRpcServer(endpoint, options)

This module exports a factory faction that accepts a ZeroMQ endpoint, eg. 
`'tcp:127.0.0.1:3030'` and options. 

#### Options

Options can be passed to the factory function as an object, specified by the 
following keys and values.

##### ignoreVersion

Value: Boolean indicating if server should ignore the `jsonrpc` member in the
request. Defaults to `false`.

### server.on(method, callback)

Listens for a JSON-RPC request or notification. The callback will receive 
`params` and `reply` function arguments. The reply argument is a noop if the 
client sends a notification (e. request without an id member). The reply 
argument should be called with arguments `error` and `result`.

### server.socket

Exposes the underlying ZeroMQ socket object.

## Example

```js

var zmqJsonRpcServer = require('zmq-json-rpc-server');
var server = zmqJsonRpcServer('tcp:127.0.0.1');

// Listen for a notification
server.on('update', function(params) {
  // ..  
});

// Listen for a request and send reply
server.on('subtract', function(params, reply) {
  reply(null, params.minuend - params.subtrahend);
});

```

## Test

Run unit tests:

`$ npm test`

## License

MIT
