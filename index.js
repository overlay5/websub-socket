const { handler } = require('./src/http-handler')
const { wsServer, upgradeToWebSocket, sendToWebSocket } = require('./src/websocket-server')
const { startServer } = require('./src/http-server')
const { eventbus } = require('./src/eventbus')

/* start the http listener */
const server = startServer()

/* handle upgrade requests for websockets */
server.on('upgrade', upgradeToWebSocket)

/* middleware handlers for http requests */
server.on('request', handler)

/**
 * The EventBus allows bi-directional communication across handler and websocket server
 *
 * Event: 'webhook'
 *   Emitted by handler each time a POST request is received on a known endpoint.
 *
 * Event: 'new-ws'
 *   Emitted by websocket server when a new client connects and registers an endpoint.
 **/
handler.eventbus = eventbus
wsServer.eventbus = eventbus
