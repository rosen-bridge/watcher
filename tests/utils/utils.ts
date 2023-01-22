import { expect } from 'chai';

import { parseJson } from '../../src/utils/utils';

describe('utils', () => {
  describe('parseJson', () => {
    /**
     * Target:
     * It should return correct parsed json.
     *
     * Dependencies:
     * N/A
     *
     * Scenario:
     * N/A
     *
     * Expected output:
     * The parsed json should contain expected bigints
     */
    it('should return correct parsed json', async () => {
      const json =
        '{"smallNumber":1,"smallBigInt":1,"largeNumber":1111111111111111,"largeBigInt":1111111111111111}';

      const expected = {
        smallNumber: 1,
        smallBigInt: 1n,
        largeNumber: 1111111111111111,
        largeBigInt: 1111111111111111n,
      };

      const actual: typeof expected = parseJson(json, [
        'smallBigInt',
        'largeBigInt',
      ]);

      expect(actual.smallNumber).to.equal(expected.smallNumber);
      expect(actual.smallBigInt).to.equal(expected.smallBigInt);
      expect(actual.largeNumber).to.be.a('number');
      expect(actual.largeBigInt).to.equal(expected.largeBigInt);
    });

    /**
     * Target:
     * It should return correct parsed json for jsons with array values
     *
     * Dependencies:
     * N/A
     *
     * Scenario:
     * N/A
     *
     * Expected output:
     * The parsed json should contain expected bigint array
     */
    it('should return correct parsed json for jsons with array values', async () => {
      const json = '{"number":1,"bigintArray":[1,2,333333333333333333333]}';
      const expected = {
        number: 1,
        bigintArray: [1n, 2n, 333333333333333333333n],
      };

      const actual = parseJson(json, ['bigintArray']);

      expect(actual).to.deep.equal(expected);
    });

    /**
     * Target:
     * It should leave non-bigint values as-is
     *
     * Dependencies:
     * N/A
     *
     * Scenario:
     * N/A
     *
     * Expected output:
     * The parsed json should not contain any failed converted bigint values
     */
    it('should leave non-bigint values as-is', async () => {
      const json = '{"someString":"hello world"}';
      const expected = {
        someString: 'hello world',
      };

      const actual = parseJson(json, ['someString']);

      expect(actual).to.deep.equal(expected);
    });
  });
});
