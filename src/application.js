const log = require('./logger')('websub:app')
const { URL } = require('url')
const connect = require('connect')
const app = connect()

const responseTime = require('response-time')
const bodyParser = require('body-parser')

/** record the time it took to respond to a request
 *
 */
app.use(responseTime((req, res, time) => {
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

/**
 * Returns a reponse with code 404 and 'not found' in body
 *
 * @param {http.ServerResponse} res - returned "not found" response
 * @returns {void}
 */
function notFoundResponse(res) {
  const notFoundText = 'not found\n'
  return res
    .writeHead(404, {
      'Content-Type': 'text/plain',
      'Content-Length': Buffer.byteLength(notFoundText)
    })
    .end(notFoundText)
}

/**
 * Respond with 200 ok
 *
 * @param {http.ServerResponse} res http response object
 * @returns {http.ServerResponse} response with headers and content
 */
function okResponse(res) {
  return res
    .writeHead(200, {
      'Content-Type': 'text/plain',
      'Content-Length': 3
    })
    .end('ok\n')
}

/**
 * Handle WebSub requests
 *
 * @param {http.IncomingMessage} req - received request
 * @param {http.ServerResponse} res - returned response
 * @param {Function} next - next middleware function
 * @returns {void}
 */
function webhookHandler(req, res, next) {
  if (req.method === 'POST') {
    app.emit('webhook', req, res)
    return okResponse(res)
  }
  if (req.method !== 'GET')
    return notFoundResponse(res)
  const url = new URL(req.url, `https://${req.headers.host}`)
  const endpoint = url.pathname
  const qs = url.searchParams
  log('receive a GET request to endpoint: %s with qs %o', endpoint, qs)
  switch (qs.get('hub.mode')) {
    case 'denied':
      break
    case 'subscribe':
      break
    case 'unsubscibe':
      break
    default:
      return res.writeHead(500).end('unknown hub.mode')
  }
}

app.use('/hook/', (req, res, next) => {
  return webhookHandler(req, res, next)
})

/* catch-all should be last app.use() */
app.use((req, res, next) => {
  return notFoundResponse(res)
})

module.exports = {
  app
}
