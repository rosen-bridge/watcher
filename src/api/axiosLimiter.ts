import axios from "axios";
import Bottleneck from "bottleneck";
import { getConfig } from "../config/config";
import { Rule } from "../../src/types";

export const rules: Rule[] = [
  ...getConfig().general.apiLimitRules.map((rule) => ({
    regex: new RegExp(rule.pattern),
    limiter: new Bottleneck({
      reservoir: rule.rateLimit
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
  const url = config.url ?? "";
  const limiter = getLimiterForUrl(url);

  if (!limiter) return config;

  const hasCapacity = await limiter.currentReservoir();
  if (hasCapacity && hasCapacity > 0) {
    await limiter.schedule(() => Promise.resolve());
    return config;
  }

  // drop request
  return Promise.reject(new Error(`Rate limit exceeded for ${url}`));
});