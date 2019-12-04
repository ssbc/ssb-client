var tape = require('tape')
var ssbKeys = require('ssb-keys')
var ssbServer = require('ssb-server')
  .use(require('ssb-master'))

var ssbClient = require('../')

var shsCap = 'XMHDXXFGBJvloCk8fOinzPkKMRqyA2/eH+3VyUr6lig='

var keys = ssbKeys.generate()
var server = ssbServer({
  port: 45451, timeout: 2001,
  temp: 'connect',
  host: 'localhost',
  master: keys.id,
  keys: keys,
  caps: {shs: shsCap}
})

tape('connect', function (t) {
  server.on('multiserver:listening', () => {
    ssbClient(keys, {
      port: 45451,
      caps: { shs: shsCap }
    }, function (err, client) {
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
})
