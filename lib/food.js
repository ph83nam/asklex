import extend from 'extend';
import logger from './log';
import util from './util';
import { getDynamoDb } from '../lib/aws';

const TABLE_FOOD = `${process.env.DYNAMO_TABLE_PREFIX || 'table'}foods`;
const db = getDynamoDb();

/**
 * save food
 * @param {object} entity
 * @param {function} callback
 */
function save(entity, callback) {
  logger.debug('save restaurant', entity);
  let params;
  let callable;

  if (entity.createdAt) {
    // enlist updates
    const key = { rid: entity.rid };
    params = util.dynamo.prepareUpdate(entity, TABLE_FOOD, key);
    callable = db.update;
  } else {
    const required = ['rid', 'name'];
    required.forEach((attr) => {
      if (!entity[attr]) throw new Error(`${attr} is missing`);
    });
    // assign createdAt
    extend(entity, { createdAt: (new Date()).getTime() });
    params = {
      TableName: TABLE_FOOD,
      Item: entity,
    };
    callable = db.put;
  }

  return new Promise((resolve, reject) => {
    callable.call(db, params, (err, data) => {
      if (err) {
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
 * search food
 * @param {object} options
 */
function search(options) {
  logger.save('search food', options);
}

const dao = {
  saveFood: save,
  searchFood: search,
};

export default dao;
