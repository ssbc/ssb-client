var tape = require('tape')
var ssbKeys = require('ssb-keys')
var ssbServer = require('ssb-server')
  .use(require('ssb-master'))

var ssbClient = require('../')

var shsCap = 'XMHDXXFGBJvloCk8fOinzPkKMRqyA2/eH+3VyUr6lig='

var keys = ssbKeys.generate()

tape('explicit manifest', function (t) {
  const server = ssbServer({
    port: 45451,
    timeout: 2001,
    temp: 'connect',
    host: 'localhost',
    master: keys.id,
    keys: keys,
    caps: { shs: shsCap }
  })
  server.on('multiserver:listening', () => {
    ssbClient(keys, { port: 45451, manifest: server.manifest(), caps: { shs: shsCap } }, function (err, client) {
      if (err) throw err

      client.whoami(function (err, info) {
        if (err) throw err

        console.log('whoami', info)
        t.equal(info.id, keys.id)
        t.end()
        client.close(true)
        server.close(true)
      })
    })
  })
})

tape('explicit incorrect manifest', function (t) {
  const server = ssbServer({
    port: 45451,
    timeout: 2001,
    temp: 'connect',
    host: 'localhost',
    master: keys.id,
    keys: keys,
    caps: { shs: shsCap }
  })
  server.on('multiserver:listening', () => {
    ssbClient(keys, { port: 45451, manifest: { foo: 'async' }, caps: { shs: shsCap } }, function (err, client) {
      if (err) throw err

      t.equal(typeof client.foo, 'function')
      t.equal(typeof client.whoami, 'undefined')
      t.end()

      client.close(true)
      server.close(true)
    })
  })
})

tape('automatic manifest', function (t) {
  const server = ssbServer({
    port: 45451,
    timeout: 2001,
    temp: 'connect',
    host: 'localhost',
    master: keys.id,
    keys: keys,
    caps: { shs: shsCap }
  })
  server.on('multiserver:listening', () => {
    ssbClient(keys, { port: 45451, caps: { shs: shsCap } }, function (err, client) {
      if (err) throw err

      client.whoami(function (err, info) {
        if (err) throw err

        console.log('whoami', info)
        t.equal(info.id, keys.id)
        t.end()
        client.close(true)
        server.close(true)
      })
    })
  })
})


tape('automatic manifest with promise support', function (t) {
  const server = ssbServer({
    port: 45451,
    timeout: 2001,
    temp: 'connect',
    host: 'localhost',
    master: keys.id,
    keys: keys,
    caps: { shs: shsCap }
  })
  server.on('multiserver:listening', () => {
    ssbClient(keys, { port: 45451, caps: { shs: shsCap } }).then((client) => {
      client.whoami().then((info) => {
        t.equal(info.id, keys.id)
        t.end()
        client.close(true)
        server.close(true)
      })
    })
  })
})
