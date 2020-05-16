const { URL } = require('url')

/**
 * @typedef { import('http').IncomingMessage } http.IncomingMessage
 * */

const ENDPOINT_RE = /^\/?(hook|socket)?\/?/gi

/**
 * Return the endpoint name from a /hook or /socket URL
 *
 * @param {http.IncomingMessage} request incoming http message
 * @returns {string} endpoint name
 */
function endpointFromReq(request) {
  // parse URL per description @ nodejs.org/api/http.html#http_message_url
  const url = new URL(request.url, `http://${request.headers.host}`)
  const endpoint = url.pathname.replace(ENDPOINT_RE, '')
  return endpoint
}

/**
 * Return the query string from a request
 *
 * @param {http.IncomingMessage} request incoming http message
 * @returns {object} querystring parameters
 */
function qsFromReq(request) {
  const url = new URL(request.url, `http://${request.headers.host}`)
  return Object.fromEntries(url.searchParams.entries())
}

module.exports = {
  endpointFromReq,
  qsFromReq,
}
