import chai, { expect } from 'chai';
import spies from 'chai-spies';
import { fillORM, loadDataBase } from '../database/watcherDatabase';
import { initWatcherDB } from '../../src/init';
import { tokenNameJobFunction } from '../../src/jobs/tokenName';
import { WatcherDataBase } from '../../src/database/models/watcherModel';
import { validToken1Record, validToken2Record } from '../database/mockedData';

chai.use(spies);

describe('tokenName', () => {
  let DB: WatcherDataBase;
  before(async () => {
    const ORM = await loadDataBase();
    await fillORM(ORM, true, false);
    initWatcherDB(ORM.DB);
    DB = ORM.DB;
  });

  describe('tokenNameJobFunction', () => {
    /**
     * @target tokenNameJobFunction should store all names
     * of UTXO tokens in DB
     * @dependencies
     * @scenario
     * - run the job
     * - check the tokens stored in DB
     * @expected
     * - tokens stored in DB should be correct
     */
    it('should store all names of UTXO tokens in DB', async () => {
      // run the job
      await tokenNameJobFunction(['boxId2']);

      // check the tokens stored in DB
      const tokens = await DB.getTokenEntity([
        validToken1Record.tokenId,
        validToken2Record.tokenId,
      ]);
      expect(tokens).to.eql([validToken2Record, validToken1Record]);
    });
  });
});
