var MultiServer = require('multiserver')
var WS          = require('multiserver/plugins/ws')
var Net         = require('multiserver/plugins/net')
var Onion       = require('multiserver/plugins/onion')
var Shs         = require('multiserver/plugins/shs')
var NoAuth      = require('multiserver/plugins/noauth')
var UnixSock    = require('multiserver/plugins/unix-socket')
const decodeAddress = require('multiserver-address').decode
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
  var manifest = opts.manifest

  // todo: refactor multiserver so that muxrpc is a transform.
  // then we can upgrade muxrpc's codec!

  const ms = makeMultiServer(opts, remote)

  ms.client(remote, function (err, stream) {
    if (err) {
      return cb(explain(err, 'could not connect to sbot'))
    }

    // HACK: This refers to the *remote* feed ID, not our local ID, and we don't
    // actually have a way of determining the feed type. This is fine when all
    // feeds are ed25519, but will cause problems in the future.
    const remoteId = `@${stream.remote.toString('base64')}.ed25519`

    const patch = (sbot) => {
      // fix blobs.add. (see ./util/fix-add-blob.js)
      if (sbot.blobs && sbot.blobs.add) {
        sbot.blobs.add = fixBlobsAdd(sbot.blobs.add)
      }

      // This refers to the *remote* feed ID, and gives us a quick and easy way
      // to reference the server without calling `whoami()`. These may share a
      // value when the client and server share an identity, but won't be the
      // same when connecting to a remote server with a different identity.
      if (sbot.id == null) {
        sbot.id = remoteId
      }

      return sbot
    }

    // Call `cb()` during the callback when no manifest is passed.
    if (manifest == null) {
      manifest = (err) => {
        if (err) {
          return cb(err)
        }

        cb(null, patch(sbot), config)
      }
    }

    const sbot = muxrpc(manifest, false, null, remoteId)

    // Explicitly call `cb()` when an explicit manifest is passed.
    if (typeof manifest !== 'function') {
      cb(null, patch(sbot), config)
    }

    pull(stream, sbot.stream, stream)
  })
}

function makeMultiServer(opts, remote) {
  // find out what transports and protocols
  // we actually need to connect to 'remote'
  const addresses = decodeAddress(remote)
  const requiredPlugins = {}
  addresses.forEach(address=>{
    address.forEach(({name})=> requiredPlugins[name] = true)
  })

  // make shs instance, if needed
  const shs = requiredPlugins.shs && Shs({
    keys: toSodiumKeys(opts.keys),
    appKey: opts.config.caps.shs,

    // no client auth. we can't receive connections anyway.
    auth: function (cb) { cb(null, false) },
    timeout: opts.config.timers && config.timers.handshake || 3000
  })

  // make noauth instance, if needed
  const noauth = requiredPlugins.noauth && NoAuth({
    keys: toSodiumKeys(opts.keys)
  })

  const stack = []
  if (requiredPlugins.net && shs) {
    stack.push(
      [Net({}), shs]
    )
  }
  if (requiredPlugins.onion && shs) {
    stack.push(
      [Onion({}), shs]
    )
  }
  if (requiredPlugins.ws && shs) {
    stack.push(
      [WS({}), shs]
    )
  }
  if (requiredPlugins.unix && noauth) {
    stack.push(
      [UnixSock({}), noauth]
    )
  }
  if (requiredPlugins.net && noauth) {
    stack.push(
      [Net({}), noauth]
    )
  }

  return MultiServer(stack)
}
