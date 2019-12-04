'use strict'
var path        = require('path')
var ssbKeys     = require('ssb-keys')
var explain     = require('explain-error')
var fs          = require('fs')

var createConfig = require('ssb-config/inject')
var createClient = require('./client')

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

  createClient({
    keys: keys,
    config: config,
    remote: remote
  }, cb)

}



