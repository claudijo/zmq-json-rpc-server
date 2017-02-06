var assert = require('assert');
var zmq = require('zeromq');
var zmqJsonRpcServer = require('..');

describe('ZMQ JSON-RPC Server', function() {
  beforeEach(function() {
    this.fakeClient = zmq.socket('dealer');
    this.fakeClient.connect('ipc://some-endpoint');
  });

  it('should expose underlying zmq socket', function() {
    var rpc = zmqJsonRpcServer('ipc://some-endpoint');
    assert(rpc.socket.constructor === zmq.Socket);
    rpc.socket.close();
  });

  it('should receive notification from client with specified endpoint', function(done) {
    var rpc = zmqJsonRpcServer('ipc://some-endpoint');

    rpc.on('foo', function(params) {
      assert(params === 'bar');
      rpc.socket.close();
      done();
    });

    this.fakeClient.send('{"jsonrpc": "2.0", "method": "foo", "params": "bar"}');
  });

  it('should reply to request sent from client', function(done) {
    var rpc = zmqJsonRpcServer('ipc://some-endpoint');

    rpc.on('subtract', function(params, reply) {
      reply(null, params.minuend - params.subtrahend);
    });

    this.fakeClient.send('{"jsonrpc": "2.0", "method": "subtract", "params": {"subtrahend": 23, "minuend": 42}, "id": 1}');

    this.fakeClient.on('message', function(data) {
      var reply = JSON.parse(data);
      assert(reply.result === 42 - 23);
      rpc.socket.close();
      done();
    });
  });

  it('should ignore JSON-RPC requests if providing invalid version', function(done) {
    var rpc = zmqJsonRpcServer('ipc://some-endpoint');

    rpc.on('foo', function() {
      assert(false);
    });

    this.fakeClient.send('{"method": "foo", "params": "bar"}');

    setTimeout(function() {
      rpc.socket.close();
      done();
    }, 200);
  });

  it('shoud accept `ignoreVersion` options', function(done) {
    var rpc = zmqJsonRpcServer('ipc://some-endpoint', { ignoreVersion: true });

    rpc.on('foo', function() {
      done();
      rpc.socket.close();
    });

    this.fakeClient.send('{"method": "foo", "params": "bar"}');
  });

  describe('with multiple clients', function() {
    beforeEach(function() {
      this.secondFakeClient = zmq.socket('dealer');
      this.secondFakeClient.connect('ipc://some-endpoint');
    });

    it('should reply to individual clients', function(done) {
      var rpc = zmqJsonRpcServer('ipc://some-endpoint');

      var replyCount = 0;

      var finishIfReady = function() {
        if (replyCount === 2) {
          rpc.socket.close();
          done();
        }
      };

      rpc.on('subtract', function(params, reply) {
        reply(null, params.minuend - params.subtrahend);
      });

      this.fakeClient.send('{"jsonrpc": "2.0", "method": "subtract", "params": {"subtrahend": 23, "minuend": 42}, "id": 1}');
      this.secondFakeClient.send('{"jsonrpc": "2.0", "method": "subtract", "params": {"subtrahend": 18, "minuend": 71}, "id": 2}');

      this.fakeClient.on('message', function(data) {
        var reply = JSON.parse(data);
        assert(reply.result === 42 - 23);
        replyCount += 1;

        finishIfReady();
      })

      this.secondFakeClient.on('message', function(data) {
        var reply = JSON.parse(data);
        assert(reply.result === 71 - 18);
        replyCount += 1;

        finishIfReady();
      })
    });
  });


});
