# ssb-client v1

[scuttlebot](https://github.com/ssbc/scuttlebot) client

```js

var Client = require('./')

var config  = require('ssb-config')
var ssbKeys = require('ssb-keys')
var keys = ssbKeys.loadOrCreateSync(config)

function abortIf (err) {
  if(err) throw err
}

var client = Client(keys, config)
  .connect(abortIf)
  .auth(abortIf)

client.publish({
  type: 'post', text: 'hello, world!'
}, function (err, msg) {
  abortIf(err)
  console.log(msg)
  client.close()
})

```

## License

MIT, Copyright 2015 Paul Frazee and Dominic Tarr
