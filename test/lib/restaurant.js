/* eslint-env mocha */
/* eslint-disable func-names, prefer-arrow-callback */

import { expect } from 'chai';
import dao from '../../lib/restaurant';

describe('lib/restaurant', function () {
  const entity = {
    rid: `rest-${(new Date()).getTime()}`,
    name: 'Test restaurant',
    address: 'Mocha test',
  };

  it('#save:insert', function (done) {
    dao.saveRestaurant(entity, (err, data) => {
      expect(err).to.be.null;
      expect(data).not.to.be.null;
      expect(entity.createdAt).not.to.be.empty;
      done();
    });
  });

  it('#save:update', function (done) {
    const update = {
      rid: entity.rid,
      name: 'Updated test restaurant',
      createdAt: entity.createdAt,
    };
    dao.saveRestaurant(update, (err, data) => {
      expect(err).to.be.null;
      expect(data).not.null;
      const attrs = data.Attributes;
      expect(attrs).not.empty;
      expect(attrs.name).to.equal(update.name);
      done();
    });
  });

  it('#save:insert-error', function (done) {
    delete entity.createdAt;
    const errData = {
      rid: [],
      name: 'error',
    };
    dao.saveRestaurant(errData, (err) => {
      expect(err).not.to.be.null;
      done();
    });
  });
});
