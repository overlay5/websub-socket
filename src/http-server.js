const log = require('./logger')('websub:http')
const http = require('http')

const server = http.createServer()

server.on('connection', socket => {
  log('new connection from %s:%s to %s:%s',
    socket.remoteAddress, socket.remotePort,
    socket.localAddress, socket.localPort,
  )
})

function startServer() {
  const port = process.env.PORT || 8090
  const host = process.env.HOST || '0.0.0.0'
  server.listen({ host, port }, () => {
    console.log(`Listening on http port ${port}.`)
  })
  return server
}

module.exports = {
  startServer
}
