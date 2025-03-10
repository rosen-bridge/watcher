import { TokensConfig } from '../src/config/tokensConfig';
import { getConfig } from '../src/config/config';

export const mochaHooks = {
    beforeAll: [
        async function () {
            console.log('Running beforeAll hook...');
            // Initialize tokens configuration before running any tests
            await TokensConfig.init(getConfig().general.rosenTokensPath);
            console.log('TokensConfig initialized successfully');
        }
    ]
}; 