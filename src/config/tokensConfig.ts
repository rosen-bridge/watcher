import fs from 'fs';
import { RosenTokens, TokenMap } from '@rosen-bridge/tokens';

class TokensConfig {
  readonly tokens: RosenTokens;
  readonly tokenMap: TokenMap;
  readonly version: string;
  private static initialized: boolean = false;

  constructor(tokensPath: string) {
    if (!fs.existsSync(tokensPath)) {
      throw new Error(`tokensMap file with path ${tokensPath} doesn't exist`);
    }
    const tokensJson: string = fs.readFileSync(tokensPath, 'utf8');
    const tokens = JSON.parse(tokensJson);
    this.tokens = tokens;
    this.version = tokens.version;
    this.tokenMap = new TokenMap();
  }

  async initialize(): Promise<void> {
    if (!TokensConfig.initialized) {
      await this.tokenMap.updateConfigByJson(this.tokens);
      TokensConfig.initialized = true;
    }
  }

  static isInitialized(): boolean {
    return TokensConfig.initialized;
  }
}

export { TokensConfig };
