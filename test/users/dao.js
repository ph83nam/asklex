import { expect } from 'chai';
import * as dao from '../../users/dao';

describe('users/dao', () => {
  const userId = `${(new Date()).getTime()}`.split('').reverse().join('');
  const user = {
    uid: userId,
    firstName: 'Mocha',
    lastName: 'Test',
    email: 'tester@nodejs.unit',
  };

  // user create
  it('#save:create', (done) => {
    dao.saveUser(user, (error, success) => {
      expect(error).to.be.null;
      expect(success).not.to.be.null;
      done();
    });
  });

  // user get
  it('#get', (done) => {
    dao.getUser(user.uid, null, (error, data) => {
      expect(error).to.be.null;
      expect(data.firstName).to.equal(user.firstName);
      done();
    });
  });

  // user get NOT_FOUND
  it('#get:NOT_FOUND', (done) => {
    dao.getUser('NOT_SAVED', null, (error) => {
      expect(error).to.equal('NOT_FOUND');
      done();
    });
  });

  // user update
  it('#save:update', (done) => {
    user.firstName = 'Updated';
    dao.saveUser(user, (error, success) => {
      expect(error).to.be.null;
      expect(success.Attributes).not.to.be.undefined;
      done();
    });
  });
});
