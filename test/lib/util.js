import { expect } from 'chai';
import util from '../../lib/util';

describe('lib/util', () => {
  it('#invoke', () => {
    util.invoke((a1, a2) => {
      expect(a2).to.equal(2);
    }, 1, 2);
  });

  it('#invoke:string', () => {
    util.invoke('string');
  });
});
