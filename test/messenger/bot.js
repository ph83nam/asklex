import { expect } from 'chai';
import * as bot from '../../messenger/bot';

const FB_USER_ID = process.env.FB_USER_ID;
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
