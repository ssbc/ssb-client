var pull       = require('pull-stream')
var muxrpc     = require('muxrpc')
var address    = require('ssb-address')
var ws         = require('pull-ws-server')
var Serializer = require('pull-serializer')
var ssbKeys    = require('ssb-keys')
var manifest   = require('ssb-manifest')
var createMsg  = require('secure-scuttlebutt/message')(require('secure-scuttlebutt/defaults'))

module.exports = function (keys, addr, cb) {
  var client = muxrpc(manifest, false, serialize)()
  client.keys = keys

  var wsStream
  var rpcStream

  client.connect = function(addr, cb) {
    addr = address(addr)
    if (wsStream) {
      wsStream.socket.close()
      client._emit('reconnecting')
    }

    client.addr = addr
    wsStream = ws.connect(addr)
    rpcStream = client.createStream()
    pull(wsStream, rpcStream, wsStream)

    wsStream.socket.onopen = function() {
      client._emit('connect')

      client.auth(function (err) {
        if (err)
          client._emit('error', err)
        else
          client._emit('authed')
        cb && cb(err)
      })
    }

    wsStream.socket.onclose = function() {
      rpcStream.close(new Error('broken link'), function(){})
      client._emit('error', new Error('Close'))
    }
  }

  client.close = function(cb) {
    wsStream.socket.close()
    rpcStream.close(function () {
      cb && cb()
    })
  }

  client.reconnect = function(opts) {
    opts = opts || {}
    client.close(function() {
      if (opts.wait)
        setTimeout(client.connect.bind(client, client.addr), opts.wait)
      else
        client.connect(client.addr)
    })
  }

  client.publish = function (content, cb) {
    // :TODO: get prev
    var prev = null
    var msg = createMsg(client.keys, null, content, prev)
    rpc.add(msg, cb)
  }

  client.auth = function (cb) {
    var authReq = ssbKeys.signObj(client.keys, {
      role: 'client',
      ts: Date.now(),
      public: client.keys.public
    })
    rpc.auth(authReq, cb)
  }

  client.connect(addr, cb)
  return client
}

function serialize (stream) {
  return Serializer(stream, JSON, {split: '\n\n'})
}