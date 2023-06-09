import chai, { expect } from 'chai';
import spies from 'chai-spies';
import express, { Router } from 'express';
import eventsRouter from '../../src/api/events';
import { initWatcherDB } from '../../src/init';
import { fillORM, loadDataBase } from '../database/watcherDatabase';
import request from 'supertest';
import {
  eventTriggerEntity,
  newEventTriggerEntity,
} from '../database/mockedData';
import {
  firstStatisticsEventTrigger,
  secondStatisticsEventTrigger,
  spentEventTrigger,
  thirdStatisticsEventTrigger,
} from '../ergo/statistics/mockUtils';

chai.use(spies);

const app = express();
app.use(express.json());

const router = Router();
router.use('/events', eventsRouter);
app.use(router);

describe('eventsRouter', () => {
  describe('GET /events', () => {
    before(async () => {
      const ORM = await loadDataBase();
      await fillORM(ORM);
      initWatcherDB(ORM.DB);
    });

    /**
     * @target Events endpoint should return
     * all events
     * @dependencies
     * @scenario
     * - send a request to the endpoint
     * - check the result
     * @expected
     * - request status should be 200
     * - request body should be valid array of events
     */
    it('Events endpoint should return all events', async () => {
      // send a request to the endpoint
      const res = await request(app).get('/events');

      // check the result
      expect(res.status).to.eql(200);
      const resultParsed = JSON.parse(res.text);
      expect(resultParsed).to.eql([
        thirdStatisticsEventTrigger,
        secondStatisticsEventTrigger,
        firstStatisticsEventTrigger,
        newEventTriggerEntity,
        eventTriggerEntity,
      ]);
    });

    /**
     * @target Events endpoint should return correct
     * events with fromAddress filter
     * @dependencies
     * @scenario
     * - send a request to the endpoint
     * - check the result
     * @expected
     * - request status should be 200
     * - request body should be valid array of events
     */
    it('Events endpoint should return correct events with fromAddress filter', async () => {
      // send a request to the endpoint
      const res = await request(app).get(
        `/events?fromAddress=${eventTriggerEntity.fromAddress}`
      );

      // check the result
      expect(res.status).to.eql(200);
      const resultParsed = JSON.parse(res.text);
      expect(resultParsed).to.eql([eventTriggerEntity]);
    });

    /**
     * @target Events endpoint should return correct
     * events with toAddress filter
     * @dependencies
     * @scenario
     * - send a request to the endpoint
     * - check the result
     * @expected
     * - request status should be 200
     * - request body should be valid array of events
     */
    it('Events endpoint should return correct events with toAddress filter', async () => {
      // send a request to the endpoint
      const res = await request(app).get(
        `/events?toAddress=${newEventTriggerEntity.toAddress}`
      );

      // check the result
      expect(res.status).to.eql(200);
      const resultParsed = JSON.parse(res.text);
      expect(resultParsed).to.eql([newEventTriggerEntity]);
    });

    /**
     * @target Events endpoint should return correct
     * events with sourceTokenId filter
     * @dependencies
     * @scenario
     * - send a request to the endpoint
     * - check the result
     * @expected
     * - request status should be 200
     * - request body should be valid array of events
     */
    it('Events endpoint should return correct events with sourceTokenId filter', async () => {
      // send a request to the endpoint
      const res = await request(app).get(
        `/events?sourceTokenId=${eventTriggerEntity.sourceChainTokenId}`
      );

      // check the result
      expect(res.status).to.eql(200);
      const resultParsed = JSON.parse(res.text);
      expect(resultParsed).to.eql([eventTriggerEntity]);
    });

    /**
     * @target Events endpoint should return correct
     * events with sourceTxId filter
     * @dependencies
     * @scenario
     * - send a request to the endpoint
     * - check the result
     * @expected
     * - request status should be 200
     * - request body should be valid array of events
     */
    it('Events endpoint should return correct events with sourceTxId filter', async () => {
      // send a request to the endpoint
      const res = await request(app).get(
        `/events?sourceTxId=${newEventTriggerEntity.sourceTxId}`
      );

      // check the result
      expect(res.status).to.eql(200);
      const resultParsed = JSON.parse(res.text);
      expect(resultParsed).to.eql([newEventTriggerEntity]);
    });

    /**
     * @target Events endpoint should return no event
     * with eventStatus filter is set to done
     * @dependencies
     * @scenario
     * - send a request to the endpoint
     * - check the result
     * @expected
     * - request status should be 200
     * - request body should be an empty array
     */
    it('Events endpoint should return no event with eventStatus filter is set to done', async () => {
      // send a request to the endpoint
      const res = await request(app).get('/events?eventStatus=done');

      // check the result
      expect(res.status).to.eql(200);
      const resultParsed = JSON.parse(res.text);
      expect(resultParsed).to.eql([]);
    });

    /**
     * @target Events endpoint should return
     * all events in ASC sorting
     * @dependencies
     * @scenario
     * - send a request to the endpoint
     * - check the result
     * @expected
     * - request status should be 200
     * - request body should be valid array of events
     */
    it('Events endpoint should return all events in ASC sorting', async () => {
      // send a request to the endpoint
      const res = await request(app).get('/events?sorting=ASC');

      // check the result
      expect(res.status).to.eql(200);
      const resultParsed = JSON.parse(res.text);
      expect(resultParsed).to.eql([
        eventTriggerEntity,
        newEventTriggerEntity,
        firstStatisticsEventTrigger,
        secondStatisticsEventTrigger,
        thirdStatisticsEventTrigger,
      ]);
    });

    /**
     * @target Events endpoint should return correct
     * events when setting offset and limit
     * @dependencies
     * @scenario
     * - send a request to the endpoint
     * - check the result
     * @expected
     * - request status should be 200
     * - request body should be valid array of events
     */
    it('Events endpoint should return correct events when setting offset and limit', async () => {
      // send a request to the endpoint
      const res = await request(app).get('/events?offset=1&limit=2');

      // check the result
      expect(res.status).to.eql(200);
      const resultParsed = JSON.parse(res.text);
      expect(resultParsed).to.eql([
        secondStatisticsEventTrigger,
        firstStatisticsEventTrigger,
      ]);
    });
  });

  describe('POST /events/status', () => {
    before(async () => {
      const ORM = await loadDataBase();
      await fillORM(ORM);
      await ORM.eventTriggerRepo.save(spentEventTrigger);
      initWatcherDB(ORM.DB);
    });

    /**
     * @target EventsStatus endpoint should return correct
     * status for each event
     * @dependencies
     * @scenario
     * - send a request to the endpoint
     * - check the result
     * @expected
     * - request status should be 200
     * - resonse should indicate correct status for each event
     */
    it('EventsStatus endpoint should return correct status for each event', async () => {
      // send a request to the endpoint
      const res = await request(app).post('/events/status').send([1, 6]);

      // check the result
      expect(res.status).to.eql(200);
      const resultParsed = JSON.parse(res.text);
      expect(resultParsed).to.eql({
        1: 'Doing',
        6: 'Done',
      });
    });
  });
});
