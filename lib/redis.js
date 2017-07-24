import redis from 'redis';
import assert from 'assert';
import logger from './log';

let client;

// handle done event
process.on('done', () => {
  if (client) {
    logger.debug('disconnecting with redis . . .');
    client.unref(); // .end(true);
    client = null;
  }
});

/**
 * {@return redis}
 */
function getClient() {
  if (!client) {
    const started = (new Date()).getTime();
    client = redis.createClient(process.env.REDIS_URL);

    // handle error
    client.on('error', (err) => {
      if (err.code !== 'NR_CLOSED') {
        logger.error('redis error', err);
      }
      assert(err instanceof Error);
      assert(err instanceof redis.AbortError);
      assert(err instanceof redis.AggregateError);

      // The set and get got aggregated in here
      assert.strictEqual(err.errors.length, 2);
      assert.strictEqual(err.code, 'NR_CLOSED');
    });

    client.on('connect', () => {
      const interval = (new Date()).getTime() - started;
      logger.debug(`connected to redis after ${interval}ms`);
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
  let funResolve;
  let funReject;
  const promise = new Promise((resolve, reject) => {
    funResolve = resolve;
    funReject = reject;
  });
  getClient().set(key, data, (err) => {
    if (err) {
      logger.warn('failed to set cache', key, err);
    } else {
      const end = (new Date()).getTime() - start;
      logger.debug(`update "${key}" after (${end}ms)`, key);
    }
    // invoke callback
    if (typeof callback === 'function') callback(err);
    // invoke promise
    if (err) {
      funReject(err);
    } else {
      funResolve(key, data);
    }
  });

  return promise;
}

/**
 * retrieve data
 * @param {string} key
 * @param {function} callback
 * @return {Future}
 */
function get(key, callback) {
  const started = (new Date()).getTime();

  let funResolve;
  let funReject;
  const promise = new Promise((resolve, reject) => {
    funResolve = resolve;
    funReject = reject;
  });

  getClient().get(key, (error, success) => {
    const interval = (new Date()).getTime() - started;
    logger.debug(`retrieving "${key}" response after ${interval}ms`, success || '<empty>');
    // invoke callback
    if (typeof callback === 'function') callback(error, success);

    // invoke promise
    if (error) {
      funReject(error);
    } else {
      funResolve(success);
    }
  });
  return promise;
}

export { getClient, set, get };
