import chai, { expect } from 'chai';
import spies from 'chai-spies';
import { WatcherDataBase } from '../../src/database/models/watcherModel';
import { fillORM, loadDataBase } from '../database/watcherDatabase';
import { initWatcherDB } from '../../src/init';
import { revenueJobFunction } from '../../src/jobs/revenue';

chai.use(spies);

describe('revenue Job', () => {
  let DB: WatcherDataBase;
  before(async () => {
    const ORM = await loadDataBase();
    await fillORM(ORM, false, true, false, false);
    initWatcherDB(ORM.DB);
    DB = ORM.DB;
  });

  describe('revenueJobFunction', () => {
    /**
     * @target revenueJobFunction should store all revenues
     * up to permit id 4
     * @dependencies
     * @scenario
     * - run the job
     * - check the result
     * @expected
     * - there must be no unsaved permits
     */
    it('should store all revenues up to permit id 4', async () => {
      // run the job
      await revenueJobFunction();

      // check the result
      const unsavedPermits = await DB.getUnsavedRevenueIds();
      expect(unsavedPermits.length).to.eql(0);
    });
  });
});
