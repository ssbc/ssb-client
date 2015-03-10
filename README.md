# ssb-client v1

[scuttlebot](https://github.com/ssbc/scuttlebot) client

```js

var Client = require('ssb-client')
var Keys = require('ssb-keys')

// desktop app:
var keys = Keys.loadOrCreateSync('./app-private.key')

// web app:
var keys
try {
  keys = JSON.parse(localStorage.keys)
} catch (e) {
  keys = Keys.generate()
  localStorage.keys = JSON.stringify(keys)
}

// connect:
var client = Client(keys, config)
  .connect(abortIf)
  .auth(Keys.createAuth(keys), abortIf)

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
