const log = require('debug')('websub')
log.error = log.extend('error')
log.log = console.log.bind(console)
log.error.log = console.error.bind(console)

const http = require('http')
const connect = require('connect')
const WebSocket = require('ws')

const responseTime = require('response-time')
const bodyParser = require('body-parser')

const port = process.env.PORT || 8090
const host = process.env.HOST || '0.0.0.0'

const app = connect()
const server = http.createServer(app)

const wsServer = new WebSocket.Server({
  noServer: true,
  maxPayload: 1024 * 1024, // 1MB
})

/* holds a list of endpoints for /socket/<endpoint> that match with /hook/<endpoint> */
// TODO: change to using Redis
const endpoints = []
const wsEndpointClients = {}

server.on('upgrade', (req, socket, head) => {
  if (req.url.startsWith('/socket/')) {
    const endpoint = req.url.substr(8)
    if (!endpoints.includes(endpoint)) {
      endpoints.push(endpoint)
    }
    return wsServer.handleUpgrade(req, socket, head, ws => {
      ws.name = `${socket.remoteAddress}:${socket.remotePort}`
      wsEndpointClients[endpoint] = ws
      wsServer.emit('connection', ws)
    })
  }
  log.error('Request with wrong URL for WebSocket. Hanging up! %o',
    { ip: req.remoteAddress, port: req.remotePort, url: req.url })
  socket.destroy()
})

/* record the time it took to respond to a request */
app.use(responseTime(function (req, res, time) {
  log('request handling took %fms %s %s %s %o : status %s',
    parseFloat(time).toPrecision(3),
    req.method,
    req.url,
    req.body,
    { headers: req.headers },
    res.statusCode
  )
}))

app.use(bodyParser.raw({ type: '*/*' }))

/* handle webhooks & WebSub challenges */
app.use('/hook/', function (req, res, next) {
  if (req.method === 'GET' && req.url.match(/hub.challenge=/)) {
    const challenge = req.url.replace(/.*hub.challenge=([^&]*).*$/, '$1')
    log('Responding to challenge with: %o', { challenge })
    return res
      .writeHead(200, {
        'Content-Type': 'text/plain',
        'Content-Length': Buffer.byteLength(challenge),
      })
      .end(challenge)
  }
  if (req.method === 'POST') {
    const endpoint = req.url.substr(6)
    const ws = wsEndpointClients[endpoint]
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ headers: req.header, ...JSON.parse(req.body) }))
    }
    const hubResponse = 'ok'
    return res
      .writeHead(200, {
        'Content-Type': 'text/plain',
        'Content-Length': Buffer.byteLength(hubResponse),
      })
      .end(hubResponse)
  }
  return next()
})

/* "Catch All" route, for all the requests that did not match /hook/ */
app.use(function (req, res, next) {
  const notFoundText = 'not found\n'
  return res
    .writeHead(404, {
      'Content-Type': 'text/plain',
      'Content-Length': Buffer.byteLength(notFoundText)
    })
    .end(notFoundText)
})

server.on('connection', socket => {
  log(`new connection from %s:%s to %s:%s`,
    socket.remoteAddress, socket.remotePort,
    socket.localAddress, socket.localPort,
  )
})

wsServer.on('connection', ws => {
  log('connection from %s upgraded to websocket', ws.name)
  ws.isAlive = true
  ws.ping(null, undefined, () => {
    log('ping to %o', ws.name)
  })
  ws.on('pong', () => {
    log('pong from %o', ws.name)
    ws.isAlive = true
  })
  ws.on('error', (err) => {
    log.error('Client %s disconnected - reason: %o', ws.name, err);
  })
})

const pingInterval = setInterval(() => {
  wsServer.clients.forEach(ws => {
    if (!ws.isAlive) {
      log.error('WebSocket client %s is not alive, terminating!', ws.name)
      return wsSocket.terminate()
    }
    ws.isAlive = false
    ws.ping(null, undefined, () => {
      log('ping to %o', ws.name)
    })
  })
}, 10000)

wsServer.on('close', () => {
  log('Closing WebSocket Server! %o', arguments)
  clearInterval(pingInterval)
})

/* start the server */
server.listen({ host, port }, () => {
  console.log(`Listening on http port ${port}.`)
})