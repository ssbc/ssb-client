# ssb-client v2
Create an [rpc connection](https://ssbc.github.io/scuttlebutt-protocol-guide/#rpc-protocol) to an 
*[sbot](https://github.com/ssbc/scuttlebot)* instance. Here are some resources that can help you 
understand how it works in a practical way:

* Tutorials using this library to create basic clients: 
[ssb-client-basic](https://github.com/mixmix/ssb-client-basic)
* A simple command line wrapper around this library: 
[ssb-client-cli](https://github.com/qypea/ssb-client-cli)

## Table of contents
[Example](#example) | [Api](#api) | [License](#license)

___

# Example

```js
var ssbClient = require('ssb-client')
var ssbKeys = require('ssb-keys')

  var keys = ssbKeys.loadOrCreateSync('./my-ssb-folder')
  var config = { caps: { shs: '1KHLiKZvAvjbY1ziZEHMXawbCEIM6qwjCDm3VYRan/s=' }}

// This is the clearest and 
// recommended way to use ssb-client
ssbClient(keys, config, function (err, sbot, config) {
  // ...
})
```

# Api

## ssbClient(cb): async
Makes things as "easy" as possible, by loading configuration and defaults. This is useful for scripts 
but applications should specify the configuration.

```js
var ssbClient = require('ssb-client')
ssbClient(function(err, sbot, config) {})
```
Create a connection to the local `ssb-server` instance, using the default keys and configuration. This 
will be loaded from directory specified by `ssb_appname` (by default `~/.ssb`).

The manifest will be the manifest provided by that server.

Calling this without arguments is handy for scripts, but applications should use the clearer apis.

## ssbClient({ keys, config, manifest, remote } | keys | config | cb): async
There are several ways to call ssb-client. Many of them are shortcuts for advanced users and can 
generate some confusion.

```js
var ssbClient = require('ssb-client')
var ssbKeys = require('ssb-keys')

var keys = ssbKeys.loadOrCreateSync()
var config = { port: 4321 }

// With keys and config, 
// config.caps are required
ssbClient(keys, config, function(err, sbot, config) {})

//Only with config
ssbClient(config, function(err, sbot, config) {})

//Only with keys
ssbClient(keys, function(err, sbot, config) {})

// With keys and custom ssb_appname
ssbClient(keys, 'testnet', function(err, sbot, config) {})

// Only with custom ssb_appname
ssbClient('testnet', function(err, sbot, config) {})

// This is the option that offers more customization
ssbClient({ keys, config, manifest, remote }, function(err, sbot, config) {})
```

## Parameters
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
### config
You can use [`ssb-config`](https://github.com/ssbc/ssb-config) to generate a valid configuration.

No parameters are required except `config.caps.shs` if the call is `ssbClient(keys, config, cb)`.

`config.caps.shs` is a random string passed to 
[secret-handshake](https://github.com/auditdrivencrypto/secret-handshake#example). It determines which 
sbot you are able to connect to.

In all other cases the configuration used will be the result of merging the configuration declared and 
the one founded in the application directory (~/.ssb in most cases).

If `config.manifest` is not defined, the manifest will be provided by the server.

### ssb_appname
Declares where to look for further config, where to read and write databases. Stores data in 
~/.${appName}, defaults to ssb (so data in ~/.ssb).

## License

MIT, Copyright 2015 Paul Frazee and Dominic Tarr
