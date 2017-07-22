import { expect } from 'chai';
import * as bot from '../../messenger/bot';
import * as lambda from '../lib/lambda';

const FB_USER_ID = process.env.FB_USER_ID;
const FB_PAGE_ID = process.env.FB_PAGE_ID;
const FB_VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN;

describe('bot', () => {
  it('#getUserProfile', (done) => {
    bot.getUserProfile(FB_USER_ID, (error, success) => {
      expect(error).to.be.null;
      expect(success).to.haveOwnProperty('firstName');
      done();
    });
  });

  it('#sendMessage', (done) => {
    const msg = {
      recipient: {
        id: FB_USER_ID,
      },
      message: {
        text: 'hello, I\'m Mocha!',
      },
    };
    bot.sendMessage(msg, (error, success) => {
      expect(error).to.be.null;
      expect(success.message_id).not.to.be.undefined;
      done();
    });
  });

  it('#messsage: 403', () => {
    const event = {
      queryStringParameters: {
        'hub.mode': 'subscribe',
      },
    };
    const context = {};
    bot.message(event, context, (error, response) => {
      expect(error).to.be.null;
      expect(response.statusCode).eq(403);
    });
  });

  it('#messsage:subscribe', () => {
    const event = {
      queryStringParameters: {
        'hub.mode': 'subscribe',
        'hub.challenge': '1234567890',
        'hub.verify_token': FB_VERIFY_TOKEN,
      },
    };
    const context = {};
    bot.message(event, context, (error, response) => {
      expect(error).to.be.null;
      expect(response.body).to.equal('1234567890');
    });
  });
});

// test real message pageload
describe('bot-message', () => {
  it('hi', (done) => {
    const body = {
      object: 'page',
      entry: [{
        id: '218580821997521',
        time: (new Date()).getTime(),
        messaging: [
          {
            sender: { id: FB_USER_ID },
            recipient: { id: FB_PAGE_ID },
            timestamp: (new Date()).getTime() - 1000,
            message: {
              mid: 'mid.$cAADGzHNJiWhjetsGQVdSZW9e4HJx',
              seq: 13219,
              text: 'Hi',
            },
          },
        ],
      }],
    };
    const event = lambda.getEventObject(body);
    const testCb = (error, response) => {
      expect(error).to.be.null;
      expect(response).not.to.be.empty;
      expect(response.statusCode).to.eq(200);
      expect(response.body).instanceof(Object);

      // verify response
      const resp = response.body;
      expect(resp.type).to.eq('success');
      done();
    };
    testCb.test = true;
    bot.message(event, lambda.getContextObject(), testCb);
  });
});
