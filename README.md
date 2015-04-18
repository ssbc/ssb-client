# ssb-client v1

[scuttlebot](https://github.com/ssbc/scuttlebot) client

```js

var SSBClient = require('ssb-client')
var SSBKeys = require('ssb-keys')

// desktop app:
var keys = SSBKeys.loadOrCreateSync('./app-private.key')

// web app:
var keys
try {
  keys = JSON.parse(localStorage.keys)
} catch (e) {
  keys = SSBKeys.generate()
  localStorage.keys = JSON.stringify(keys)
}

// connect:
var client = SSBClient()
client.connect({ host: 'localhost' }, SSBKeys.createAuth(keys), abortIf)

// post to feed:
var feed = client.createFeed(keys)
feed.add({
  type: 'post', text: 'hello, world!'
}, function (err, msg) {
  abortIf(err)
  console.log(msg)
  client.close()
})

function abortIf (err) {
  if(err) throw err
}

```

## License

MIT, Copyright 2015 Paul Frazee and Dominic Tarr
