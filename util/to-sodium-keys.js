module.exports = function toSodiumKeys (keys) {
  if (!keys || !keys.public) return null
  return {
    publicKey:
      Buffer.from(keys.public.replace('.ed25519', ''), 'base64'),
    secretKey:
      Buffer.from(keys.private.replace('.ed25519', ''), 'base64')
  }
}
