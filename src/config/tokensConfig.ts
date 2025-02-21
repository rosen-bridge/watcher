import fs from 'fs';
import { RosenTokens, TokenMap } from '@rosen-bridge/tokens';

class TokensConfig {
  private static instance: TokensConfig;
  private tokens!: RosenTokens;
  private tokenMap!: TokenMap;
  private version!: string;
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

      TokensConfig.instance.tokens = tokens;
      TokensConfig.instance.version = tokens.version;
      TokensConfig.instance.tokenMap = new TokenMap();
      await TokensConfig.instance.tokenMap.updateConfigByJson(tokens);

      TokensConfig.initialized = true;
    }
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
   * @returns the tokens configuration
   */
  getTokens(): RosenTokens {
    if (!TokensConfig.initialized) {
      throw new Error('TokensConfig is not initialized');
    }
    return this.tokens;
  }

  /**
   * @returns the token map
   */
  getTokenMap(): TokenMap {
    if (!TokensConfig.initialized) {
      throw new Error('TokensConfig is not initialized');
    }
    return this.tokenMap;
  }

  /**
   * @returns the version
   */
  getVersion(): string {
    if (!TokensConfig.initialized) {
      throw new Error('TokensConfig is not initialized');
    }
    return this.version;
  }
}

export { TokensConfig };
