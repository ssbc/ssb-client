'use strict'
var path        = require('path')
var ssbKeys     = require('ssb-keys')
var explain     = require('explain-error')
var path        = require('path')
var fs          = require('fs')

var MultiServer = require('multiserver')
var WS          = require('multiserver/plugins/ws')
var Net         = require('multiserver/plugins/net')
var Shs         = require('multiserver/plugins/shs')

var muxrpc      = require('muxrpc')
var pull        = require('pull-stream')

function toSodiumKeys(keys) {
  if(!keys || !keys.public) return null
  return {
    publicKey:
      new Buffer(keys.public.replace('.ed25519',''), 'base64'),
    secretKey:
      new Buffer(keys.private.replace('.ed25519',''), 'base64'),
  }
}

var cap =
  new Buffer('1KHLiKZvAvjbY1ziZEHMXawbCEIM6qwjCDm3VYRan/s=', 'base64')

var createConfig = require('ssb-config/inject')

module.exports = function (keys, opts, cb) {
  var config
  if (typeof keys == 'function') {
    cb = keys
    keys = null
    opts = null
  }
  else if (typeof opts == 'function') {
    cb = opts
    opts = keys
    keys = null
  }
  if(typeof opts === 'string' || opts == null || !keys)
    config = createConfig(typeof opts === 'string' ? opts : null)
  else
    config = {}
  keys = keys || ssbKeys.loadOrCreateSync(path.join(config.path, 'secret'))
  opts = opts || {}

  var remote
  if(opts.remote)
    remote = opts.remote
  else {
    var host = opts.host || 'localhost'
    var port = opts.port || config.port || 8008
    var key = opts.key || keys.id

    remote = 'net:'+host+':'+port+'~shs:'+key.substring(1).replace('.ed25519', '')
  }

  var manifest = opts.manifest || (function () {
    try {
      return JSON.parse(fs.readFileSync(
        path.join(config.path, 'manifest.json')
      ))
    } catch (err) {
      throw explain(err, 'could not load manifest file')
    }
  })()

  var shs = Shs({
    keys: toSodiumKeys(keys),
    appKey: opts.appKey || cap,

    //no client auth. we can't receive connections anyway.
    auth: function (cb) { cb(null, false) },
    timeout: config.timers && config.timers.handshake || 3000
  })

  var ms = MultiServer([
    [Net({}), shs],
    [WS({}), shs]
  ])

  ms.client(remote, function (err, stream) {
    if(err) return cb(explain(err, 'could not connect to sbot'))
    var sbot = muxrpc(manifest, false)()
    sbot.id = '@'+stream.remote.toString('base64')+'.ed25519'
    pull(stream, sbot.createStream(), stream)
    cb(null, sbot)
  })
}


