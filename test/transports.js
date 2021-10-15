const tape = require('tape')
const ssbKeys = require('ssb-keys')
const pull = require('pull-stream')
const ssbServer = require('ssb-server')
  .use(require('ssb-server/plugins/no-auth'))
  .use(require('ssb-master'))
  .use(require('ssb-ws'))
  .use(require('ssb-unix-socket'))
  .use(require('ssb-onion'))

const ssbClient = require('../')

const shsCap = 'XMHDXXFGBJvloCk8fOinzPkKMRqyA2/eH+3VyUr6lig='

const keys = ssbKeys.generate()

// ssb-server does not support more than one unix socket server 
// (if there's more than one, they end up having the same file system path, because ssb.config.path is used for this)
// That's why we create a new server for each transport
//
// More problems:
// - a 2nd unix socket cannot be created by the same process? Even when created by a different multi-server instnace after the
// You can uncomment one or the other unix incomings below, but not both!
// first instance was closed?
// - I can't get the onion stuff to work here. I don't see why.

const incomings = {
  //"unix-shs": {transport: 'unix', opts: {transform: "shs", scope: "device"}},
  "net-shs": {transport: 'net', opts: {transform: "shs", scope: "device", port: 45451}},
  "ws-shs": {transport: 'ws', opts: {transform: "shs", scope: "device", port: 45452}},
  //"onion-shs": {transport: 'onion', opts: {transform: "shs", scope: "private"}},
  "unix-noauth": {transport: 'unix', opts: {transform: "noauth", scope: "device"}}
}

for (let [testname, incoming] of Object.entries(incomings)) {
  tape(testname, t =>{
    let {transport, opts} = incoming
    makeServer(transport, testname, opts, (err, server) =>{
      const address = server.getAddress("device")
      console.log('a server is listening on: %s', address)
      t.pass()
      server.close(()=>t.end())
    })
  })
}

/*
tape.skip('net', function (t) {
    ssbClient(keys, { remote: address, manifest: server.manifest(), caps: { shs: shsCap } }, function (err, client) {
      if (err) throw err

      client.whoami(function (err, info) {
        if (err) throw err

        console.log('whoami', info)
        t.equal(info.id, keys.id)
        t.end()
        client.close(true)
      })
    })
  })
})
*/

function makeServer(transport, testname, opts, cb) {
  const server = ssbServer({
    timeout: 2001,
    temp: 'connect-' + testname,
    master: keys.id,
    keys: keys,
    caps: { shs: shsCap },
    connections: {
      incoming: {
        [transport]: [opts]
      }
    }
  })

  server.on('multiserver:listening', () => {
    cb (null, server)
  })
}

