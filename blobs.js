var pull = require('pull-stream')
var ssbHash = require('pull-hash/ext/ssb')
var multicb = require('multicb')

// sbot.blobs.add function decorator
// that returns a function that complies with the spec at
// - http://scuttlebot.io/apis/scuttlebot/blobs.html#add-sink
// - http://scuttlebot.io/docs/advanced/publish-a-file.html
// 
// Temporary solution until muxrpc supports sinks that can callback
// with arguments.
// See ssb thread for details:
// https://viewer.scuttlebot.io/%252YFBVzniDPuuyLnLk%2FsYSbIJzjhS7ctEIOv5frt9n9Q%3D.sha256

module.exports = function(blobs_add, blobs_rm) {
  return function addBlobRaw(hash, cb) {
    if ('function' === typeof hash) {
      cb = hash
      hash = undefined
    }
    // taken from ssb-git-repo/lib/repo.js
    // work around sbot.blobs.add not calling back with blob id
    var done = multicb({ pluck: 1, spread: true })
    var sink = pull(
      ssbHash(done()),
      blobs_add(done())
    )
    done(function(err, link) {
      if (err || 'undefined' === typeof hash || hash == link) cb(err, link)
      else {
        blobs_rm(link, function(err) {
          cb(new Error('Invalid blob hash value. expected: ' + hash + ', actual: ' + link))
          if (err) console.error('Unable to blobs.rm blob with invalid hash', link, err)
        })
      }
    })
    return sink
  }
}
