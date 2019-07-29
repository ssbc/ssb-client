'use strict'
var pull = require('pull-stream')
var ssbHash = require('pull-hash/ext/ssb')
var multicb = require('multicb')

function isFunction(f) {
 return 'function' === typeof f
}

// sbot.blobs.add function decorator
// that returns a function that complies with the spec at
// - http://scuttlebot.io/apis/scuttlebot/blobs.html#add-sink
// - http://scuttlebot.io/docs/advanced/publish-a-file.html
//
// Temporary solution until muxrpc supports sinks that can callback
// with arguments.
// See ssb thread for details:
// https://viewer.scuttlebot.io/%252YFBVzniDPuuyLnLk%2FsYSbIJzjhS7ctEIOv5frt9n9Q%3D.sha256

module.exports = function fixAddBlob(add) {
  return function (hash, cb) {
    if (typeof hash === 'function') cb = hash, hash = null
    var done = multicb({ pluck: 1, spread: true })
    var sink = pull(
      ssbHash(done()),
      pull.collect(done())
    )
    done(function(err, actualHash, buffers) {
      if (hash && hash !== actualHash) return cb(new Error('Invalid blob hash value. expected: ' + hash + ', actual: ' + actualHash))
      pull(
        pull.values(buffers),
        add(hash, function(err) {
          if(isFunction(cb))
          {
            cb(err, actualHash)
          }
        })
      )
    })
    return sink
  }
}

