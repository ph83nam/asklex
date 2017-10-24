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
    const now = new Date();
    extend(entity, {
      createdAt: now.getTime(),
      updatedAt: now.getTime(),
    });
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
        logger.info('Save restaurant succeeded:', entity.name, entity.rid);
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
        callbackDat = data.Items[0];
        logger.info('Load restaurant succeeded:', callbackDat.name, callbackDat.rid);
        resolve(callbackDat);
      }

      // invoke callback to report result
      util.invoke(callback, callbackErr, callbackDat);
    });
  });
}

/**
 * save or update restaurant
 * @param {object} entity
 * @param {function} callback
 */
function saveOrUpdate(entity, callback) {
  return new Promise((resolve, reject) => {
    get(entity.rid, (err, saved) => {
      // handle get callback
      let saving;
      if (err) {
        /* istanbul ignore else */
        if (err === 'NOT_FOUND') {
          saving = entity;
        } else {
          reject(err);
          util.invoke(callback, err);
          return;
        }
      } else {
        saving = {
          rid: saved.rid,
          createdAt: saved.createdAt,
          updatedAt: (new Date()).getTime(),
        };
        Object.keys(entity).forEach((attr) => {
          if (entity[attr] !== saved[attr]) {
            saving[attr] = entity[attr];
          }
        });
      }
      save(saving, (saveErr, saveDat) => {
        // handle save callback
        if (saveErr) {
          reject(saveErr);
          util.invoke(callback, saveErr);
        } else {
          // invoke success callback
          extend(entity, saving);
          resolve(saveDat);
          util.invoke(callback, saveErr, saveDat);
        }
      });
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
  putRestaurant: saveOrUpdate,
  searchRestaurant: search,
};

export default dao;
