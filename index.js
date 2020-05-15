const log = require('./src/logger')('websub')
const { app } = require('./src/application')
const { resendWebhook, upgradeToWebSocket } = require('./src/websocket-server')
const { startServer } = require('./src/http-server')

const server = startServer()
server.on('upgrade', upgradeToWebSocket)
server.on('request', app)
app.on('webhook', resendWebhook)
