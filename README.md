# ssb-client

[ssb-server](https://github.com/ssbc/ssb-server) client. 

Create an rpc connection to an ssb-server running locally. 

## example

```js
var ssbClient = require('ssb-client')
var ssbKeys = require('ssb-keys')

// simplest usage, connect to localhost ssb-server
// this will cb with an error if an ssb-server server is not running
ssbClient(function (err, ssbServer) {
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
  function (err, ssbServer, config) {
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

`caps.shs` is a random string passed to [secret-handshake](https://github.com/auditdrivencrypto/secret-handshake#example). It determines which ssb-server you are able to connect to. It defaults to a magic string in this repo and also in [ssb-config](https://github.com/ssbc/ssb-config/blob/master/defaults.js)

```js
var appKey = Buffer.from(opts.caps.shs, 'base64')
```

## License

MIT, Copyright 2015 Paul Frazee and Dominic Tarr
