'use strict'
var explain     = require('explain-error')

var MultiServer = require('multiserver')
var WS          = require('multiserver/plugins/ws')
var Net         = require('multiserver/plugins/net')
var Onion       = require('multiserver/plugins/onion')
var Shs         = require('multiserver/plugins/shs')
var NoAuth      = require('multiserver/plugins/noauth')
var UnixSock    = require('multiserver/plugins/unix-socket')

var muxrpc      = require('muxrpc')
var pull        = require('pull-stream')

var buildConfig = require('./build-config')
var fixBlobsAdd = require('./blobs')
var SodiumKeys  = require('./util/sodium-keys')


module.exports = function (keys, opts, cb) {
  var config = buildConfig(keys, opts, cb)

  var shs = Shs({
    keys: SodiumKeys(keys),
    appKey: config.appKey,

    //no client auth. we can't receive connections anyway.
    auth: function (cb) { cb(null, false) },
    timeout: config.timeout
  })

  var ms = MultiServer([
    [Net({}), shs],
    [Onion({}), shs],
    [WS({}), shs],
    [UnixSock({}), NoAuth({
      keys: SodiumKeys(keys)
    })],
    [Net({}), NoAuth({
      keys: SodiumKeys(keys)
    })]
  ])

  ms.client(config.remote, function (err, stream) {
    if(err) return cb(explain(err, 'could not connect to sbot'))
    var sbot = muxrpc(config.manifest, false)()
    sbot.id = '@'+stream.remote.toString('base64')+'.ed25519'

    // fix blobs.add. (see ./blobs.js)
    if (sbot.blobs && sbot.blobs.add)
      sbot.blobs.add = fixBlobsAdd(sbot.blobs.add)

    pull(stream, sbot.createStream(), stream)
    cb(null, sbot, config)
  })
}
