import logger from '../lib/log';
import { getDynamoDb } from '../lib/aws';

const TABLE_USERS = 'users';
const db = getDynamoDb();

/**
 * get user object
 * @param {string} userId
 * @param {string|null} platform
 * @param {function} callback
 */
function getUser(userId, platform, callback) {
  const params = {
    TableName: TABLE_USERS,
    KeyConditionExpression: '#id = :uid',
    ExpressionAttributeNames: {
      '#id': 'uid',
    },
    ExpressionAttributeValues: {
      ':uid': platform ? `${userId}:${platform}` : userId,
    },
  };
  db.query(params, (err, data) => {
    if (err) {
      logger.info('Unable to query user. Error:', JSON.stringify(err, null, 2));
      callback(err);
    } else if (data.Items.length === 0) {
      callback('NOT_FOUND');
    } else {
      callback(null, data.Items[0]);
    }
  });
}

/**
 * @param {object} user
 * @param {function} callback
 */
function saveUser(user, callback) {
  const item = user;
  if (user.createdAt) {
    // enlist updates
    const updates = ['updatedAt = :updatedAt'];
    const values = { ':updatedAt': (new Date()).getTime() };
    const ignored = ['createdAt', 'uid'];
    Object.entries(item).forEach((pair) => {
      if (pair[1] !== undefined && ignored.indexOf(pair[0]) === -1) {
        updates.push(`${pair[0]} = :${pair[0]}`);
        values[`:${pair[0]}`] = pair[1];
      }
    });
    // invoke update
    const params = {
      TableName: TABLE_USERS,
      Key: {
        uid: user.uid,
      },
      UpdateExpression: `set ${updates.join(', ')}`,
      ExpressionAttributeValues: values,
      ReturnValues: 'UPDATED_NEW',
    };
    db.update(params, (err, data) => {
      if (err) {
        logger.error('Unable to update user. Error JSON:', JSON.stringify(err, null, 2));
      } else {
        logger.info('Update user succeeded:', JSON.stringify(data, null, 2));
      }
      callback(err, data);
    });
  } else {
    const required = ['uid', 'firstName', 'lastName'];
    required.forEach((attr) => {
      if (!user[attr]) throw new Error(`${attr} is missing`);
    });
    // assign createdAt
    item.createdAt = (new Date()).getTime();
    const params = {
      TableName: TABLE_USERS,
      Item: item,
    };
    db.put(params, (err, data) => {
      if (err) {
        logger.error('Unable to save user. Error JSON:', JSON.stringify(err, null, 2));
      } else {
        logger.info('Added user:', JSON.stringify(data, null, 2));
      }
      callback(err, data);
    });
  }
}

export { getUser, saveUser };