var tape = require('tape')
var ssbKeys = require('ssb-keys')
var ssbServer = require('ssb-server')
  .use(require('ssb-server/plugins/master'))

var ssbClient = require('../')

var shsCap = 'XMHDXXFGBJvloCk8fOinzPkKMRqyA2/eH+3VyUr6lig='

var keys = ssbKeys.generate()
var server = ssbServer({
  host: 'localhost',
  port: 45451,
  timeout: 2001,
  temp: 'connect', // what's this
  master: keys.id,
  keys: keys,
  appKey: shsCap
})

tape('connect', function (t) {
  const opts = {
    port: 45451,
    manifest: server.manifest(),
    caps: { shs: shsCap }
  }

  ssbClient(keys, opts, function (err, client) {
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
