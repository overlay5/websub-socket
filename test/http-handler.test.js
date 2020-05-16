'use strict'

const { handler } = require('../src/http-handler')
const supertest = require('supertest')

describe('HTTP Server', function () {
  it('GET /nonexisting returns 404', async function () {
    await supertest(handler)
      .get('/nonexisting')
      .expect(404)
      .expect('Content-Length', '11')
      .expect('Content-Type', 'text/plain')
      .expect('not found\r\n')
  })

  it('PUT/POST/HEAD/OPTIONS /hook returns 404 Not Found', async function () {
    await supertest(handler).put('/hook').expect(404)
    await supertest(handler).head('/hook').expect(404)
    await supertest(handler).options('/hook').expect(404)
  })

  it('GET /hook without hub.mode returns 404 Not Found', async function () {
    await supertest(handler)
      .get('/hook')
      .expect(404)
  })

  it('GET /hook/whatever?hub.mode=unknown returns 400 Bad Request', async function () {
    await supertest(handler)
      .get('/hook/whatever?hub.mode=unknown')
      .expect(/unknown hub.mode/)
      .expect(400)
  })

  it('GET /hook/name-of-endpoint?hub.mode=subscribe returns challenge response', async function () {
    /** https://www.w3.org/TR/websub/#x5-3-hub-verifies-intent-of-the-subscriber */
    await supertest(handler)
      .get('/hook/name-of-endpoint?hub.mode=subscribe&hub.topic=topic&hub.challenge=giveitback&hub.lease_seconds=60')
      .expect(200)
      .expect('giveitback')
  })

  xit('registers known & verified endpoints')

  xit('only emits webhook events for registered endpoints')

  xit('sends a webhook event when a known endpoint receives a webhook')
  xit('does not send a webhook event when unknown endpoints receive webhooks')

})
