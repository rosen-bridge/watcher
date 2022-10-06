import { WatcherDataBase } from '../../../src/database/models/watcherModel';
import { loadDataBase } from '../../database/watcherDatabase';
import Statistics from '../../../src/statistics/statistics';
import { expect } from 'chai';

let statistics: Statistics;

describe('Statistics', () => {
  let DB: WatcherDataBase;

  /**
   * setting up pretest database and Statistic Object
   */
  before('inserting into database', async () => {
    DB = await loadDataBase('Statistics');
    statistics = Statistics.getInstance(DB, 'WIDStatistics');
  });

  describe('getErgsAndFee', () => {
    /**
     * Target: testing getErgsAndFee for the watcher
     * Expected Output:
     *    The function should return watcher total received fee and Ergs amount
     */
    it('should return watcher received ergs and fees', async () => {
      const ergsAndTokens = await statistics.getErgsAndFee();
      expect(ergsAndTokens.ergs).to.equal(98900000n);
      expect(ergsAndTokens.tokens).to.eql({
        '3c6cb596273a737c3e111c31d3ec868b84676b7bad82f9888ad574b44edef267': 11n,
        '0034c44f0c7a38f833190d44125ff9b3a0dd9dbb89138160182a930bc521db95': 10n,
      });
    });
  });

  describe('getCommitmentsCount', () => {
    /**
     * Target: testing getCommitmentsCount
     * Expected Output:
     *    The function should return watcher total commitments with his WID (3)
     */
    it('should return 3 [Commitments]', async () => {
      expect(await statistics.getCommitmentsCount()).to.equal(3);
    });
  });

  describe('getEventTriggersCount', () => {
    /**
     * Target: testing getEventTriggersCount
     * Expected Output:
     *    The function should return watcher total eventTriggers with his WID (3)
     */
    it('should return 3 [EventTriggers]', async () => {
      expect(await statistics.getEventTriggersCount()).to.equal(3);
    });
  });

  describe('getCommitments', () => {
    /**
     * Target: testing getCommitments
     * Expected Output:
     *    The function should return first watcher commitment
     */
    it('should return watcher first commitment', async () => {
      expect(await statistics.getCommitments(0, 1)).to.eql([
        {
          eventId: 'eventId1',
          boxId: 'boxIdStatistics1',
          block: 'block',
          height: 1005,
          spendBlock: null,
          spendHeight: null,
        },
      ]);
    });

    /**
     * Target: testing getCommitments
     * Expected Output:
     *    The function should return second and third watcher commitment
     */
    it('should return watcher second and third commitment', async () => {
      expect(await statistics.getCommitments(1, 2)).to.eql([
        {
          eventId: 'eventId2',
          boxId: 'boxIdStatistics2',
          block: 'block',
          height: 1005,
          spendBlock: null,
          spendHeight: null,
        },
        {
          eventId: 'eventId3',
          boxId: 'boxIdStatistics3',
          block: 'block',
          height: 1005,
          spendBlock: null,
          spendHeight: null,
        },
      ]);
    });
  });

  describe('getEventTriggers', () => {
    /**
     * Target: testing getEventTriggers
     * Expected Output:
     *    The function should return first watcher eventTrigger
     */
    it('should return watcher first watcher eventTrigger', async () => {
      expect(await statistics.getEventTriggers(0, 1)).to.eql([
        {
          boxId: 'boxIdStatistics',
          block: 'blockID',
          height: 100,
          fromChain: 'fromChain',
          toChain: 'toChain',
          fromAddress: 'fromAddress',
          toAddress: 'toAddress',
          amount: '100',
          bridgeFee: '200',
          networkFee: '1000',
          sourceChainTokenId: 'tokenId',
          targetChainTokenId: 'targetTokenId',
          sourceTxId: 'txId',
          sourceBlockId: 'block',
          spendBlock: null,
          spendHeight: null,
        },
      ]);
    });

    /**
     * Target: testing getEventTriggers
     * Expected Output:
     *    The function should return second and third watcher eventTrigger
     */
    it('should return second and third watcher eventTrigger', async () => {
      expect(await statistics.getEventTriggers(1, 2)).to.eql([
        {
          boxId: 'boxIdStatistics2',
          block: 'blockID',
          height: 100,
          fromChain: 'fromChain',
          toChain: 'toChain',
          fromAddress: 'fromAddress',
          toAddress: 'toAddress',
          amount: '100',
          bridgeFee: '200',
          networkFee: '1000',
          sourceChainTokenId: 'tokenId',
          targetChainTokenId: 'targetTokenId',
          sourceTxId: 'txId',
          sourceBlockId: 'block',
          spendBlock: null,
          spendHeight: null,
        },
        {
          boxId: 'boxIdStatistics3',
          block: 'blockID',
          height: 100,
          fromChain: 'fromChain',
          toChain: 'toChain',
          fromAddress: 'fromAddress',
          toAddress: 'toAddress',
          amount: '100',
          bridgeFee: '200',
          networkFee: '1000',
          sourceChainTokenId: 'tokenId',
          targetChainTokenId: 'targetTokenId',
          sourceTxId: 'txId',
          sourceBlockId: 'block',
          spendBlock: null,
          spendHeight: null,
        },
      ]);
    });
  });
});
