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
  assertHas(opts, 'manifest')

  var keys = opts.keys
  var remote = opts.remote
  var config = opts.config
  var manifest = opts.manifest

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
    if(err) return cb(explain(err, 'could not connect to sbot'))
    var id = '@'+stream.remote.toString('base64')+'.ed25519'
    // mix: id === config.keys.id, note sure why this is needed
    var sbot = muxrpc(manifest, false, null, id)

    // fix blobs.add. (see ./util/fix-add-blob.js)
    if (sbot.blobs && sbot.blobs.add)
      sbot.blobs.add = fixBlobsAdd(sbot.blobs.add)

    pull(stream, sbot.stream, stream)

    // mix: I've added this line because somewhere in the stack the id property was removed
    // and it's broken a bunch of code I've written
    if (!sbot.id) sbot.id = id

    cb(null, sbot, config)
  })
}
