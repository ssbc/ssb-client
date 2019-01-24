var path        = require('path')
var ssbKeys     = require('ssb-keys') // TODO rm
var fs          = require('fs')
var Config      = require('ssb-config/inject')
var explain     = require('explain-error')
var SodiumKeys  = require('./util/sodium-keys')

module.exports = function buildConfig (keys, opts) {
  var config
  if(typeof opts === 'string' || opts == null || !keys)
    config = Config((typeof opts === 'string' ? opts : null) || process.env.ssb_appname)
  else if(opts && 'object' === typeof opts)
    config = opts

  // NOTE keys is loaded by the new ssb-config!
  keys = keys || ssbKeys.loadOrCreateSync(path.join(config.path, 'secret'))
  opts = opts || {}

  var remote
  if(opts.remote)
    remote = opts.remote
  else {
    var host = opts.host || config.host || 'localhost'
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

  return {
    appKey: (opts.caps && opts.caps.shs && Buffer.from(opts.caps.shs, 'base64')) || (config.caps && config.caps.shs && Buffer.from(config.caps.shs, 'base64')),
    keys: keys,
    manifest: manifest,
    remote: remote,
    sodiumKeys: SodiumKeys(keys),
    timeout: (opts.timers && opts.timers.handshake) || (config.timers && config.timers.handshake) || 3000
  }
}
