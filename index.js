const log = require('debug')('websub')
log.error = log.extend('error')
log.log = console.log.bind(console)
log.error.log = console.error.bind(console)

const url = require('url')
const http = require('http')
const connect = require('connect')
const WebSocket = require('ws')

const { createHttpTerminator } = require('http-terminator')
const responseTime = require('response-time')
const compression = require('compression')
const timeout = require('connect-timeout')
const cors = require('cors')

const port = process.env.PORT || 8090
const host = process.env.HOST || '0.0.0.0'

const app = connect()
const server = http.createServer(app)
const terminator = createHttpTerminator({ server })

const ws = new WebSocket.Server({
  noServer: true,
  maxPayload: 1024 * 1024, // 1MB
})

server.on('upgrade', (req, socket, head) => {
  if (url.parse(req.url).pathname.startsWith('/socket/')) {
    ws.handleUpgrade(req, socket, head, ws => {
      ws.emit('connection', ws, req)
    })
  } else {
    log.error('Socket is using the wrong URL for WebSocket. Hanging up! (url:%o)', req.url)
    socket.destroy()
  }
})

app
  .use(responseTime())
  .use(cors())
  .use(compression())
  .use(timeout('15s'))

app.use('/hook/', function (req, res, next) {
  if (req.method === 'GET' && req.url.match(/hub.challenge=/)) {
    const challenge = req.url.replace(/^.*hub.challenge=([^&]*)&.*$/, '$1')
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.write(challenge);
    res.end();
    return
  }
  log({ req, res })
})

server.listen({ host, port }, () => {
  log(`Listening on http port ${port}.`)
})

server.on('connection', socket => {
  log(`new connection from %o`, { address: socket.remoteAddress, port: socket.remotePort })
})