/* eslint-env mocha */
/* eslint-disable func-names, prefer-arrow-callback */

import { expect } from 'chai';
import * as cached from '../../users/cached';
import * as redis from '../../lib/redis';

describe('users/cached', function () {
  // configure library with hooks
  before(function () {
    cached.forceWaitForCache(true);
  });
  after(function () {
    cached.forceWaitForCache(false);
  });

  const userId = `${(new Date()).getTime()}`.split('').reverse().join('');

  const user = {
    uid: userId,
    firstName: 'Mocha',
    lastName: 'Redis',
    email: 'redis@nodejs.unit',
  };

  const key = ['user:', userId].join('');

  // user create
  it('#save:create', function (done) {
    cached.saveUser(user, (error, success) => {
      expect(error).to.be.null;
      expect(success).not.to.be.null;
      done();
    });
  });

  // verify cache
  it('#get', function (done) {
    let retrieved;
    let stored;

    const verify = () => {
      if (retrieved && stored) {
        expect(retrieved.firstName).to.equal(stored.firstName);
        done();
      }
    };

    redis.get(key, (error, success) => {
      expect(error).to.be.null;
      expect(success).not.to.be.null;

      // parse data
      const data = JSON.parse(success);
      expect(data.uid).to.equal(user.uid);
      retrieved = data;
      verify();
    });

    cached.getUser(user.uid, null, (error, success) => {
      expect(error).to.be.null;
      expect(success.uid).to.equal(success.uid);
      stored = success;
      verify();
    });
  });
});
