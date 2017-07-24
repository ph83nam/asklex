import logger from '../log';

/**
 * review order
 * @param {object} intent
 * @param {object} session
 * @param {function} callback
 */
function review(intent, session, callback) {
  logger.debug('ask', intent, session);
  callback(null, {});
}

/**
 * place order
 * @param {object} intent
 * @param {object} session
 * @param {function} callback
 */
function place(intent, session, callback) {
  logger.debug('place', intent, session);
  callback(null, {});
}

/**
 * reset order
 * @param {object} intent
 * @param {object} session
 * @param {function} callback
 */
function reset(intent, session, callback) {
  logger.debug('reset', intent, session);
  callback(null, {});
}

export { review, place, reset };

