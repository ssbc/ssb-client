var pull        = require('pull-stream')
var muxrpc      = require('muxrpc')
var address     = require('ssb-address')
var ws          = require('pull-ws-server')
var Serializer  = require('pull-serializer')
var loadManf    = require('ssb-manifest/load')
var ssbFeed     = require('secure-scuttlebutt/feed')
var ssbDefaults = require('secure-scuttlebutt/defaults')
var explain     = require('explain-error')

function isFunction (f) {
  return 'function' === typeof f
}

function throwIfError(err) {
  if(err) throw err
}

module.exports = function (config) {
  var manifest
  //if we are in the browser
  config = config || {}
  config.host = config.host || 'localhost'
  
  var client = muxrpc(loadManf(config), { auth: 'async' }, serialize)({
    auth: function (req, cb) {
      // when this connects to a server, the server auths
      // back to see who this is. we don't have any apis
      // for the server to call (yet) so this doesn't do anything.
      // however, if we don't just let this go through, the server
      // log shows a nasty error log.
      cb()
    }
  })

  var wsStream
  var rpcStream

  client.connect = function(addr, cb) {
    if(isFunction(addr))
      cb = addr, addr = null

    addr = address(addr || config)
    client.addr = addr
    if (wsStream) {
      wsStream.close()
      client._emit('reconnecting')
    }

    var called = false
    wsStream = ws.connect(addr, {
      onOpen: function() {
        client._emit('connect')
        if(called) return
        called = true; cb && cb()
      },
      onClose: function() {
        client._emit('close')
        //rpcStream will detect close on it's own.
        if(called) return
        called = true; cb && cb()
      }
    })

    rpcStream = client.createStream()
    pull(wsStream, rpcStream, wsStream)

    return client
  }

  client.close = function(cb) {
    wsStream.close()
    rpcStream.close(cb ? cb : throwIfError)
    return client
  }

  client.reconnect = function(opts) {
    opts = opts || {}
    client.close(function() {
      if (opts.wait)
        setTimeout(client.connect.bind(client, client.addr), opts.wait)
      else
        client.connect(client.addr)
    })
    return client
  }

  client.createFeed = function (keys, feedInfo, cb) {
    if (!cb && typeof feedInfo == 'function') {
      cb = feedInfo
      feedInfo = null
    }

    var feed = ssbFeed(this, keys, ssbDefaults)
    if (feedInfo) {
      cb = cb || throwIfErr

      // get user id
      var this_ = this
      this.whoami(function (err, userinfo) {
        if (err || !userinfo)
          cb(explain(err, 'Scuttlebot failed to answer whoami, which is a sign that it\'s in a bad state'))

        // get any contact info published from me about me and user
        getContact(this_, feed.id, feed.id, function (err, me) {
          err && console.error(err)
          gotContacts(me)
        })
        getContact(this_, feed.id, userinfo.id, function (err, user) {
          err && console.error(err)
          gotContacts(null, user)
        })

        var me, user
        function gotContacts(me_, user_) {
          me = me || me_
          user = user || user_
          if (!user || !me)
            return

          // create profile messages as needed
          if (!user.alias || user.role != 'user') {
            feed.add({
              type: 'contact',
              contact: { feed: userinfo.id },
              alias: true,
              role: 'user'
            }, done)
          } else done()
          if (me.name != feedInfo.name || me.role != 'app') {
            feed.add({
              type: 'contact',
              contact: { feed: feed.id },
              name: feedInfo.name,
              role: 'app'
            }, done)            
          } else done()
        }
        var msgs = []
        function done (err, msg) {
          if (err) return cb(err)
          msgs.push(msg)
          if (msgs.length === 2)
            cb(null, msgs.filter(Boolean))
        }
      })
    } else
      cb && cb()
    return feed
  }

  return client
}

function serialize (stream) {
  return Serializer(stream, JSON, {split: '\n\n'})
}

function throwIfErr (err) {
  if (err)
    throw err
}

function getContact (ssb, author, target, cb) {
  var contact = {}
  pull(
    ssb.feedsLinkedToFeed({ id: target, rel: 'contact' }),
    pull.asyncMap(function (entry, cb) {
      if (entry.source == author)
        ssb.get(entry.message, cb)
      else
        cb()
    }),
    pull.drain(
      function (msg) {
        for (var k in msg.content)
          contact[k] = msg.content[k]
      },
      function (err) {
        if (err)
          return cb(err)
        cb(null, contact)
      }
    )
  )
}