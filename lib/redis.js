import redis from 'redis';
import assert from 'assert';
import logger from './log';

let client;

/**
 * {@return redis}
 */
function getClient() {
  if (!client) {
    client = redis.createClient(process.env.REDIS_URL);

    // handle error
    client.on('error', (err) => {
      assert(err instanceof Error);
      assert(err instanceof redis.AbortError);
      assert(err instanceof redis.AggregateError);

      // The set and get got aggregated in here
      assert.strictEqual(err.errors.length, 2);
      assert.strictEqual(err.code, 'NR_CLOSED');
    });
  }
  return client;
}

/**
 * store data
 * @param {string} key
 * @param {any} data
 * @param {function} callback
 */
function set(key, data, callback) {
  const start = (new Date()).getTime();
  getClient().set(key, data, (err) => {
    if (err) {
      logger.warn('failed to set cache', key, err);
    } else {
      const end = (new Date()).getTime() - start;
      logger.debug(`update cache (${end}ms)`, key);
    }
    if (callback) callback(err);
  });
}

/**
 * retrieve data
 * @param {string} key
 * @param {function} callback
 */
function get(key, callback) {
  getClient().get(key, callback);
}

export { getClient, set, get };
