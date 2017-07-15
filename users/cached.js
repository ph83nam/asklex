import extend from 'extend';
import * as redis from '../lib/redis';
import * as dao from './dao';

let waitForCache = false;

/**
 * force wait for cache to finish
 * @param {boolean} wait
 */
function forceWaitForCache(wait) {
  waitForCache = wait;
}

/**
 * get user object
 * @param {string} userId
 * @param {string|null} platform
 * @param {function} callback
 */
function getUser(userId, platform, callback) {
  const platformId = platform ? `${userId}:${platform}` : userId;
  const key = ['user:', platformId].join('');
  redis.get(key, (error, data) => {
    if (error || !data) {
      // get from database
      dao.getUser(platformId, null, (err, dat) => {
        if (!err && dat) {
          // cache result for later access
          redis.set(key, JSON.stringify(dat));
        }
        // invoke callback
        callback(err, dat);
      });
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
          if (callback && waitForCache) callback(error, data);
        });
      });
    }

    // invoke callback if not waiting for cache
    if (!waitForCache) callback(error, data);
  });
}

export { getUser, saveUser };
export { forceWaitForCache };

