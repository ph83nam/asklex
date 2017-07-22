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
 * @return {request.Request}
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

  // prepare data
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

  // invoke request
  logger.debug('calling graph API', opts);
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
 * @return {request.Request}
 */
function sendMessage(messageData, callback) {
  return callGraphApi('/me/messages', messageData, callback || sendMessageCb, 'POST');
}

/**
 * send a text message to user
 * @param {string} userId
 * @param {string} message
 * @param {function} callback
 * @return {request.Request}
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
  return sendMessage(msg, callback);
}

/**
 * get user profile information
 * @param {string} userId
 * @param {function} callback
 * @return {object}
 * @return {request.Request}
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
    /* headers: {
      'Content-Type': typeof text === 'object' ?
        'application/json' : 'text/plain',
    }, */
    body: typeof text === 'object' && !callback.test ? JSON.stringify(text) : text,
  };
  process.emit('done');
  logger.debug('response with text/object:', text);
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
            if (typeof users.cacheUser === 'function') {
              users.cacheUser(dat);
            }
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
 * @param {function} callback
 * @param {string} userId
 * @param {object} error
 * @param {object} resp
 */
function onLexResponse(callback, userId, error, resp) {
  if (error) {
    logger.error('Lex error:', error);
    const msg = `Lex error: ${error.message || error}`;
    const wrapper = callback ? callback.bind(this, error, resp) : null;
    sendTextMessage(userId, msg, wrapper, () => {
      // invoke callback
      if (typeof callback === 'function') callback(error, resp);
    });
  } else {
    logger.info('Lex response:', resp);
    // @todo convert Lex response to Message message
    if (resp.contentType.indexOf('text/plain') === 0) {
      sendTextMessage(userId, resp.message, (err, res) => {
        if (err || !res) {
          logger.error('Failed to send response', err);
        }
        // invoke callback
        if (typeof callback === 'function') callback(error, resp);
      });
    }
  }
}

/**
 * message payload received
 * @param {object} event
 * @param {function} callback
 */
function onMessageEvent(event, callback) {
  const lexCb = onLexResponse.bind(this, callback, event.sender.id);
  // identifyUser
  identifyUser(event.sender.id, (error, user) => {
    if (error) {
      logger.debug('failed to identify facebook user event.sender.id', error);
      sendTextMessage(event.sender.id,
        `System error: ${error.message || 'unknown'}`,
        callback.bind(this, error));
      return;
    }

    // process message for user
    logger.debug('received message from', user);
    if (event.message.text) {
      // invoke Lex with text
      lex('text', event.message.text, user, lexCb);
    } else if (event.message.attachments) {
      const attachment = event.message.attachments[0];
      if (attachment.type === 'audio') {
        if (!user.talking) {
          // invoke voice mode
          extend(user, { talking: true });
          users.saveUser(user);
        }
        // invoke Lex with audio
        lex('audio', attachment.url, user, lexCb);
      } else {
        sendTextMessage(
          event.sender.id,
          'I cannot process your attachment!',
          callback.bind(this, error));
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
    let index = -1;
    const errList = [];
    const resList = [];
    const eventCb = (error, response) => {
      if (error !== undefined || response !== undefined) {
        if (error) errList.push(error);
        if (response) resList.push(response);
      }
      if (++index < data.entry.length) {
        // invoke next entry
        const me = data.entry[index];
        if (me.messaging && me.messaging.length === 1) {
          // Handle the message
          onMessageEvent(me.messaging[0], eventCb);
        } else {
          logger.warn('Webhook received unknown event:', me);
          eventCb();
        }
      } else {
        // end execution
        logger.debug('message:', data, 'errList:', errList, 'resList:', resList);
        let msg;
        if (errList.length > 0 || resList.length === 0) {
          // return error or mixed
          msg = {
            type: resList.length > 0 ? 'mixed' : 'error',
            errorList: errList,
            responseList: resList,
          };
        } else {
          // return success
          msg = {
            type: 'success',
            responseList: resList,
          };
        }
        respondWithText(callback, msg);
      }
    };
    eventCb();
  } else {
    // log for review
    logger.warn('received unknown object', data);
    respondWithText(callback, 'confused');
  }
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
  logger.debug('message', event, context, callback);
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
