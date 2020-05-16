'use strict'
const assert = require('assert').strict

const { startServer } = require('../src/http-server')

describe('HTTP Server', function () {
  it('should listen to the IPv4 host and port provided in environment', function (done) {
    process.env.HOST = '0.0.0.3'
    process.env.PORT = 12345
    startServer((server) => {
      assert.equal(server.address().address, '0.0.0.3')
      assert.equal(server.address().family, 'IPv4')
      assert.equal(server.address().port, 12345)
      server.close(() => done())
    })
  })
})
