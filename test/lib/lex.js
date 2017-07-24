import { expect } from 'chai';
import { getLexEvent, getContextObject } from './lambda';
import * as lex from '../../lib/lex';

describe('lex.handle', () => {
  it('AskRestaurant', (done) => {
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

  it('ChooseRestaurant', (done) => {
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

  it('AskFood', (done) => {
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

  it('OrderFood', (done) => {
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

  it('ReviewOrder', (done) => {
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

  it('PlaceOrder', (done) => {
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

  it('NoIdea', (done) => {
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
});
