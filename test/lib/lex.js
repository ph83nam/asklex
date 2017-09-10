/* eslint-env mocha */
/* eslint-disable func-names, prefer-arrow-callback */

import { expect } from 'chai';
import { getLexEvent, getContextObject } from './lambda';
import * as lex from '../../lib/lex';

describe('lex.handle', function () {
  it('AskRestaurant', function (done) {
    const intent = {
      name: 'AskRestaurant',
      slots: {
        restaurant: 'the Sushi Bar',
        location: 'District 1',
      },
      confirmationStatus: 'None',
    };
    const event = getLexEvent(intent);
    lex.handle(event, getContextObject('lex'), (error, result) => {
      expect(error).to.be.null;
      expect(result).not.empty;
      done();
    });
  });

  it('ChooseRestaurant', function (done) {
    const intent = {
      name: 'ChooseRestaurant',
      slots: {
        location: 'District 1',
        restaurant: 'the Sushi Bar',
      },
      confirmationStatus: 'None',
    };
    const event = getLexEvent(intent);
    lex.handle(event, getContextObject('lex'), (error, result) => {
      expect(error).to.be.null;
      expect(result).not.empty;
      done();
    });
  });

  it('AskFood', function (done) {
    const intent = {
      name: 'AskFood',
      slots: {
        restaurant: 'the Sushi Bar',
      },
      confirmationStatus: 'None',
    };
    const event = getLexEvent(intent);
    lex.handle(event, getContextObject('lex'), (error, result) => {
      expect(error).to.be.null;
      expect(result).not.empty;
      done();
    });
  });

  it('OrderFood', function (done) {
    const intent = {
      name: 'OrderFood',
      slots: {
        number: null,
        restaurant: 'the Sushi Bar',
        action: null,
        food: 'pizza',
      },
      confirmationStatus: 'None',
    };
    const event = getLexEvent(intent);
    lex.handle(event, getContextObject('lex'), (error, result) => {
      expect(error).to.be.null;
      expect(result).not.empty;
      done();
    });
  });

  it('ReviewOrder', function (done) {
    const intent = {
      name: 'ReviewOrder',
      slots: {
      },
      confirmationStatus: 'None',
    };
    const event = getLexEvent(intent);
    lex.handle(event, getContextObject('lex'), (error, result) => {
      expect(error).to.be.null;
      expect(result).not.empty;
      done();
    });
  });

  it('PlaceOrder', function (done) {
    const intent = {
      name: 'PlaceOrder',
      slots: {
      },
      confirmationStatus: 'None',
    };
    const event = getLexEvent(intent);
    lex.handle(event, getContextObject('lex'), (error, result) => {
      expect(error).to.be.null;
      expect(result).not.empty;
      done();
    });
  });

  it('NoIdea', function (done) {
    const intent = {
      name: 'NoIdea',
      slots: {
      },
      confirmationStatus: 'None',
    };
    const event = getLexEvent(intent);
    lex.handle(event, getContextObject('lex'), (error, result) => {
      expect(error).to.be.null;
      expect(result).not.empty;
      done();
    });
  });

  it('#getLexContentParams: text and update locale', function (done) {
    const user = {
      uid: 'lexContextParams',
      createdAt: 123,
    };
    lex.getLexContentParams(user, 'text', 'What do you say?', (err, res) => {
      expect(err).to.be.null;
      expect(res).not.to.be.null;
      done();
    });
  });
});
