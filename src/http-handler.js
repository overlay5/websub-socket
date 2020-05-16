const log = require('./logger')('websub:app')
const connect = require('connect') /* like express.js, less code */
const { endpointFromReq, qsFromReq } = require('./endpoint')

/**
 * @typedef { import('http') } http
 * @typedef { import('http').IncomingMessage } http.IncomingMessage
 * @typedef { import('http').ServerResponse } http.ServerResponse
 **/

/* middleware */
const responseTime = require('response-time')
const bodyParser = require('body-parser')

const handler = connect()

/**
 * Output the time it took to respond to a request
 *
 * @param {http.IncomingMessage} req the http request
 * @param {http.ServerResponse} res the http response
 * @param {number} time the time it took to reply
 */
function reportResponseTime(req, res, time) {
  log('request handling took %fms %s %s %s %o : status %s',
    parseFloat(time).toPrecision(3),
    req.method,
    req.url,
    req.body,
    { headers: req.headers },
    res.statusCode
  )
}

/**
 * Return an HTTP response with provided HTTP code and text message
 *
 * @param {http.ServerResponse} res returned response object
 * @param {number}              statusCode http status code to return
 * @param {string|Buffer}       message http response content
 * @returns {void}
 */
function respond(res, statusCode = 404, message = '') {
  const responseText = Buffer.concat([Buffer.from(message), Buffer.from('\r\n')])
  res.writeHead(statusCode, {
    'Content-Type': 'text/plain',
    'Content-Length': responseText.length,
  }).end(responseText)
}

/**
 * Handle WebSub WebHook notifications
 *
 * @param {http.IncomingMessage} req - received request
 * @param {http.ServerResponse} res - returned response
 * @param {Function} next - next middleware function
 * @returns {void}
 */
function notificationHandler(req, res, next) {
  const endpoint = endpointFromReq(req)
  handler.emit('webhook', endpoint, req.body)
  return respond(res, 200, 'ok')
}

/**
 * Handle WebSub subscribe/unsubscribe and denied requests
 *
 * @param {http.IncomingMessage} req - received request
 * @param {http.ServerResponse} res - returned response
 * @param {Function} next - next middleware function
 * @returns {void}
 */
function websubHandler(req, res, next) {
  const qs = qsFromReq(req)
  switch (qs['hub.mode']) {
    case 'denied':
      break
    case 'subscribe':
      return res.writeHead(200).end(qs['hub.challenge'])
    case 'unsubscibe':
      break
    default:
      return respond(res, 400, 'unknown hub.mode')
  }
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
  if (req.method === 'POST')
    return notificationHandler(req, res, next)
  if (req.method !== 'GET')
    return respond(res, 404, 'not found')
  if (/hub\.mode/.test(req.url))
    return websubHandler(req, res, next)
  next()
}

/** middleware; order is important */
handler
  .use(responseTime(reportResponseTime))
  .use('/hook/', bodyParser.raw({ type: '*/*' }))
  .use('/hook/', webhookHandler)
  .use((req, res, next) => respond(res, 404, 'not found'))

module.exports = {
  handler
}
