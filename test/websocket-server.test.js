'use strict'
const assert = require('assert').strict
const sinon = require('sinon')

const EventEmitter = require('events')
const WebSocket = require('ws')
const { wsServer, upgradeToWebSocket } = require('../src/websocket-server')
const http = require('http')

describe('WebSocket Server', function () {
  afterEach(function () {
    sinon.restore()
  })

  it('should emit an event with the new endpoint when a client is upgraded', function (done) {
    const host = '127.0.0.2'
    const randomPort = 0
    const eventBus = sinon.createStubInstance(EventEmitter)
    wsServer.eventbus = eventBus
    const server = http.createServer()
    server.on('upgrade', upgradeToWebSocket)
    eventBus.on('new-ws', function (payload) {
      console.log(payload)
    })
    wsServer.on('connection', () => {
      sinon.assert.calledWith(eventBus.emit, 'new-ws', 'secret-endpoint-name')
      wsServer.close()
      server.close(() => done())
    })
    server.listen({ host, port: randomPort }, () => {
      new WebSocket(`ws://${server.address().address}:${server.address().port}/socket/secret-endpoint-name`)
    })
  })

  it('should give a websocket client .name and .endpoint when it is upgraded', function (done) {
    const host = '127.0.0.2'
    const randomPort = 0
    const server = http.createServer()
    let ws
    wsServer.on('connection', () => {
      assert.equal(wsServer.clients.size, 1)
      for (const client of wsServer.clients.values()) {
        const host = ws._req.socket.localAddress
        const port = ws._req.socket.localPort
        assert.equal(client.endpoint, 'secret-endpoint-name')
        assert.equal(client.name, `${host}:${port}`)
      }
      wsServer.close()
      server.close(() => done())
    })
    server.on('upgrade', upgradeToWebSocket)
    server.listen({ host, port: randomPort }, () => {
      ws = new WebSocket(`ws://${server.address().address}:${server.address().port}/socket/secret-endpoint-name`)
    })
  })
})
