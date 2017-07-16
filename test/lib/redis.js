import redis from 'redis';
import { expect } from 'chai';
import * as libRedis from '../../lib/redis';

describe('lib/redis', () => {
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

