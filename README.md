# ssb-client v2

A scuttlebot ([ssb-server](https://github.com/ssbc/ssb-server)) client. 

Create an rpc connection to an sbot running locally. 

## example

```js
var ssbClient = require('ssb-client')
var ssbKeys = require('ssb-keys')

// simplest usage, connect to localhost sbot
// this will cb with an error if an sbot server is not running
ssbClient(function (err, sbot) {
  // ...
})

// configuration:
var keys = ssbKeys.loadOrCreateSync('./app-private.key')
ssbClient(
  keys,                // optional, defaults to ~/.ssb/secret
  {
    host: 'localhost', // optional, defaults to localhost
    port: 8008,        // optional, defaults to 8008
    key: keys.id,      // optional, defaults to keys.id

    caps: {
        // random string for `appKey` in secret-handshake
        shs: ''
    },

    // optional, muxrpc manifest. Defaults to ~/.ssb/manifest.json
    manifest: {}       

  },
  function (err, sbot, config) {
    // ...
  }
)
```

### keys
See [ssb-keys](https://github.com/ssbc/ssb-keys). The keys look like this:
```js
{
    id: String,
    public: String,
    private: String,
    curve: 'ed25519'
}
```

### caps
`caps.shs` is a random string passed to [secret-handshake](https://github.com/auditdrivencrypto/secret-handshake#example). It determines which sbot you are able to connect to. It defaults to a magic string in this repo and also in [ssb-server](https://github.com/ssbc/ssb-server/blob/master/lib/ssb-cap.js)

```js
var appKey = new Buffer(opts.caps.shs, 'base64')
```


## License

MIT, Copyright 2015 Paul Frazee and Dominic Tarr
