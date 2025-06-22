import { TokensConfig } from '../src/config/tokensConfig';
import { getConfig } from '../src/config/config';

export const mochaHooks = {
  beforeAll: [
    async function () {
      // Initialize tokens configuration before running any tests
      await TokensConfig.init(getConfig().general.rosenTokensPath);
    },
  ],
};
