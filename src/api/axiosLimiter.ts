import axios, { AxiosRequestConfig } from "axios";
import { getConfig } from "../config/config";
import { Rule } from "../../src/types";
import { Semaphore } from 'await-semaphore';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { CallbackLoggerFactory } from '@rosen-bridge/callback-logger';
import WinstonLogger from '@rosen-bridge/winston-logger';


CallbackLoggerFactory.init(new WinstonLogger(getConfig().logger.transports));
const logger = CallbackLoggerFactory.getInstance().getLogger(import.meta.url);

const refreshPeriodInterval = getConfig().general.apiLimitRateRangeAsSeconds;
const semaphorePatternList: {[key: string]: Semaphore} = {};
const rules: Rule[] = getConfig().general.apiLimitRules.map((rule) => ({
  pattern: new RegExp(rule.pattern),
  limiter: new RateLimiterMemory({
    points: rule.rateLimit,
    duration: refreshPeriodInterval
  })
}));


/**
 * return rate limiter and pattern of received url
 * @param url
 * @returns 
 */
const getLimiterAndPatternForUrl = (url: string): [RateLimiterMemory, RegExp] | [null, null] => {
  for (const { pattern, limiter } of rules) {
    if (pattern.test(url)) return [limiter, pattern];
  }
  return [null, null];
}

/**
 * This function is used to manage URLs rate-limit of request based on regex patterns
 * @param config
 * @returns
 */
axios.interceptors.request.use(async (config: AxiosRequestConfig) => {
  const url = config.url ?? "";
  const [limiter, pattern] = getLimiterAndPatternForUrl(url);

  if (!limiter) return config;

  semaphorePatternList[pattern.toString()] = semaphorePatternList[pattern.toString()] ?? new Semaphore(1);

  const release = await semaphorePatternList[pattern.toString()].acquire()
  const consumeData = await limiter.consume(pattern.toString());
  console.log(consumeData, url, semaphorePatternList[pattern.toString()]);

  if (consumeData && consumeData.remainingPoints === 0) {
    logger.info(`Rate limit exceeded for ${pattern} url pattern, waiting for ${consumeData.msBeforeNext}ms`);
    await new Promise(f => setTimeout(f, consumeData.msBeforeNext));
  }
  release();

  return config;
});

export { getLimiterAndPatternForUrl, rules };
