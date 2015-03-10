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
var client = SSBClient({ host: 'localhost' })
  .connect(abortIf)
  .auth(SSBKeys.createAuth(keys), abortIf)

// create and configure feed:
var feed = client.createFeed(keys, { name: 'My Application' }, function (err, msgs) {
  if (msgs.length > 0) {
    // ssb-client published new 'contact' messages for the feed
    console.log(msgs)
  } else {
    // feed's information was already published on the feed
  }
})

// post to feed:
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
