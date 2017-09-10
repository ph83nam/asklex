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

/**
 * prepare parameters for dynamodb update
 * @param {object} entity
 * @param {string} table
 * @param {object} key
 * @param {array | null} ignoredParams
 */
function prepareDynamoUpdate(entity, table, key, ignoredParams) {
  const ignored = ignoredParams || ['createdAt'];
  const updates = ['#updatedAt = :updatedAt'];
  const names = { '#updatedAt': 'updatedAt' };
  const values = { ':updatedAt': (new Date()).getTime() };
  Object.keys(entity).forEach((attr) => {
    if (Object.prototype.hasOwnProperty.call(entity, attr) &&
      key[attr] === undefined &&
      ignored.indexOf(attr) === -1) {
      updates.push(`#${attr} = :${attr}`);
      names[`#${attr}`] = attr;
      values[`:${attr}`] = entity[attr];
    }
  });
  // invoke update
  const params = {
    TableName: table,
    Key: key,
    UpdateExpression: `set ${updates.join(', ')}`,
    ExpressionAttributeNames: names,
    ExpressionAttributeValues: values,
    ReturnValues: 'UPDATED_NEW',
  };

  return params;
}

const util = {
  invoke: invokeCallback,
  dynamo: {
    prepareUpdate: prepareDynamoUpdate,
  },
};

export default util;
