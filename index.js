'use strict'
var path        = require('path')
var ssbKeys     = require('ssb-keys')
var explain     = require('explain-error')
var path        = require('path')
var fs          = require('fs')

var MultiServer = require('multiserver')
var WS          = require('multiserver/plugins/ws')
var Net         = require('multiserver/plugins/net')
var Onion       = require('multiserver/plugins/onion')
var Shs         = require('multiserver/plugins/shs')

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

//load cap from config instead!
var cap = '1KHLiKZvAvjbY1ziZEHMXawbCEIM6qwjCDm3VYRan/s='

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
    config = createConfig((typeof opts === 'string' ? opts : null) || process.env.ssb_appname)
  else if(opts && 'object' === typeof opts)
    config = opts

  keys = keys || ssbKeys.loadOrCreateSync(path.join(config.path, 'secret'))
  opts = opts || {}

  var appKey = new Buffer((opts.caps && opts.caps.shs) || cap, 'base64')

  var remote
  if(opts.remote)
    remote = opts.remote
  else {
    var host = opts.host || 'localhost'
    var port = opts.port || config.port || 8008
    var key = opts.key || keys.id

    var protocol = 'net:'
    if (host.endsWith(".onion"))
        protocol = 'onion:'
    remote = protocol+host+':'+port+'~shs:'+key.substring(1).replace('.ed25519', '')
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
    appKey: opts.appKey || appKey,

    //no client auth. we can't receive connections anyway.
    auth: function (cb) { cb(null, false) },
    timeout: config.timers && config.timers.handshake || 3000
  })

  var ms = MultiServer([
    [Net({}), shs],
    [Onion({}), shs],
    [WS({}), shs]
  ])

  ms.client(remote, function (err, stream) {
    if(err) return cb(explain(err, 'could not connect to sbot'))
    var sbot = muxrpc(manifest, false)()
    sbot.id = '@'+stream.remote.toString('base64')+'.ed25519'

    // fix blobs.add. (see ./blobs.js)
    if (sbot.blobs && sbot.blobs.add) sbot.blobs.add = fixBlobsAdd(
      sbot.blobs.add,
      sbot.blobs.rm
    )

    pull(stream, sbot.createStream(), stream)
    cb(null, sbot, config)
  })
}

