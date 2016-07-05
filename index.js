var path        = require('path')
var ssbKeys     = require('ssb-keys')
var SecretStack = require('secret-stack')
var explain     = require('explain-error')
var path        = require('path')
var fs          = require('fs')

var cap =
  new Buffer('1KHLiKZvAvjbY1ziZEHMXawbCEIM6qwjCDm3VYRan/s=', 'base64')

var createConfig = require('ssb-config/inject')

module.exports = function (keys, opts, cb) {
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

  if(typeof opts === 'string' || opts == null)
    opts = createConfig(opts)

  keys = keys || ssbKeys.loadOrCreateSync(path.join(opts.path, 'secret'))
  opts = opts || {}
  opts.host = opts.host || 'localhost'
  opts.port = opts.port || config.port
  opts.key  = opts.key  || keys.id

  var createNode = SecretStack({appKey: config.appKey || cap})

  var manifest = opts.manifest || (function () {
    try {
      return JSON.parse(fs.readFileSync(
        path.join(opts.path, 'manifest.json')
      ))
    } catch (err) {
      throw explain(err, 'could not load manifest file')
    }
  })()

  createNode.createClient({keys: keys, manifest: manifest})(opts, function (err, sbot) {
    if(err) err = explain(err, 'could not connect to sbot')
    cb(err, sbot)
  })
}



