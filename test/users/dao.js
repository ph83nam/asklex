/* eslint-env mocha */
/* eslint-disable func-names, prefer-arrow-callback */

import { expect } from 'chai';
import * as dao from '../../users/dao';

describe('users/dao', function () {
  const userId = `${(new Date()).getTime()}`.split('').reverse().join('');
  const user = {
    uid: userId,
    firstName: 'Mocha',
    lastName: 'Test',
    email: 'tester@nodejs.unit',
  };

  // user create
  it('#save:create', function (done) {
    dao.saveUser(user, (error, success) => {
      expect(error).to.be.null;
      expect(success).not.to.be.null;
      done();
    });
  });

  // user get
  it('#get', function (done) {
    dao.getUser(user.uid, null, (error, data) => {
      expect(error).to.be.null;
      expect(data.firstName).to.equal(user.firstName);
      done();
    });
  });

  // user get error
  it('#get', function (done) {
    dao.getUser(null, null, (error) => {
      expect(error).not.to.be.null;
      done();
    });
  });

  // user get NOT_FOUND
  it('#get:NOT_FOUND', function (done) {
    dao.getUser('NOT_SAVED', null, (error) => {
      expect(error).to.equal('NOT_FOUND');
      done();
    });
  });

  // user get NOT_FOUND
  it('#get:eror', function (done) {
    dao.getUser('', null, (error) => {
      expect(error).not.to.be.null;
      done();
    });
  });

  // user update
  it('#save:update', function (done) {
    user.firstName = 'Updated';
    dao.saveUser(user, (error, success) => {
      expect(error).to.be.null;
      expect(success.Attributes).not.to.be.undefined;
      done();
    });
  });

  it('#save:update error', function (done) {
    const errorUser = {
      uid: '',
      createdAt: 123,
    };
    dao.saveUser(errorUser, (error) => {
      expect(error).not.to.be.null;
      done();
    });
  });
});
