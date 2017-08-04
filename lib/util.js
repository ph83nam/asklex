import logger from './log';
/**
 * invoke callback function
 * @param {function} callback
 */
function invokeCallback(callback) {
  if (typeof callback === 'function') {
    const args = Array.prototype.slice.call(arguments, 1);
    callback(...args);
  } else if (callback) {
    const obj = {};
    Error.captureStackTrace(obj, invokeCallback);
    logger.warn('provided non-function callback', obj.stack);
  }
}

const util = {
  invoke: invokeCallback,
};

export default util;
