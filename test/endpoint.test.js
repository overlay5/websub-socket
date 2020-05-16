const http = require('http')
const assert = require('assert').strict
const { endpointFromReq, qsFromReq } = require('../src/endpoint')

describe('endpoint name from url', function () {
  it('returns endpoint name from /hook/ prefixed urls', function () {
    const request = new http.IncomingMessage()
    request.headers = { host: 'does.not.matter' }
    request.url = '/hook/name'
    assert.equal(endpointFromReq(request), 'name')
  })

  it('returns endpoint name from /socket/ prefixed urls', function () {
    const request = new http.IncomingMessage()
    request.headers = { host: 'does.not.matter' }
    request.url = '/socket/name'
    assert.equal(endpointFromReq(request), 'name')
  })

  it('returns endpoint name from / prefixed urls', function () {
    const request = new http.IncomingMessage()
    request.headers = { host: 'does.not.matter' }
    request.url = '/name'
    assert.equal(endpointFromReq(request), 'name')
  })
})

describe('query string object from url', function () {
  it('returns the query string parameters as an object', function () {
    const request = new http.IncomingMessage()
    request.headers = { host: 'does.not.matter' }
    request.url = '/hook/name?hub.mode=subscribe&hub.topic=interesting&hub.challenge=difficult&hub.lease_seconds=3600'
    assert.deepEqual(qsFromReq(request), {
      'hub.mode': 'subscribe',
      'hub.topic': 'interesting',
      'hub.challenge': 'difficult',
      'hub.lease_seconds': '3600'
    })
  })
})
