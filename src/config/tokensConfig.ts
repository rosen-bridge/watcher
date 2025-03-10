import fs from 'fs';
import { RosenTokens, TokenMap } from '@rosen-bridge/tokens';

class TokensConfig {
  private static instance: TokensConfig;
  protected tokenMap: TokenMap;

  private constructor() {
    // do nothing
  }

  /**
   * initializes TokensConfig with tokens from the specified path
   * @param tokensPath path to tokens json file
   */
  static async init(tokensPath: string): Promise<void> {
    if (!TokensConfig.instance) {
      if (!fs.existsSync(tokensPath)) {
        throw new Error(`tokensMap file with path ${tokensPath} doesn't exist`);
      }
      TokensConfig.instance = new TokensConfig();
      const tokensJson: string = fs.readFileSync(tokensPath, 'utf8');
      const tokens = JSON.parse(tokensJson);
      TokensConfig.instance.tokenMap = new TokenMap();
      await TokensConfig.instance.tokenMap.updateConfigByJson(tokens.tokens);
    }
  }

  /**
   * returns the TokensConfig instance if initialized
   * @returns TokensConfig instance
   */
  static getInstance(): TokensConfig {
    if (!TokensConfig.instance) {
      throw new Error('TokensConfig is not initialized');
    }
    return TokensConfig.instance;
  }

  /**
   * @returns the token map
   */
  getTokenMap(): TokenMap {
    return this.tokenMap;
  }
}

export { TokensConfig };
