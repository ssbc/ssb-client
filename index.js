var path    = require('path')
var ssbKeys = require('ssb-keys')
var config  = require('ssb-config')

var createSbot = require('scuttlebot')
  .use(require('scuttlebot/plugins/master'))
  .use(require('scuttlebot/plugins/gossip'))
  .use(require('scuttlebot/plugins/friends'))
  .use(require('scuttlebot/plugins/replicate'))
  .use(require('scuttlebot/plugins/blobs'))
  .use(require('scuttlebot/plugins/invite'))
  .use(require('scuttlebot/plugins/block'))
  .use(require('scuttlebot/plugins/local'))
  .use(require('scuttlebot/plugins/logging'))
  .use(require('scuttlebot/plugins/private'))

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

  createSbot.createClient({keys: keys})(opts, cb)
}