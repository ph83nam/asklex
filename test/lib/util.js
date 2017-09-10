/* eslint-env mocha */
/* eslint-disable func-names, prefer-arrow-callback */

import { expect } from 'chai';
import util from '../../lib/util';

describe('lib/util', function () {
  it('#invoke', () => {
    util.invoke((a1, a2) => {
      expect(a2).to.equal(2);
    }, 1, 2);
  });

  it('#invoke:string', function () {
    util.invoke('string');
  });
});
