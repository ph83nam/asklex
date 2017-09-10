/* eslint-env mocha */
/* eslint-disable func-names, prefer-arrow-callback */

import { expect } from 'chai';
import * as bot from '../../messenger/bot';
import * as lambda from '../lib/lambda';

const FB_USER_ID = process.env.FB_USER_ID;
const FB_PAGE_ID = process.env.FB_PAGE_ID;
const FB_VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN;

describe('bot', function () {
  it('#getUserProfile', function (done) {
    bot.getUserProfile(FB_USER_ID, (error, success) => {
      expect(error).to.be.null;
      expect(success).to.haveOwnProperty('firstName');
      done();
    });
  });

  it('#sendMessage', function (done) {
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

  it('#sendMessage:no callback', function (done) {
    const msg = {
      recipient: {
        id: FB_USER_ID,
      },
      message: {
        text: 'I called without callback!',
      },
    };
    bot.sendMessage(msg).on('complete', (resp, body) => {
      expect(resp.statusCode).equal(200);
      expect(body.message_id).to.not.be.empty;
      done();
    });
  });

  it('#sendMessage:error', function (done) {
    const msg = {
      recipient: {
        id: 'none',
      },
      message: {
        text: 'I called without callback!',
      },
    };
    bot.sendMessage(msg).on('complete', (resp) => {
      expect(resp.statusCode).equals(400);
      done();
    });
  });

  it('#messsage: 403', function () {
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

  it('#messsage:subscribe', function () {
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
describe('bot-message', function () {
  it('hi', function (done) {
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
      const resObj = JSON.parse(response.body);
      expect(resObj).instanceof(Object);

      // verify response
      expect(resObj.type).to.eq('success');
      done();
    };
    bot.message(event, lambda.getContextObject(), testCb);
  });

  // test audio message
  it('#onMessageEvent:audio', function (done) {
    const event = {
      sender: { id: FB_USER_ID },
      recipient: { id: FB_PAGE_ID },
      timestamp: (new Date()).getTime() - 1000,
      message: {
        mid: 'mid.$cAADGzHNJiWhjetsGQVdSZW9e4HJx',
        seq: 13219,
        attachments: [
          {
            type: 'audio',
            url: 'file:/./not_found.mpg',
          },
        ],
      },
    };

    bot.onMessageEvent(event, (error) => {
      expect(error).not.to.be.null;
      done();
    });
  });
});
