var test = require('tape')
var ssbKeys = require('ssb-keys')

var buildConfig = require('../build-config')
var SodiumKeys  = require('../util/sodium-keys')

// opts:
//    - remote
//      - or port, host
//    - manifest
//    - caps.shs
//    - timers.handshake

test('keys, opts - simplest route', t => {
  var keys = ssbKeys.generate()
  var opts = {
    remote: 'a_remote',
    manifest: { whoami: 'sync' },
    caps: { shs: 'XMHDXXFGBJvloCk8fOinzPkKMRqyA2/eH+3VyUr6lig=' },
    timers: { handshake: 4000 }
  }

  var config = buildConfig(keys, opts)

  t.deepEqual(config.appKey, Buffer.from(opts.caps.shs, 'base64'), 'appKey')
  t.deepEqual(config.manifest, opts.manifest, 'manifest')
  t.equal(config.remote, opts.remote, 'remote')
  t.deepEqual(config.sodiumKeys, SodiumKeys(keys), 'sodiumKeys')
  t.equal(config.timeout, opts.timers.handshake, 'timeoute')

  t.end()
})

test('keys, opts - missing remote, but host, port present', t => {
  var keys = ssbKeys.generate()
  var opts = {
    host: 'mixmix.io',
    port: 1984,
    manifest: { whoami: 'sync' },
    caps: { shs: 'XMHDXXFGBJvloCk8fOinzPkKMRqyA2/eH+3VyUr6lig=' },
    timers: { handshake: 4000 }
  }

  var config = buildConfig(keys, opts)

  t.deepEqual(config.appKey, Buffer.from(opts.caps.shs, 'base64'), 'appKey')
  t.deepEqual(config.manifest, opts.manifest, 'manifest')
  t.equal(config.remote, `net:${opts.host}:${opts.port}~shs:${keys.id.substring(1).replace('.ed25519', '')}`, 'remote')
  t.deepEqual(config.sodiumKeys, SodiumKeys(keys), 'sodiumKeys')
  t.equal(config.timeout, opts.timers.handshake, 'timeoute')

  t.end()
})

test('keys, opts - missing remote, but host.onion, port present', t => {
  var keys = ssbKeys.generate()
  var opts = {
    host: 'mixmix.onion',
    port: 1984,
    manifest: { whoami: 'sync' },
    caps: { shs: 'XMHDXXFGBJvloCk8fOinzPkKMRqyA2/eH+3VyUr6lig=' },
    timers: { handshake: 4000 }
  }

  var config = buildConfig(keys, opts)

  t.deepEqual(config.appKey, Buffer.from(opts.caps.shs, 'base64'), 'appKey')
  t.deepEqual(config.manifest, opts.manifest, 'manifest')
  t.equal(config.remote, `onion:${opts.host}:${opts.port}~shs:${keys.id.substring(1).replace('.ed25519', '')}`, 'remote')
  t.deepEqual(config.sodiumKeys, SodiumKeys(keys), 'sodiumKeys')
  t.equal(config.timeout, opts.timers.handshake, 'timeoute')

  t.end()
})

test('keys, opts - missing manifest', t => {
  var keys = ssbKeys.generate()
  var opts = {
    remote: 'a_remote',
    caps: { shs: 'XMHDXXFGBJvloCk8fOinzPkKMRqyA2/eH+3VyUr6lig=' },
    timers: { handshake: 4000 }
  }

  t.throws(() => buildConfig(keys, opts))
  t.end()
})
