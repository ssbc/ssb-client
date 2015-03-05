var scuttlebot = require('scuttlebot')
var ssbkeys = require('ssb-keys')
var tape = require('tape')
var ssbclient = require('../index')

tape('test api', function (t) {

  var db = require('level-sublevel')(require('levelup')('/testdb', { db: require('memdown') }))
  var ssb = require('secure-scuttlebutt')(db, require('secure-scuttlebutt/defaults'))
  var server = scuttlebot({ port: 45451, host: 'localhost' }, ssb, ssb.createFeed())

  var keys = ssbkeys.generate()
  var client = ssbclient(keys, {port: 45451, host: 'localhost'}, function (err, authed) {
    if(err) throw err
    t.ok(authed.granted)
    client.publish({type: 'post', text: 'hello'}, function (err, data) {
      if(err) throw err
      t.equal(data.value.content.text, 'hello')
      console.log(data)
      client.close(function() {
        server.close()
        t.end()
      })
    })
  })
})
