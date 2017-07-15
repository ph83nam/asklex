import extend from 'extend';
import request from 'request';

const PAGE_ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN;
const VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN;
const API_VERSION = process.env.FB_API_VERSION || '2.9';

/**
 * http request
 * @param {string} path
 * @param {object} data
 * @param {function} callback
 * @param {string} method
 */
function callGraphApi(path, data, callback, method) {
  const params = { access_token: PAGE_ACCESS_TOKEN };
  const opts = {
    uri: `https://graph.facebook.com/v${API_VERSION}${path}`,
    qs: params,
    method: method || 'GET',
    headers: {
      accept: 'application/json',
    },
  };
  if (!method || method === 'GET') {
    if (data) extend(params, data);
  } else {
    opts.json = data;
  }
  // callback wrapper
  const cb = function (error, success) {
    let err = error;
    let resp = success;
    if (error === null && success) {
      // check if success is a JSON object
      if (typeof resp.body === 'string') {
        if (resp.headers['content-type'].indexOf('application/json') === 0) {
          try {
            resp = JSON.parse(resp.body);
          } catch (ex) {
            err = `failed to parse body ${ex.message}`;
          }
        }
      } else if (typeof resp.body === 'object') {
        if (!resp.body.error) {
          resp = resp.body;
        } else {
          err = resp.body.error;
        }
      }
    }
    if (callback) callback(err, resp);
  };
  return request(opts, cb);
}

/**
 * default callback
 * @param {Error} error
 * @param {Response} response
 * @param {object} body
 */
function sendMessageCb(error, response, body) {
  if (!error && response.statusCode === 200) {
    const recipientId = body.recipient_id;
    const messageId = body.message_id;

    console.log('Successfully sent generic message with id %s to recipient %s',
      messageId, recipientId);
  } else {
    console.error('Unable to send message.');
    console.error(response);
    console.error(error);
  }
}

/**
 * send a message to facebook
 * @param {object} messageData
 * @param {function} callback
 */
function sendMessage(messageData, callback) {
  return callGraphApi('/me/messages', messageData, callback || sendMessageCb, 'POST');
}

/**
 * get user profile information
 * @param {string} userId
 * @param {function} callback
 * @return {object}
 */
function getUserProfile(userId, callback) {
  const params = {
    fields: 'first_name,last_name,locale,timezone,gender',
  };
  return callGraphApi(`/${userId}`, params, callback, 'GET');
}

/**
 * return http response with text
 * @param {function} callback
 * @param {string} text
 */
function respondWithText(callback, text) {
  const resp = {
    statusCode: 200,
    headers: {},
    body: text,
  };
  callback(null, resp);
}

/**
 * page message callback
 * @param {object} event
 * @param {context} context
 * @param {function} callback
 */
function onPageMessage(event, context, callback) {
  // @todo: identify user and session

  // @todo: read text or voice

  // @todo: convert to english if require

  respondWithText(callback, 'received');

  // @todo: invoke Lex postContent

  // @todo: convert to original language (if applicable)

  // @todo: send message
}

/**
 * subscription verification message from FB
 * @param {object} event
 * @param {object} context
 * @param {function} callback
 */
function onPageSubcribe(event, context, callback) {
  const params = event.queryStringParameters || {};
  // verify token
  if (params['hub.verify_token'] !== VERIFY_TOKEN) {
    callback(null, {
      statusCode: 403,
      body: 'invalid verify_token',
    });
  } else {
    respondWithText(callback, params['hub.challenge'] || 'missing challenge');
  }
}

/**
 * AWS lamda callback
 * @param {object} event
 * @param {context} context
 * @param {function} callback
 */
function onMessage(event, context, callback) {
  console.log('message', event, context, callback);
  const params = event.queryStringParameters || {};
  // handle webhook mode
  if (params['hub.mode'] === 'subscribe') {
    onPageSubcribe(event, context, callback);
  } else {
    onPageMessage(event, context, callback);
  }
}

exports.message = onMessage;
exports.callGraphApi = callGraphApi;
exports.sendMessage = sendMessage;
exports.getUserProfile = getUserProfile;
