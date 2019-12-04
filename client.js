var MultiServer = require('multiserver')
var WS          = require('multiserver/plugins/ws')
var Net         = require('multiserver/plugins/net')
var Onion       = require('multiserver/plugins/onion')
var Shs         = require('multiserver/plugins/shs')
var NoAuth      = require('multiserver/plugins/noauth')
var UnixSock    = require('multiserver/plugins/unix-socket')
var explain     = require('explain-error')

var muxrpc      = require('muxrpc')
var pull        = require('pull-stream')

var fixBlobsAdd = require('./util/fix-add-blob')
var toSodiumKeys = require('./util/to-sodium-keys')
var assertHas = require('./util/assert-has')

module.exports = function (opts, cb) {
  assertHas(opts, 'keys')
  assertHas(opts, 'remote')
  assertHas(opts, 'config')

  var keys = opts.keys
  var remote = opts.remote
  var config = opts.config

  var shs = Shs({
    keys: toSodiumKeys(keys),
    appKey: opts.config.caps.shs,

    //no client auth. we can't receive connections anyway.
    auth: function (cb) { cb(null, false) },
    timeout: config.timers && config.timers.handshake || 3000
  })

  //todo: refactor multiserver so that muxrpc is a transform.
  //then we can upgrade muxrpc's codec!

  var noauth = NoAuth({
    keys: toSodiumKeys(keys)
  })

  //I think it would be better to make these registerable plugins,
  //that got connected up when you called. so they are not hard coded here.

  var ms = MultiServer([
    [Net({}), shs],
    [Onion({}), shs],
    [WS({}), shs],
    [UnixSock({}), noauth],
    [Net({}), noauth]
  ])

  ms.client(remote, function (err, stream) {
    if(err) {
      return cb(explain(err, 'could not connect to sbot'))
    }

    // HACK: This refers to the *remote* feed ID, not our local ID, and we don't
    // actually have a way of determining the feed type. This is fine when all
    // feeds are ed25519, but will cause problems in the future.
    const remoteId = `@${stream.remote.toString('base64')}.ed25519`

    const sbot = muxrpc((err) => {
      if (err) {
        return cb(err)
      }

      // fix blobs.add. (see ./util/fix-add-blob.js)
      if (sbot.blobs && sbot.blobs.add) {
        sbot.blobs.add = fixBlobsAdd(sbot.blobs.add)
      }

      // This refers to the *local* feed ID, and gives us a quick and easy way
      // to reference ourselves without calling `whoami()`. These may share a
      // value when the client and server share an identity, but won't be the
      // same when connecting to a remote server.
      if (sbot.id == null) {
        sbot.id = opts.keys.id
      }

      cb(null, sbot, config)
    }, false, null, remoteId)

    pull(stream, sbot.stream, stream)
  })
}
