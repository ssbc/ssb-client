var pull       = require('pull-stream')
var muxrpc     = require('muxrpc')
var address    = require('ssb-address')
var ws         = require('pull-ws-server')
var Serializer = require('pull-serializer')
var ssbKeys    = require('ssb-keys')
var loadManf   = require('ssb-manifest/load')
var createMsg  = require('secure-scuttlebutt/message')(require('secure-scuttlebutt/defaults'))

function isFunction (f) {
  return 'function' === typeof f
}

function throwIfError(err) {
  if(err) throw err
}

module.exports = function (keys, config) {
  var manifest
  //if we are in the browser
  config = config || {}
  config.host = config.host || 'localhost'
  var client = muxrpc(loadManf(config), false, serialize)()
  client.keys = keys

  var wsStream
  var rpcStream

  client.connect = function(addr, cb) {
    if(isFunction(addr))
      cb = addr, addr = null

    addr = address(addr || config)
    if (wsStream) {
      wsStream.close()
      client._emit('reconnecting')
    }

    var called = false

    client.addr = addr

    //if auth is not the first method called,
    //then the other methods will get auth errors.
    //since rpc calls are queued, we can just do it here.
    client.auth(function (err, authed) {
      if (err)
        client._emit('error', err)
      else
        client._emit('authed', authed)
      if(called) return
      called = true; cb && cb(err, authed)
    })

    wsStream = ws.connect(addr, {
      onOpen: function() {
        client._emit('connect')
        //cb is called after auth, just above
      },
      onClose: function() {
        client._emit('close')
        //rpcStream will detect close on it's own.
        if(called) return
        called = true; cb && cb(err, authed)
      }
    })

    rpcStream = client.createStream()
    pull(wsStream, rpcStream, wsStream)

    return client
  }

  client.close = function(cb) {
    wsStream.close()
    rpcStream.close(cb ? cb : throwIfError)
    return client
  }

  client.reconnect = function(opts) {
    opts = opts || {}
    client.close(function() {
      if (opts.wait)
        setTimeout(client.connect.bind(client, client.addr), opts.wait)
      else
        client.connect(client.addr)
    })
    return client
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
    return client
  }

  var auth_ = client.auth
  client.auth = function (cb) {
    var authReq = ssbKeys.signObj(client.keys, {
      role: 'client',
      ts: Date.now(),
      public: client.keys.public
    })
    auth_.call(client, authReq, cb)
    return client
  }

  return client
}

function serialize (stream) {
  return Serializer(stream, JSON, {split: '\n\n'})
}
