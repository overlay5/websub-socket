const { handler } = require('./src/http-handler')
const { upgradeToWebSocket, sendToWebSocket } = require('./src/websocket-server')
const { startServer } = require('./src/http-server')

/* start the http listener */
const server = startServer()

/* handle upgrade requests for websockets */
server.on('upgrade', upgradeToWebSocket)

/* middleware handlers for http requests */
server.on('request', handler)

/**
 * Event: 'webhook'
 * Emitted by handler each time a POST request is received on a known endpoint.
 **/
handler.on('webhook', sendToWebSocket)
