import axios from "axios";
import Bottleneck from "bottleneck";
import { getConfig } from "../config/config";
import { Rule } from "../../src/types";
import { CallbackLoggerFactory } from '@rosen-bridge/callback-logger';


export const rules: Rule[] = [
  ...getConfig().general.apiLimitRules.map((rule) => ({
    regex: new RegExp(rule.pattern),
    limiter: new Bottleneck({
      reservoir: rule.rateLimit,
      reservoirRefreshInterval: getConfig().general.apiLimitRateRangeAsSeconds * 1000
    }),
  }))
];

export function getLimiterForUrl(url: string): Bottleneck | null {
  for (const { regex, limiter } of rules) {
    if (regex.test(url)) return limiter;
  }
  return null;
}

axios.interceptors.request.use(async (config) => {
  const logger = CallbackLoggerFactory.getInstance().getLogger(import.meta.url);
  const url = config.url ?? "";
  const limiter = getLimiterForUrl(url);

  if (!limiter) return config;

  const hasCapacity = await limiter.currentReservoir();
  if (hasCapacity && hasCapacity <= 0) {
    logger.debug(`Rate limit exceeded for ${url}`);
  }

  // wait for release of capacity before proceeding
  await limiter.schedule(() => Promise.resolve());
  return config;
});
