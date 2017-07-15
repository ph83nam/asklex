import extend from 'extend';
import * as redis from '../lib/redis';
import * as dao from './dao';

/**
 * get user object
 * @param {string} userId
 * @param {string|null} platform
 * @param {function} callback
 */
function getUser(userId, platform, callback) {
  const platformId = platform ? `${userId}:${platform}` : userId;
  redis.get(['user:', platformId].join(''), (error, data) => {
    if (error || !data) {
      dao.getUser(platformId, null, callback);
    } else {
      callback(error, JSON.parse(data));
    }
  });
}

/**
 * @param {object} user
 * @param {function} callback
 */
function saveUser(user, callback) {
  dao.saveUser(user, (error, data) => {
    if (!error) {
      // retrieve cached data to update
      const key = ['user:', user.uid].join('');
      redis.get(key, (err, dat) => {
        if (err) return;
        const cache = dat ? extend(dat, user) : user;
        redis.set(key, JSON.stringify(cache), () => {
          if (callback) callback(error, data);
        });
      });
    }
  });
}

export { getUser, saveUser };
