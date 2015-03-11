var scuttlebot = require('scuttlebot')
var ssbkeys = require('ssb-keys')
var schemas = require('ssb-msg-schemas')
var tape = require('tape')
var ssbclient = require('../index')

function setupTest () {
  var db = require('level-sublevel/bytewise')(require('levelup')('/testdb', { db: require('memdown'), keyEncoding: 'json', valueEncoding: 'json' }))
  var ssb = require('secure-scuttlebutt')(db, require('secure-scuttlebutt/defaults'))
  var server = scuttlebot({ port: 45451, host: 'localhost' }, ssb, ssb.createFeed()).use(require('scuttlebot/plugins/logging'))

  var keys = ssbkeys.generate()
  var client = ssbclient({ port: 45451, host: 'localhost' })
  client.connect(iferr)
  client.auth(ssbkeys.createAuth(keys), iferr)

  return {
    server: server,
    client: client,
    keys: keys
  }
}

function iferr (err) {
  if (err)
    throw err
}

tape('add messages', function (t) {

  var env = setupTest()
  var feed = env.client.createFeed(env.keys)

  feed.add({type: 'post', text: 'hello'}, function (err, data) {
    iferr(err)
    t.equal(data.value.content.text, 'hello')
    console.log(data)
    env.client.close(function() {
      env.server.close()
      t.end()
    })
  })
})


tape('setup aliases', function (t) {

  var env = setupTest()
  var feed = env.client.createFeed(env.keys)

  env.client.whoami(function (err, user) {
    iferr(err)
    console.log('user', user)

    schemas.getContact(env.client, { by: feed.id, for: user.id }, function (err, contact) {
      iferr(err)
      console.log('contact', contact)
      t.equal(Object.keys(contact).length, 0)

      schemas.addContact(feed, user.id, { alias: true, role: 'user' }, function (err, msg) {
        iferr(err)
        console.log('added msg', msg)

        schemas.getContact(env.client, { by: feed.id, for: user.id }, function (err, contact) {
          iferr(err)
          console.log('contact', contact)
          t.equal(contact.alias, true)
          t.equal(contact.role, 'user')

          env.client.close(function() {
            env.server.close()
            t.end()
          })
        })
      })
    })
  })
})
