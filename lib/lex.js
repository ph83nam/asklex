// Imports the Google Cloud client library
import extend from 'extend';
import logger from './log';
import { getLexRuntime } from './aws';
import * as gcp from './gcp';
import * as cache from './redis';
import * as food from './lex/food';
import * as restaurant from './lex/restaurant';
import * as order from './lex/order';
import help from './lex/help';

const BOT_NAME = process.env.LEX_BOT_NAME;
const BOT_ALIAS = process.env.LEX_BOT_ALIAS;

/**
 * translate a text to English
 * @param {string} locale
 * @param {string} text
 * @return {Promise}
 */
function getEnglishText(text, locale) {
  let promise;
  if (locale && (locale !== 'en' || locale.indexOf('en_') === 0)) {
    // return unchanged
    promise = Promise.resolve(text);
  } else {
    // use translation service
    promise = gcp.translate(text, {
      from: locale ? locale.substr(0, 2) : null,
      to: 'en',
    });
  }
  return promise;
}

/**
 * return contentType and inputStream
 * @param {object} user
 * @param {string} type
 * @param {any} data
 * @param {function} callback
 * @return {Promise}
 */
function getLexContentParams(user, type, data, callback) {
  const params = {};
  let promise;
  switch (type) {
    case 'text':
      params.contentType = 'text/plain; charset=utf-8';
      promise = new Promise((resolve, reject) => {
        getEnglishText(data, user.locale).then((result) => {
          let translatedText;
          if (typeof result === 'string') {
            translatedText = result;
          } else {
            const tslt = result[1].data.translations;

            // update user locale
            if (data[0].detectedSourceLanguage &&
                (!user.locale || user.locale !== tslt[0].detectedSourceLanguage)) {
              extend(user, { locale: tslt[0].detectedSourceLanguage });
              cache.saveUser(user.uid, { locale: user.locale });
            }

            // english text is resolved
            translatedText = data[0].translatedText;
          }
          // initiate input stream
          params.inputStream = translatedText; // new Buffer(translatedText, 'utf8');
          if (callback) callback(null, params);
          resolve(params);
        }).catch((error) => {
          // failed to translate the text
          if (callback) callback(error);
          reject(error);
        });
      });
      params.accept = 'text/plain; charset=utf-8';
      break;
    default:
      promise = new Promise((resolve, reject) => {
        const error = `Unknown Type ${type}`;
        if (callback) callback(error);
        reject(error);
      });
  }
  return promise;
}

/**
 * get session identifier
 * @param {string} userId
 */
function getSessionId(userId) {
  return `session:${userId}`;
}

/**
 * get session of a user
 * @param {string} userId
 * @return Promise
 */
function getSessionData(userId, callback) {
  return cache.get(getSessionId(userId), callback);
}

/**
 * invoke lex
 * @param {string} type
 * @param {string} data
 * @param {object} user
 * @param {function} callback
 */
function lex(type, data, user, callback) {
  logger.debug('lex', user.firstName, type, type instanceof String ? data : `<${type}>`);
  const params = {
    botName: BOT_NAME,
    botAlias: BOT_ALIAS,
    userId: user.uid,
    sessionAttributes: {
      userId: user.uid,
      firstName: user.firstName,
      lastName: user.lastName,
      gender: user.gender,
    },
  };

  // retrieve session from cache (if any)
  const session = getSessionData(user.uid).then((sessionData) => {
    if (session) extend(params.sessionAttributes, sessionData);
  });

  // get the content params
  const content = getLexContentParams(user, type, data).then((contentParams) => {
    // add content to the parameters
    extend(params, contentParams);
  });

  Promise.all([session, content]).then(() => {
    getLexRuntime().postContent(params, callback);
  }).catch(callback);
}

/**
 * Close dialog with the customer, reporting fulfillmentState of
 * Failed or Fulfilled ("Thanks, your pizza will arrive in 20 minutes")
 * @param {*} sessionAttributes
 * @param {*} fulfillmentState
 * @param {*} message
 */
function closeDialog(sessionAttributes, fulfillmentState, message) {
  return {
    sessionAttributes,
    dialogAction: {
      type: 'Close',
      fulfillmentState,
      message,
    },
  };
}

/**
 * dispatch lex event
 * @param {event} intentRequest
 * @param {function} callback
 */
function dispatchIntentRequest(intentRequest, callback) {
  const handlers = {
    AskRestaurant: restaurant.ask,
    ChooseRestaurant: restaurant.choose,
    AskFood: food.ask,
    OrderFood: food.action,
    PlaceOrder: order.place,
    ReviewOrder: order.review,
    StartOverFoodOrder: order.reset,
    NoIdea: help,
  };

  const intent = intentRequest.currentIntent;
  const session = intentRequest.sessionAttributes;
  const handler = handlers[intent.name];
  if (handler !== undefined) {
    const slots = intent.slots;
    logger.debug([
      `request received for userId=${intentRequest.userId}`,
      `intentName=${intent.name}`,
      `intentSlots=${slots}`,
    ].join(', '));

    // @todo normalize session

    // invoke handler
    handler(intent, session, (error, success) => {
      // @todo denormalize session
      if (error) {
        callback(error);
      } else {
        // @todo prepare response
        const response = success;
        callback(null, closeDialog(session, 'Fulfilled', response));
      }
    });
  } else {
    logger.error('unknown intent', intent);

    // invoke callback
    callback(closeDialog(session, 'Fulfilled', {
      contentType: 'PlainText',
      content: 'Okay, I have ordered your pizza',
    }));
  }
}

/**
 * lambda callback handler
 * @param {event} event
 * @param {context} context
 * @param {function} callback
 */
function handle(event, context, callback) {
  logger.debug('handle', event, context);
  try {
    dispatchIntentRequest(event, (error, response) => {
      callback(error, response);
    });
  } catch (err) {
    callback(err);
  }
}

export { lex as default, handle };

// export for unit testing
export { getLexContentParams };

export { BOT_NAME, BOT_ALIAS };
