import logger from '../log';

/**
 * help
 * @param {object} intent
 * @param {object} session
 * @param {function} callback
 */
function help(intent, session, callback) {
  logger.debug('help', intent, session);
  callback(null, {});
}

export default help;
