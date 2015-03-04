# ssb-client v1

[scuttlebot](https://github.com/ssbc/scuttlebot) client

```js
var pull = require('pull-stream')
var ssbkeys = require('ssb-keys')
var ssbclient = require('ssb-client')

// generate a new keypair
var keys = ssbkeys.generate()

// connect to the local scuttlebot
var client = ssbclient(keys, 'localhost')

// listen to connection events
client.on('connect', function () {
  console.log('connection established, authenticating...')
})
client.on('authed', function () {
  console.log('ready to go')
  doWork()
})
client.on('error', function (err) {
  // connection lost
  console.log('connection or authentication error', err)
  client.reconnect({ wait: 5000 })
})
client.on('reconnecting', function () {
  console.log('attempting reconnect...')
})

// make calls to the scuttlebot api
function doWork() {
  pull(client.createFeedStream(), pull.drain(console.log))
  client.add({ type: 'post', text: 'hello, world!' }, console.log)
}
```

## License

MIT, Copyright 2015 Paul Frazee and Dominic Tarr