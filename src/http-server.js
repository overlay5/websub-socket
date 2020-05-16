const log = require('./logger')('websub:http')
const http = require('http')

/**
 * @typedef { import('net') } net
 * @typedef { import('net').Socket } net.Socket
 **/

/**
 * Log details of a new http connection
 *
 * @param {net.Socket} socket received connection socket
 * @returns {void}
 */
function logConnection(socket) {
  log('new connection from %s:%s to %s:%s',
    socket.remoteAddress, socket.remotePort,
    socket.localAddress, socket.localPort,
  )
}

/**
 * Callback for when the server starts listening
 *
 * @callback listeningCallback
 * @param {http.Server} server the http server
 */

/**
 * Start the HTTP listener on the HTTP server
 *
 * @param {listeningCallback} callback called when the server is listening
 * @returns {http.Server} the http server
 */
function startServer(callback) {
  const port = process.env.PORT || 8090
  const host = process.env.HOST || '0.0.0.0'
  if (callback)
    server.on('listening', () => callback(server))
  server.listen({ host, port }, () => {
    /* console.log is always displayed, unlike log() which depends on DEBUG=* */
    console.log(`Listening on http port ${port}.`)
  })
  return server
}

const server = http.createServer()
server.on('connection', logConnection)

module.exports = {
  server,
  startServer
}
