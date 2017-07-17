import { expect } from 'chai';
import * as gcp from '../../lib/gcp';
import logger from '../../lib/log';

describe('translation', () => {
  it('should be able to translate and detect VN', (done) => {
    const text = 'Tôi muốn ăn pizza';
    gcp.translate(text, {
      to: 'en',
    }).then((result) => {
      // validate structures
      expect(result[0]).not.empty;
      expect(result[1]).not.empty;
      expect(result[1].data.translations).not.empty;

      // validate output
      const data = result[1].data.translations;
      expect(data[0].detectedSourceLanguage).to.equal('vi');
      logger.info(text, '->', data[0].translatedText);
      done();
    }).catch((error) => {
      logger.trace('failed to call Translation API', error);
    });
  });
});
