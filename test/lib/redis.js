import redis from 'redis';
import { expect } from 'chai';
import * as libRedis from '../../lib/redis';

describe('lib/redis', () => {
  const timestamp = (new Date()).getTime();
  const key = `key${timestamp}`;
  const value = `value${timestamp}`;

  // test set cache
  it('should set cache', (done) => {
    libRedis.set(key, value).then(() => {
      done();
    }).catch((error) => {
      expect(error).fail(error, 'no error occured', 'failed to store cache');
    });
  });

  // test get cache
  it('should get cache', (done) => {
    libRedis.get(key).then((result) => {
      expect(result).to.equal(value, 'cache value was not retrieved');
      done();
    }).catch((error) => {
      expect(error).faile(error, 'no error occured', 'failed to get cache');
    });
  });

  // test error handling
  it('should not throw error for NR_CLOSED', () => {
    const error = new redis.AggregateError({
      errors: [1, 2],
      code: 'NR_CLOSED',
    });
    libRedis.getClient().emit('error', error);
  });

  // test error handling
  it('should throw error if not NR_CLOSED', () => {
    const testFn = () => {
      const error = new redis.AggregateError({
        errors: [1, 2],
        code: 'NR_UNKNOWN',
      });
      libRedis.getClient().emit('error', error);
    };
    expect(testFn).to.throw();
  });
});

