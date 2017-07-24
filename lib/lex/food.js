import logger from '../log';

/**
 * ask food
 * @param {object} intent
 * @param {object} session
 * @param {function} callback
 */
function ask(intent, session, callback) {
  logger.debug('ask', intent, session);
  callback(null, {});
}

/**
 * add,replace,remove food
 * @param {object} intent
 * @param {object} session
 * @param {function} callback
 */
function action(intent, session, callback) {
  logger.debug('choose', intent, session);
  callback(null, {});
}

export { ask, action };
