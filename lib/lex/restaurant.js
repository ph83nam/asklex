import logger from '../log';

/**
 * ask restaurant
 * @param {object} intent
 * @param {object} session
 * @param {function} callback
 */
function ask(intent, session, callback) {
  logger.debug('ask', intent, callback);
  callback(null, {});
}

/**
 * choose restaurant
 * @param {object} intent
 * @param {object} session
 * @param {function} callback
 */
function choose(intent, session, callback) {
  logger.debug('choose', intent, callback);
  callback(null, {});
}

export { ask, choose };
