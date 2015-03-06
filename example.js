
var Client = require('./')

var config  = require('ssb-config')
var ssbKeys = require('ssb-keys')
var keys = ssbKeys.loadOrCreateSync(config)

function abortIf (err) {
  if(err) throw err
}

var client = Client(keys, config)
  .connect(abortIf)

client.whoami(function (err, whoami) {
  abortIf(err)
  console.log(whoami)
  client.close()
})
