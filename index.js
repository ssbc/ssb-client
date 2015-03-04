var muxrpc     = require('muxrpc')
var Serializer = require('pull-serializer')
var chan       = require('ssb-channel')
var ssbKeys    = require('ssb-keys')
var manifest   = require('ssb-manifest')
var createMsg  = require('secure-scuttlebutt/message')(require('secure-scuttlebutt/defaults'))

module.exports = function (keys, address) {
  var rpc    = muxrpc(manifest, false, serialize)()
  var client = chan.connect(ssb, address)
  client.keys = keys

  copyApi(manifest, rpc, client)

  client.add = function (content, cb) {
    // :TODO: get prev
    var prev = null
    var msg = createMsg(keys, null, content, prev)
    rpc.add(msg, cb)
  }

  client.auth = function (cb) {
    var authReq = ssbKeys.signObj(keys, {
      role: 'client',
      ts: Date.now(),
      public: keys.public
    })
    rpc.auth(authReq, cb)
  }

  client.on('connect', function () {
    client.auth(function (err) {
      if (err)
        client.emit('error', err)
      else
        client.emit('authed')
    })
  })

  return client
}

function serialize (stream) {
  return Serializer(stream, JSON, {split: '\n\n'})
}

function copyApi (manifest, src, dst) {
  for (var k in manifest) {
    if (typeof manifest[k] == 'object') {
      dst[k] = {}
      copyApi(manifest[k], src[k], dst[k])
    } else {
      dst[k] = src[k]
    }
  }
}