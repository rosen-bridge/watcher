import { RateLimiterMemory } from 'rate-limiter-flexible';


export type Rule = {
  pattern: RegExp;
  limiter: RateLimiterMemory;
};
