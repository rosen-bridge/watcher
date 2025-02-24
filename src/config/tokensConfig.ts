import fs from 'fs';
import { RosenTokens, TokenMap } from '@rosen-bridge/tokens';

class TokensConfig {
  private static instance: TokensConfig;
  private tokenMap!: TokenMap;
  private static initialized: boolean = false;

  private constructor() {
    // do nothing
  }

  /**
   * initializes TokensConfig with tokens from the specified path
   * @param tokensPath path to tokens json file
   */
  static async init(tokensPath: string): Promise<void> {
    if (!TokensConfig.initialized) {
      if (!fs.existsSync(tokensPath)) {
        throw new Error(`tokensMap file with path ${tokensPath} doesn't exist`);
      }
      TokensConfig.instance = new TokensConfig();
      const tokensJson: string = fs.readFileSync(tokensPath, 'utf8');
      const tokens = JSON.parse(tokensJson);
      const transformedTokens = TokensConfig.instance.transformTokens(tokens);
      TokensConfig.instance.tokenMap = new TokenMap();
      await TokensConfig.instance.tokenMap.updateConfigByJson(transformedTokens);

      TokensConfig.initialized = true;
    }
  }

  /**
   * Transforms the tokens to a new format
   * @param tokens the tokens to transform
   * @returns the transformed tokens
   */
  private transformTokens(tokens: any): RosenTokens {
    return tokens.tokens.map((token: any) => {
      const transformedToken: any = {};

      // Get all chain keys (ergo, cardano, ethereum, etc.)
      const chains = Object.keys(token);

      // For each chain in the token
      for (const chain of chains) {
        transformedToken[chain] = {
          ...token[chain],
          ...token[chain].metaData
        };
        // Delete the metaData object since it's now flattened
        delete transformedToken[chain].metaData;
      }

      return transformedToken;
    });
  }

  /**
   * returns the TokensConfig instance if initialized
   * @returns TokensConfig instance
   */
  static getInstance(): TokensConfig {
    if (!TokensConfig.initialized) {
      throw new Error('TokensConfig is not initialized');
    }
    return TokensConfig.instance;
  }

  /**
   * @returns whether TokensConfig is initialized
   */
  static isInitialized(): boolean {
    return TokensConfig.initialized;
  }

  /**
   * @returns the token map
   */
  getTokenMap(): TokenMap {
    return this.tokenMap;
  }
}

export { TokensConfig };
