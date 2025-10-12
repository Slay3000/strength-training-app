// config-overrides.js
module.exports = function override(config) {
    if (config.optimization) {
        config.optimization.minimize = false // stop minifying JS
    }
    config.devtool = 'source-map' // keep full source maps
    return config
}
