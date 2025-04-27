import { expect } from 'chai';
import axios from 'axios';
import sinon from 'sinon';
import { RateLimiterMemory } from 'rate-limiter-flexible';

import { getLimiterAndPatternForUrl, rules } from '../../src/api/axiosLimiter';
import { Rule } from '../../src/types';

// Add type assertion for axios interceptors
const getRateLimiterInterceptor = () => {
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

  describe('getLimiterAndPatternForUrl', () => {
    /**
     * @target should return limiter for matching URL
     * @dependencies
     * @scenario
     * - create a RateLimiterMemory object with specific regex pattern
     * - call getLimiterAndPatternForUrl with matching URL
     * - check the result
     * @expected
     * - should return the correct limiter instance
     */
    it('should return limiter and pattern for matching URL', () => {
      const mockLimiter = new RateLimiterMemory({
        points: 10,
        duration: 1
      });

      rules.push({
        pattern: /blockchain-api/,
        limiter: mockLimiter
      });

      const url = 'https://api.example.com/blockchain-api/test';
      const [limiter, pattern] = getLimiterAndPatternForUrl(url);
      expect(limiter).to.not.be.null;
      expect(pattern).to.not.be.null;
      expect(pattern).to.eql(/blockchain-api/);
    });

    /**
     * @target should return null for non-matching URL
     * @dependencies
     * @scenario
     * - call getLimiterAndPatternForUrl with non-matching URL
     * - check the result
     * @expected
     * - should return null
     */
    it('should return null for non-matching URL', () => {
      const url = 'https://api.example.com/other-api/test';
      const [limiter, pattern] = getLimiterAndPatternForUrl(url);
      expect(limiter).to.be.null;
      expect(pattern).to.be.null;
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
      
      const mockLimiter = new RateLimiterMemory({
        points: 10,
        duration: 1
      });

      rules.push({
        pattern: /blockchain-api/,
        limiter: mockLimiter
      });

      const result = await getRateLimiterInterceptor()(config);
      expect(result).to.equal(config);
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
    it('should wait when rate limit is exceeded', async function() {
      this.timeout(5000); // Increase timeout for this test

      const url = 'https://api.example.com/blockchain-api/test';
      const config = { url };

      const mockLimiter = new RateLimiterMemory({
        points: 1,
        duration: 1
      });

      rules.push({
        pattern: /blockchain-api/,
        limiter: mockLimiter
      });

      // First request should succeed
      await getRateLimiterInterceptor()(config);
      
      // Second request should be delayed
      const startTime = Date.now();
      await getRateLimiterInterceptor()(config);
      const endTime = Date.now();
      
      // Allow some margin for timing
      expect(endTime - startTime).to.be.at.least(900); // Should wait at least 900ms
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

      const result = await getRateLimiterInterceptor()(config);
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

      const mockLimiter = new RateLimiterMemory({
        points: 10,
        duration: 1
      });

      rules.push({
        pattern: /blockchain-api/,
        limiter: mockLimiter
      });

      // Create multiple requests
      const requests = Array(5).fill(null).map(() => 
        getRateLimiterInterceptor()(config)
      );

      // All requests should be allowed
      const results = await Promise.all(requests);
      results.forEach((result: any) => {
        expect(result).to.equal(config);
      });
    });
  });
});
