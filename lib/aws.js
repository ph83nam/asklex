import AWS from 'aws-sdk';
import logger from './log';

let credentials;

/**
 * @return {AWS.Credentials}
 */
function getCredentials() {
  if (!credentials) {
    const provider = new AWS.CredentialProviderChain();
    provider.resolve((error, data) => {
      if (error) {
        logger.error('Failed to resolve credentials', error);
        throw error;
      }
      credentials = data;
    });
  }
  return credentials;
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

export { getCredentials, getDynamoDb };
