import { expect } from 'chai';
import axios from 'axios';
import sinon from 'sinon';

import { getLimiterForUrl, rules } from '../../src/api/axiosLimiter';
import { Rule } from '../../src/types';

// Add type assertion for axios interceptors
const getInterceptor = () => {
  const interceptor = axios.interceptors.request as any;
  return interceptor.handlers[0].fulfilled;
};

describe('axiosLimiter', () => {
  let originalRules: Rule[];

  beforeEach(() => {
    // Save original rules
    originalRules = [...rules];
    // Clear rules array
    rules.length = 0;
  });

  afterEach(() => {
    // Restore original rules
    rules.length = 0;
    rules.push(...originalRules);
  });

  describe('getLimiterForUrl', () => {
    /**
     * @target should return limiter for matching URL
     * @dependencies
     * @scenario
     * - add a mock limiter with specific regex pattern
     * - call getLimiterForUrl with matching URL
     * - check the result
     * @expected
     * - should return the correct limiter instance
     */
    it('should return limiter for matching URL', () => {
      // Mock the limiter to simulate available capacity
      const mockLimiter = {
        currentReservoir: sinon.stub().resolves(10),
        schedule: sinon.stub().resolves()
      };
      
      // Add mock limiter to rules
      rules.push({
        regex: /blockchain-api/,
        limiter: mockLimiter as any
      });

      const url = 'https://api.example.com/blockchain-api/test';
      const limiter = getLimiterForUrl(url);
      expect(limiter).to.not.be.null;
      expect(limiter).to.equal(rules[0].limiter);
    });

    /**
     * @target should return null for non-matching URL
     * @dependencies
     * @scenario
     * - call getLimiterForUrl with non-matching URL
     * - check the result
     * @expected
     * - should return null
     */
    it('should return null for non-matching URL', () => {
      const url = 'https://api.example.com/other-api/test';
      const limiter = getLimiterForUrl(url);
      expect(limiter).to.be.null;
    });
  });

  describe('rate limiting', () => {
    /**
     * @target should allow requests within rate limit
     * @dependencies
     * @scenario
     * - configure mock limiter with available capacity
     * - send a request to a rate-limited endpoint
     * - check the result
     * @expected
     * - request should be allowed to proceed
     * - limiter methods should be called correctly
     */
    it('should allow requests within rate limit', async () => {
      const url = 'https://api.example.com/blockchain-api/test';
      const config = { url };
      
      // Mock the limiter to simulate available capacity
      const mockLimiter = {
        currentReservoir: sinon.stub().resolves(10),
        schedule: sinon.stub().resolves()
      };
      
      // Add mock limiter to rules
      rules.push({
        regex: /blockchain-api/,
        limiter: mockLimiter as any
      });

      // Request should be allowed
      const result = await getInterceptor()(config);
      expect(result).to.equal(config);
      expect(mockLimiter.currentReservoir.calledOnce).to.be.true;
      expect(mockLimiter.schedule.calledOnce).to.be.true;
    });

    /**
     * @target should wait for release of capacity before proceeding when rate limit is exceeded
     * @dependencies
     * @scenario
     * - configure mock limiter with no available capacity
     * - send a request to a rate-limited endpoint
     * - check the result
     * @expected
     * - request should be allowed to proceed
     */
    it('should wait for release of capacity before proceeding when rate limit is exceeded', async () => {
      const url = 'https://api.example.com/blockchain-api/test';
      const config = { url };
      
      // Mock the limiter to simulate rate limit exceeded
      const mockLimiter = {
        currentReservoir: sinon.stub().resolves(0),
        schedule: sinon.stub()
      };

      // Add mock limiter to rules
      rules.push({
        regex: /blockchain-api/,
        limiter: mockLimiter as any
      });

      // Request should be allowed
      const result = await getInterceptor()(config);
      expect(result).to.equal(config);
      expect(mockLimiter.currentReservoir.calledOnce).to.be.true;
      expect(mockLimiter.schedule.calledOnce).to.be.true;
    });

    /**
     * @target should allow requests for URLs without rate limit
     * @dependencies
     * @scenario
     * - send a request to a non-rate-limited endpoint
     * - check the result
     * @expected
     * - request should be allowed to proceed
     */
    it('should allow requests for URLs without rate limit', async () => {
      const url = 'https://api.example.com/other-api/test';
      const config = { url };
      
      const result = await getInterceptor()(config);
      expect(result).to.equal(config);
    });
  });

  describe('concurrent requests', () => {
    /**
     * @target should handle concurrent requests within limit
     * @dependencies
     * @scenario
     * - configure mock limiter with sufficient capacity
     * - send multiple concurrent requests
     * - check the results
     * @expected
     * - all requests should be processed successfully
     * - limiter methods should be called correct number of times
     */
    it('should handle concurrent requests within limit', async () => {
      const url = 'https://api.example.com/blockchain-api/test';
      const config = { url };
      
      // Mock the limiter to simulate available capacity
      const mockLimiter = {
        currentReservoir: sinon.stub().resolves(10),
        schedule: sinon.stub().resolves()
      };
      
      // Add mock limiter to rules
      rules.push({
        regex: /blockchain-api/,
        limiter: mockLimiter as any
      });

      // Create multiple requests
      const requests = Array(5).fill(null).map(() => 
        getInterceptor()(config)
      );
      
      // All requests should be allowed
      const results = await Promise.all(requests);
      results.forEach((result: any) => {
        expect(result).to.equal(config);
      });
      
      expect(mockLimiter.currentReservoir.callCount).to.equal(5);
      expect(mockLimiter.schedule.callCount).to.equal(5);
    });
  });
}); 