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

var fixBlobsAdd = require('./blobs')

function toSodiumKeys(keys) {
  if(!keys || !keys.public) return null
  return {
    publicKey:
      new Buffer(keys.public.replace('.ed25519',''), 'base64'),
    secretKey:
      new Buffer(keys.private.replace('.ed25519',''), 'base64'),
  }
}

function assertHas(opts, key) {
  if(!Object.hasOwnProperty.call(opts, key))
    throw new Error('ssb-client:'+key + ' option *must* be provided')
}

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
    var sbot = muxrpc(manifest, false, null, '@'+stream.remote.toString('base64')+'.ed25519')

    // fix blobs.add. (see ./blobs.js)
    if (sbot.blobs && sbot.blobs.add)
      sbot.blobs.add = fixBlobsAdd(sbot.blobs.add)

    pull(stream, sbot.stream, stream)
    cb(null, sbot, config)
  })
}

