import Bottleneck from 'bottleneck';


export type Rule = {
  regex: RegExp;
  limiter: Bottleneck;
};
