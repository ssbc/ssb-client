'use strict'
var explain = require('explain-error')

var MultiServer = require('multiserver')
var WS          = require('multiserver/plugins/ws')
var Net         = require('multiserver/plugins/net')
var Shs         = require('multiserver/plugins/shs')
var Onion       = require('multiserver/plugins/onion')
var NoAuth      = require('multiserver/plugins/noauth')
var UnixSock    = require('multiserver/plugins/unix-socket')
var pull        = require('pull-stream')
var muxrpc      = require('muxrpc')

var buildConfig = require('./build-config')
var fixBlobsAdd = require('./blobs')

function Client (keys, opts, cb) {
  if (typeof keys === 'function') return Client(null, null, keys)
  if (typeof opts === 'function') return Client(null, keys, opts)

  var config = buildConfig(keys, opts)

  var shs = Shs({
    keys: config.sodiumKeys,
    appKey: config.appKey,

    // no client auth. we can't receive connections anyway.
    auth: function (cb) { cb(null, false) },
    timeout: config.timeout
  })
  var noAuth = NoAuth({ keys: config.sodiumKeys })

  var ms = MultiServer([
    [Net({}), shs],
    [Onion({}), shs],
    [WS({}), shs],
    [UnixSock({}), noAuth],
    [Net({}), noAuth]
  ])

  ms.client(config.remote, function (err, stream) {
    if (err) return cb(explain(err, 'could not connect to sbot'))

    var sbot = muxrpc(config.manifest, false)()
    sbot.id = '@' + stream.remote.toString('base64') + '.' + (config.keys.curve || 'ed25519')

    // fix blobs.add. (see ./blobs.js)
    if (sbot.blobs && sbot.blobs.add) { sbot.blobs.add = fixBlobsAdd(sbot.blobs.add) }

    pull(stream, sbot.createStream(), stream)
    cb(null, sbot, config)
  })
}

module.exports = Client
