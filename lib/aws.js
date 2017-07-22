import AWS from 'aws-sdk';
import logger from './log';

let cachedCredentials;

/**
 * @return {AWS.Credentials}
 */
function getCredentials() {
  if (!cachedCredentials) {
    const provider = new AWS.CredentialProviderChain();
    provider.resolve((error, data) => {
      if (error) {
        logger.error('Failed to resolve credentials', error);
        throw error;
      }
      cachedCredentials = data;
    });
  }
  return cachedCredentials;
}

/**
 * @return {AWS.DynamoDB}
 */
function getDynamoDb() {
  getCredentials();
  const awsRegion = AWS.config.region || process.env.AWS_REGION;
  // detect endpoint
  let uri;
  if (process.env.DYNAMODB_ENDPOINT) {
    uri = process.env.DYNAMODB_ENDPOINT;
  } else {
    uri = `https://dynamodb.${awsRegion}.amazonaws.com`;
  }
  AWS.config.update({
    region: awsRegion,
    endpoint: uri,
  });
  return new AWS.DynamoDB.DocumentClient();
}

/**
 * @return {AWS.LexRuntime}
 */
function getLexRuntime() {
  getCredentials();
  const awsRegion = AWS.config.region || process.env.AWS_REGION;
  return new AWS.LexRuntime({
    region: awsRegion,
    endpoint: `https://runtime.lex.${awsRegion}.amazonaws.com`,
    credentials: cachedCredentials,
  });
}

export { getCredentials, getDynamoDb };
export { getLexRuntime };
