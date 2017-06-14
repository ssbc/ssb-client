var test = require('tape')
var pull = require('pull-stream')
var decorate = require('../blobs.js')

var data = Buffer.from('Hey')
var expectedLink = "&WB1DdFcm4O5ikRF4v7OIfD/ildKe63QfDkD5HopwkHo=.sha256"

test('if called with no hash, returns underlying sink and returns hash', function(t) {

  t.plan(4)

  function blobs_add_mock(cb) {
    return pull.drain( function(buffer) {
      t.equal(buffer, data)
    }, function(err) {
      t.equal(err, null)
      cb(err);
    })
  }

  var addBlob = decorate(blobs_add_mock)
  pull(
    pull.once(data),
    addBlob(function(err, link) {
      t.equal(err, null)
      t.equal(link, expectedLink) 
    })
  )
})

test('if underlying sink errors, returns the rror', function(t) {

  t.plan(2)

  var error = new Error('things are not right')

  function blobs_add_mock(cb) {
    return pull(
      pull.asyncMap( function(x, cb) {
        cb(error);
      }), pull.drain( function() {
      }, cb)
    )
  }

  var addBlob = decorate(blobs_add_mock)
  pull(
    pull.once(data),
    addBlob(function(err, link) {
      t.equal(err, error)
      t.notOk(link) 
    })
  )
})
