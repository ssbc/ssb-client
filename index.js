var pull       = require('pull-stream')
var muxrpc     = require('muxrpc')
var address    = require('ssb-address')
var ws         = require('pull-ws-server')
var Serializer = require('pull-serializer')
var ssbKeys    = require('ssb-keys')
var manifest   = require('ssb-manifest')
var createMsg  = require('secure-scuttlebutt/message')(require('secure-scuttlebutt/defaults'))

module.exports = function (keys, addr, readyCb) {
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

    var onopen_ = wsStream.socket.onopen
    wsStream.socket.onopen = function() {
      onopen_()
      client._emit('connect')

      client.auth(function (err, authed) {
        if (err)
          client._emit('error', err)
        else
          client._emit('authed', authed)
        cb && cb(err, authed)
      })
    }

    var onclose_ = wsStream.socket.onclose
    wsStream.socket.onclose = function() {
      onclose_ && onclose_()
      rpcStream.close(function(){})
      client._emit('close')
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
    client.getLatest(client.keys.id, function (err, prev) {
      if (!prev) {
        var init = createMsg(client.keys, null, { type: 'init', public: client.keys.public }, null)
        client.add(init, function (err, res) {
          if (err)
            return cb(err)
          prev = res.value
          next()
        })
      } else
        next()

      function next () {
        var msg = createMsg(client.keys, null, content, prev||null)
        client.add(msg, cb)
      }
    })
  }

  var auth_ = client.auth
  client.auth = function (cb) {
    var authReq = ssbKeys.signObj(client.keys, {
      role: 'client',
      ts: Date.now(),
      public: client.keys.public
    })
    auth_.call(client, authReq, cb)
  }

  client.connect(addr, readyCb)
  return client
}

function serialize (stream) {
  return Serializer(stream, JSON, {split: '\n\n'})
}