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
