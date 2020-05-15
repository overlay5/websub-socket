const debug = require('debug')

/**
 * Create a logger, like debug but with bound console output
 * and a log.error() method.
 *
 * @param {string} name logger name
 * @returns {any} the created logger
 */
function createLogger(name) {
  const logger = debug(name)
  logger.log = console.log.bind(console)
  logger.error = logger.extend('error')
  logger.error.log = console.error.bind(console)
  return logger
}

module.exports = createLogger
