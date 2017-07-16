import logger from './log';

/**
 * invoke lex
 * @param {string} type
 * @param {string} data
 * @param {object} user
 * @param {function} callback
 */
function lex(type, data, user, callback) {
  logger.debug('lex', type, data);
  callback('not implemented');
}

export { lex as default };
