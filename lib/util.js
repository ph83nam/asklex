
/**
 * invoke callback function
 * @param {function} callback
 */
function invokeCallback(callback) {
  if (typeof callback === 'function') {
    const args = Array.prototype.slice.call(arguments, 1);
    callback(...args);
  }
}

const util = {
  invoke: invokeCallback,
};

export default util;
