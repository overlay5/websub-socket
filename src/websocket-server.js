const log = require('./logger')('websub:ws')
const WebSocket = require('ws')
const { endpointFromReq } = require('./endpoint')

/**
 * @typedef { import('http') } http
 * @typedef { import('http').IncomingMessage } http.IncomingMessage
 * @typedef { import('http').ServerResponse } http.ServerResponse
 * @typedef { import('net') } net
 * @typedef { import('net').Socket } net.Socket
 **/

const KEEPALIVE_INTERVAL = 10000

const wsServer = new WebSocket.Server({
  noServer: true,
  maxPayload: 1024 * 1024, // 1MB
})

/**
 * Check if this server should handle the request to upgrade to WebSocket
 *
 * @param {http.IncomingMessage} req original upgrade request
 * @returns {boolean} should this WebSocket.Server accept the upgrade or reject it
 */
wsServer.shouldHandle = function (req) {
  return req.url.startsWith('/socket/')
}

/**
 * Add a WebSocket keep-alive ping at specific interval
 *
 * @param {WebSocket} ws the WebSocket to keep alive
 * @returns {void}
 */
function keepalive(ws) {
  ws.pingInterval = setInterval(() => {
    if (!ws.isAlive) {
      log.error('WebSocket client %s is not alive, terminating!', ws.name)
      ws.terminate()
    }
    ws.isAlive = false
    ws.ping(null, undefined, () => { /* log('ping to %o', ws.name) */ })
  }, KEEPALIVE_INTERVAL)
  ws.isAlive = true
  ws.on('pong', () => { ws.isAlive = true /* ; log('pong from %o', ws.name) */ })
  ws.on('error', err => {
    log.error('Client %s error - reason: %o', ws.name, err)
    clearInterval(ws.pingInterval)
  })
  ws.on('close', code => {
    log('Client %s closed connection - code: %o', ws.name, code)
    clearInterval(ws.pingInterval)
  })
}

/* when server is closed, remove all the keepalive(ws) ping intervals */
wsServer.on('close', () => {
  log('Closing WebSocket Server! %o', arguments)
  for (const ws of wsServer.clients)
    if (ws.pingInterval)
      clearInterval(ws.pingInterval)
})

wsServer.on('connection', ws => {
  keepalive(ws)
})

/**
 * Handle an http.Server 'upgrade' event
 *
 * @param {http.IncomingMessage} req Arguments for the HTTP request, as it is in the 'request' event
 * @param {net.Socket} socket Network socket between the server and client
 * @param {Buffer} head The first packet of the upgraded stream (may be empty)
 * @returns {void}
 */
function upgradeToWebSocket(req, socket, head) {
  wsServer.handleUpgrade(req, socket, head, ws => {
    ws.name = `${socket.remoteAddress}:${socket.remotePort}`
    ws.endpoint = endpointFromReq(req)
    wsServer.emit('connection', ws)
  })
}

/**
 * Decide if this WebSub request needs to be forwarded
 * to any of the WebSocket clients.
 *
 * @param {string} endpoint name of endpoint
 * @param {Buffer} body content to send to ws clients for endpoint
 * @returns {void}
 */
function sendToWebSocket(endpoint, body) {
  for (const ws of wsServer.clients)
    if (ws.endpoint === endpoint)
      ws.send(body)
}

module.exports = {
  sendToWebSocket,
  upgradeToWebSocket
}
