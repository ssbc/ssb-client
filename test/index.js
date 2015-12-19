var tape = require('tape')
var ssbKeys = require('ssb-keys')
var ssbServer = require('scuttlebot')
  .use(require('scuttlebot/plugins/master'))

var ssbClient = require('../')

var keys = ssbKeys.generate()
var server = ssbServer({
  port: 45451, timeout: 2001,
  temp: 'connect',
  host: 'localhost',
  master: keys.id,
  keys: keys
})

tape('connect', function (t) {

  ssbClient(keys, { port: 45451, manifest: server.manifest() }, function (err, client) {
    if (err) throw err

    client.whoami(function (err, info) {
      if (err) throw err

      console.log('whoami', info)
      t.equal(info.id, keys.id)
      t.end()
      client.close(true)
      server.close(true)
      process.exit(0)
    })
  })

})
