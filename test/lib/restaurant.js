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

  it('#get:success', function (done) {
    if (!entity.createdAt) this.skip();
    dao.getRestaurant(entity.rid, (err, data) => {
      expect(err).to.be.null;
      expect(data).not.to.be.null;
      ['rid', 'name', 'address'].forEach((field) => {
        expect(data[field]).equal(entity[field]);
      });
      done(err);
    });
  });

  it('#get:notfound', function (done) {
    if (!entity.createdAt) this.skip();
    dao.getRestaurant(`${entity.rid}-notfound`, (err) => {
      expect(err).equal('NOT_FOUND');
      done();
    });
  });

  it('#save:update', function (done) {
    if (!entity.createdAt) this.skip();
    const update = {
      rid: entity.rid,
      name: 'New test restaurant',
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

  it('#putRestaurant:insert', function (done) {
    const saveData = {
      rid: `${entity.rid}-putNew`,
      name: 'Updated test restaurant',
      createdAt: entity.createdAt,
    };
    dao.putRestaurant(saveData, (err, data) => {
      expect(err).to.be.null;
      expect(data).not.null;
      const attrs = data.Attributes;
      expect(attrs).not.empty;
      expect(attrs.name).to.equal(saveData.name);
      done();
    });
  });

  it('#putRestaurant:update', function (done) {
    if (!entity.createdAt) this.skip();
    entity.category = 'Popular';
    dao.putRestaurant(entity, (err, data) => {
      expect(err).to.be.null;
      expect(data).not.null;
      const attrs = data.Attributes;
      expect(attrs).not.empty;
      expect(attrs.category).to.equal(entity.category);
      done();
    });
  });

  it('#putRestaurant:error', function (done) {
    if (!entity.createdAt) this.skip();
    entity.parent = entity;
    dao.putRestaurant(entity, (err) => {
      expect(err).not.null;
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
