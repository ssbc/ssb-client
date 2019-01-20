module.exports = toSodiumKeys

function toSodiumKeys (keys) {
  if (!keys || !keys.public) return null

  return {
    publicKey:
      Buffer.from(trimCurve(keys.public, keys.curve), 'base64'),
    secretKey:
      Buffer.from(trimCurve(keys.private, keys.curve), 'base64')
  }
}

function trimCurve (key, curve) {
  return key.replace('.' + curve || 'ed25519', '')
}
