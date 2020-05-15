'use strict'

const { app } = require('../src/application')
const supertest = require('supertest')

describe('HTTP Server', function () {
  it('GET /nonexisting returns 404', async function () {
    await supertest(app)
      .get('/nonexisting')
      .expect(404)
      .expect('Content-Length', '10')
      .expect('Content-Type', 'text/plain')
      .expect('not found\n')
  })

  it('PUT/POST/HEAD/OPTIONS /hook returns 404', async function () {
    await supertest(app).put('/hook').expect(404)
    await supertest(app).head('/hook').expect(404)
    await supertest(app).options('/hook').expect(404)
  })

  it('GET /hook?hub.mode=unknown', async function () {
    await supertest(app)
      .get('/hook/whatever?hub.mode=unknown')
      .expect(/unknown hub.mode/)
      .expect(500)
  })
})
