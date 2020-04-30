const log = require('debug')('websub')
log.error = log.extend('error')
log.log = console.log.bind(console)
log.error.log = console.error.bind(console)

const http = require('http')
const connect = require('connect')
const WebSocket = require('ws')

const responseTime = require('response-time')

const port = process.env.PORT || 8090
const host = process.env.HOST || '0.0.0.0'

const app = connect()
const server = http.createServer(app)

const wsServer = new WebSocket.Server({
  noServer: true,
  maxPayload: 1024 * 1024, // 1MB
})

server.on('upgrade', (req, socket, head) => {
  if (req.url.startsWith('/socket/')) {
    wsServer.handleUpgrade(req, socket, head, ws => {
      ws.emit('connection', ws, req)
    })
  } else {
    log.error('Socket is using the wrong URL for WebSocket. Hanging up! (url:%o)', req.url)
    socket.destroy()
  }
})

const responseTimeFn = (req, res, time) => {
  log('request handling took %fms %s %s %o', parseFloat(time).toPrecision(3), req.method, req.url, { headers: req.headers })
}

app.use(responseTime(responseTimeFn))

app.use('/hook/', function (req, res, next) {
  if (req.method === 'GET' && req.url.match(/hub.challenge=/)) {
    const challenge = req.url.replace(/.*hub.challenge=([^&]*).*$/, '$1')
    return res
      .writeHead(200, {
        'Content-Type': 'text/plain',
        'Content-Length': Buffer.byteLength(challenge),
      })
      .end(challenge)
  }
  if (req.method === 'POST') {
    // TODO: implement webhook handling
  }
  return next()
})

/**
 * "Catch All" route, for all the requests that did not match /hook/
 */
app.use(function (req, res, next) {
  const notFoundText = 'not found\n'
  return res
    .writeHead(404, {
      'Content-Type': 'text/plain',
      'Content-Length': Buffer.byteLength(notFoundText)
    })
    .end(notFoundText)
})

server.listen({ host, port }, () => {
  log(`Listening on http port ${port}.`)
})

server.on('connection', socket => {
  log(`new connection from %s:%s to %s:%s`,
    socket.remoteAddress, socket.remotePort,
    socket.localAddress, socket.localPort,
  )
})

wsServer.on('connection', wsSocket => {
  log('new websocket connection', wsSocket)
  log('websocket server clients: %o', wsServer.clients)
  wsSocket.isAlive = true
  wsSocket.ping('PING', false, () => {
    log('pinging', arguments)
  })
  wsSocket.on('pong', () => {
    log('pong event triggered from %o', wsSocket)
    wsSocket.isAlive = true
  })
  wsSocket.on('error', (err) => {
    console.error(`Client disconnected - reason: ${err}`);
  })
})

setInterval(() => {
  log('pinging ws clients %o', wsServer.clients)
  wsServer.clients.forEach(wsSocket => {
    if (!wsSocket.isAlive) {
      log('ws is not alive, terminating', { wsSocket })
      return wsSocket.terminate()
    }
    wsSocket.isAlive = false
    // wsSocket.send('PING')
    wsSocket.ping('PING', false, () => {
      log('pinging', arguments)
    })
  })
}, 10000)