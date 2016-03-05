var path        = require('path')
var ssbKeys     = require('ssb-keys')
var config      = require('ssb-config')
var SecretStack = require('secret-stack')
var explain     = require('explain-error')
var path        = require('path')
var fs          = require('fs')

var cap =
  new Buffer('1KHLiKZvAvjbY1ziZEHMXawbCEIM6qwjCDm3VYRan/s=', 'base64')


module.exports = function (keys, opts, cb) {
  if (typeof keys == 'function') {
    cb = keys
    keys = null
    opts = null
  }  
  if (typeof opts == 'function') {
    cb = opts
    opts = null
  }

  keys = keys || ssbKeys.loadOrCreateSync(path.join(config.path, 'secret'))
  opts = opts || {}
  opts.host = opts.host || 'localhost'
  opts.port = opts.port || config.port
  opts.key  = opts.key  || keys.id

  var createNode = SecretStack({appKey: config.appKey || cap})

  var manifest = opts.manifest || (function () {
    try {
      return JSON.parse(fs.readFileSync(
        path.join(config.path, 'manifest.json')
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
