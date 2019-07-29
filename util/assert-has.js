module.exports = function assertHas (opts, key) {
  if (!Object.hasOwnProperty.call(opts, key)) { throw new Error('ssb-client:' + key + ' option *must* be provided') }
}
