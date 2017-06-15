var test = require('tape')
var pull = require('pull-stream')
var decorate = require('../blobs.js')

var data = Buffer.from('Hey')
var expectedLink = "&WB1DdFcm4O5ikRF4v7OIfD/ildKe63QfDkD5HopwkHo=.sha256"

test('if called with no hash, returns underlying sink and calls back with hash', function(t) {

  t.plan(5)

  function blobs_add_mock(hash, cb) {
    t.notOk(hash)
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

test('if underlying sink errors, call back with error', function(t) {

  t.plan(2)

  var error = new Error('things are not right')

  function blobs_add_mock(hash, cb) {
    t.notOk(hash)
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
    })
  )
})

test('if called with correct hash, behaves like called with no hash', function(t) {

  t.plan(5)

  function blobs_add_mock(hash, cb) {
    t.equal(hash, expectedLink)
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
    addBlob(expectedLink, function(err, link) {
      t.equal(err, null, 'should not error')
      t.equal(link, expectedLink, 'should return expected link') 
    })
  )
})

test('if called with incorrect hash, callback with error', function(t) {
  t.plan(1)

  function blobs_add_mock(hash, cb) {
    t.fail('blobs.add should not be called')
  }

  var addBlob = decorate(blobs_add_mock)
  pull(
    pull.once(data),
    addBlob("invalid link", function(err, link) {
      t.assert(err, 'should error')
    })
  )
})
