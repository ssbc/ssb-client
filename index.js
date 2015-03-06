var pull        = require('pull-stream')
var muxrpc      = require('muxrpc')
var address     = require('ssb-address')
var ws          = require('pull-ws-server')
var Serializer  = require('pull-serializer')
var ssbKeys     = require('ssb-keys')
var loadManf    = require('ssb-manifest/load')
var ssbFeed     = require('secure-scuttlebutt/feed')
var ssbDefaults = require('secure-scuttlebutt/defaults')

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
  
  var client = muxrpc(loadManf(config), { auth: 'async' }, serialize)({
    auth: function (req, cb) {
      // just pass-through. you're authed!
      cb()
    }
  })
  client.keys = keys

  var wsStream
  var rpcStream

  client.connect = function(addr, cb) {
    if(isFunction(addr))
      cb = addr, addr = null

    addr = address(addr || config)
    client.addr = addr
    if (wsStream) {
      wsStream.close()
      client._emit('reconnecting')
    }

    var called = false
    wsStream = ws.connect(addr, {
      onOpen: function() {
        client._emit('connect')
        if(called) return
        called = true; cb && cb()
      },
      onClose: function() {
        client._emit('close')
        //rpcStream will detect close on it's own.
        if(called) return
        called = true; cb && cb()
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

  client.createFeed = function (keys) {
    return ssbFeed(this, keys, ssbDefaults)
  }

  return client
}

function serialize (stream) {
  return Serializer(stream, JSON, {split: '\n\n'})
}
