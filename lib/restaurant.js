import extend from 'extend';
import logger from './log';
import util from './util';
import { getDynamoDb } from '../lib/aws';

const TABLE_RESTAURANT = `${process.env.DYNAMO_TABLE_PREFIX || 'table'}restaurants`;
const db = getDynamoDb();

/**
 * save food data
 * @param {object} entity
 * @param {function} callback
 * @return {Promise}
 */
function save(entity, callback) {
  logger.debug('save restaurant', entity);
  let params;
  let callable;

  if (entity.createdAt) {
    // enlist updates
    const key = { rid: entity.rid };
    params = util.dynamo.prepareUpdate(entity, TABLE_RESTAURANT, key);
    callable = db.update;
  } else {
    const required = ['rid', 'name'];
    required.forEach((attr) => {
      if (!entity[attr]) throw new Error(`${attr} is missing`);
    });
    // assign createdAt
    extend(entity, { createdAt: (new Date()).getTime() });
    params = {
      TableName: TABLE_RESTAURANT,
      Item: entity,
    };
    callable = db.put;
  }

  return new Promise((resolve, reject) => {
    callable.call(db, params, (err, data) => {
      if (err) /* istanbul ignore next */ {
        logger.error('Unable to save restaurant. Error JSON:', JSON.stringify(err, null, 2));
        reject(err);
      } else {
        logger.info('Save restaurant succeeded:', JSON.stringify(data, null, 2));
        resolve(data);
      }

      // invoke callback to report result
      util.invoke(callback, err, data);
    });
  });
}

/**
 * get restaurant object
 * @param {string} rid
 * @param {function} callback
 */
function get(rid, callback) {
  const params = {
    TableName: TABLE_RESTAURANT,
    KeyConditionExpression: '#id = :rid',
    ExpressionAttributeNames: {
      '#id': 'rid',
    },
    ExpressionAttributeValues: {
      ':rid': rid,
    },
  };
  return new Promise((resolve, reject) => {
    db.query(params, (err, data) => {
      let callbackErr = null;
      let callbackDat;
      if (err) /* istanbul ignore next */ {
        logger.error('Unable to load restaurant. Error JSON:', JSON.stringify(err, null, 2));
        reject(err);
        callbackErr = err;
      } else if (data.Items.length === 0) {
        reject(callbackErr = 'NOT_FOUND');
      } else {
        logger.info('Load restaurant succeeded:', JSON.stringify(data, null, 2));
        resolve(callbackDat = data.Items[0]);
      }

      // invoke callback to report result
      util.invoke(callback, callbackErr, callbackDat);
    });
  });
}

/**
 * search restaurant
 * @param {object} options
 */
function search(options) {
  logger.debug('search restaurant', options);
}

const dao = {
  saveRestaurant: save,
  getRestaurant: get,
  searchRestaurant: search,
};

export default dao;
