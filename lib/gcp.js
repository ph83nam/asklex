import createTranslate from '@google-cloud/translate';

const PROJECT_ID = process.env.GCP_PROJECT_ID;
const API_KEY = process.env.GCP_API_KEY;

/**
 * {Translate}
 */
let translateClient;

/**
 * @return {Translate}
 */
function getTranslateClient() {
  if (!translateClient) {
    translateClient = createTranslate({
      projectId: PROJECT_ID,
      key: API_KEY,
    });
  }
  return translateClient;
}

/**
 * translate a text
 * @param {string} text
 * @param {object} options
 * @return {Promise}
 */
function translate(text, options) {
  return getTranslateClient().translate(text, options);
}

/**
 * detect language
 * @param {string|string[]} input
 */
function detectLanguage(input) {
  return getTranslateClient().detect(input);
}

export { translate, detectLanguage };
