/* eslint-env mocha */
/* eslint-disable func-names, prefer-arrow-callback */

import * as lex from '../../lib/lex';

/**
 * return event object payload
 * @param {object|string} bodyData
 * @return {object}
 */
function getEventObject(bodyData) {
  return {
    path: '/messenger',
    headers: {},
    queryStringParameters: null,
    pathParameters: null,
    stageVariables: null,
    requestContext: {
      path: '/dev/messenger',
      accountId: 'xxxxxxx',
      resourceId: 'resxxxxxx',
      stage: 'dev',
      identity: {
        sourceIp: '173.252.90.109',
        userArn: null,
        userAgent: null,
        user: null,
      },
      httpMethod: 'POST',
      apiId: 'apiGatewayRandomId',
    },
    body: bodyData,
    isBase64Encoded: false,
  };
}

/**
 * get context object to pass to lamda
 * @param {string | null} functionName
 * @return {object}
 */
function getContextObject(functionName) {
  const funcName = functionName || 'messengerMessage';
  const maxExecMillis = 30 * 1000;
  const ended = (new Date()).getTime() + maxExecMillis;
  return {
    get callbackWaitsForEmptyEventLoop() {
      return false;
    },
    set callbackWaitsForEmptyEventLoop(value) {
      throw new Error('operation not allow');
    },
    done: () => {},
    succeed: () => {},
    fail: () => {},
    logGroupName: `/aws/lambda/lexofood-dev-${funcName}`,
    logStreamName: '2017/07/16/[$LATEST]709a7ddfce3a4c899eec0ac91e45a349',
    functionName: `lexofood-dev-${funcName}`,
    memoryLimitInMB: '512',
    functionVersion: '$LATEST',
    getRemainingTimeInMillis: () => {
      const remaining = ended - (new Date()).getTime();
      if (remaining <= 0) throw new Error('You are dead!');
      return remaining;
    },
    invokeid: 'afab4b5d-69e7-11e7-ac68-a5bb94a50489',
    awsRequestId: 'afab4b5d-69e7-11e7-ac68-a5bb94a50489',
    invokedFunctionArn: `arn:aws:lambda:us-east-1:xxxxx:function:lexofood-dev-${funcName}`,
  };
}

/**
 * get a lex event
 * @param {object | null} currentIntent
 * @param {string | null} uid
 * @param {object | null} sessionAttrs
 */
function getLexEvent(currentIntent, uid, sessionAttrs) {
  const theUid = uid || process.env.FB_USER_ID || 'xxxxxxxx:FB';
  return {
    messageVersion: '1.0',
    invocationSource: 'FulfillmentCodeHook',
    userId: theUid,
    sessionAttributes: sessionAttrs || {
      userId: theUid,
      firstName: 'Nam',
      lastName: 'Pham',
      gender: 'male',
    },
    bot: { name: lex.BOT_NAME, alias: lex.BOT_ALIAS, version: '2' },
    outputDialogMode: 'Text',
    currentIntent: currentIntent || {
      name: 'OrderFood',
      slots: {
        number: null,
        restaurant: 'the Sushi Bar',
        action: null,
        food: 'pizza',
      },
      confirmationStatus: 'None',
    },
    inputTranscript: 'I want pizza from the Sushi Bar',
  };
}

export { getEventObject, getContextObject };
export { getLexEvent };
