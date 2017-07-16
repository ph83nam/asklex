import extend from 'extend';
import request from 'request';
import logger from '../lib/log';
import lex from '../lib/lex';
import * as users from '../users/cached';

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

    logger.info('Successfully sent generic message with id %s to recipient %s',
      messageId, recipientId);
  } else {
    logger.error('Unable to send message.', response, error);
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
 * send a text message to user
 * @param {string} userId
 * @param {string} message
 * @param {function} callback
 */
function sendTextMessage(userId, message, callback) {
  const msg = {
    recipient: {
      id: userId,
    },
    message: {
      text: message,
    },
  };
  sendMessage(msg, callback);
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
  const cb = (error, data) => {
    let success;
    if (!error) {
      success = {
        uid: `${userId}:FB`,
        firstName: data.first_name,
        lastName: data.last_name,
        locale: data.locale,
        timezone: data.timezone,
        gender: data.gender,
      };
    } else {
      success = data;
    }
    callback(error, success);
  };
  return callGraphApi(`/${userId}`, params, cb, 'GET');
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
 * identify user info
 * @param {string} userId
 * @param {function} callback
 */
function identifyUser(userId, callback) {
  users.getUser(userId, 'FB', (error, data) => {
    if (error) {
      if (error === 'NOT_FOUND') {
        // get user data from FB
        getUserProfile(userId, (err, dat) => {
          if (!err) {
            // cache user data for later access
            users.cacheUser(dat);
          }
          callback(err, dat);
        });
      } else {
        callback(error);
      }
    } else {
      callback(error, data);
    }
  });
}

/**
 * response received from Lex
 * @param {string} userId
 * @param {object} error
 * @param {object} resp
 */
function onLexResponse(userId, error, resp) {
  if (error) {
    sendTextMessage(userId, `Lex error; ${error.message || 'unknown'}`);
  } else {
    logger.debug('Lex response', resp);
    // @todo convert Lex response to Message message
  }
}

/**
 * message payload received
 * @param {object} event
 */
function onMessageEvent(event) {
  // identifyUser
  identifyUser(event.sender.id, (error, user) => {
    if (error) {
      sendTextMessage(event.sender.id, `System error: ${error.message || 'unknown'}`);
    } else if (event.message.text) {
      // invoke Lex with text
      lex('text', event.message.text, user, onLexResponse.bind(event.sender.id));
    } else if (event.message.attachments) {
      const attachment = event.message.attachments[0];
      if (attachment.type === 'audio') {
        if (!user.talking) {
          // invoke voice mode
          extend(user, { talking: true });
          users.saveUser(user);
        }
        // invoke Lex with audio
        lex('audio', attachment.url, user, onLexResponse.bind(event.sender.id));
      } else {
        sendTextMessage(event.sender.id, 'I cannot process your attachment!');
      }
    }
  });
}

/**
 * page message callback
 * @param {object} event
 * @param {context} context
 * @param {function} callback
 */
function onPageMessage(event, context, callback) {
  const data = typeof event.body === 'object' ? event.body : JSON.parse(event.body);
  if (data.object === 'page') {
    // Iterate over each entry - there may be multiple if batched
    data.entry.forEach((entry) => {
      // Iterate over each messaging event
      entry.messaging.forEach((me) => {
        if (me.message) {
          // Handle the message
          onMessageEvent(me);
        } else {
          logger.warn('Webhook received unknown event: ', me);
        }
      });
    });
  }

  respondWithText(callback, 'received');
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

export { onMessage as message };
export { callGraphApi, getUserProfile, sendMessage, sendTextMessage };
