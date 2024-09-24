import fs from 'fs';
import { RosenTokens, TokenMap } from '@rosen-bridge/tokens';

class TokensConfig {
  readonly tokens: RosenTokens;
  readonly tokenMap: TokenMap;
  readonly version: string;

  constructor(tokensPath: string) {
    if (!fs.existsSync(tokensPath)) {
      throw new Error(`tokensMap file with path ${tokensPath} doesn't exist`);
    } else {
      const tokensJson: string = fs.readFileSync(tokensPath, 'utf8');
      const tokens = JSON.parse(tokensJson);
      this.tokens = tokens;
      this.version = tokens.version;
      this.tokenMap = new TokenMap(this.tokens);
    }
  }
}

export { TokensConfig };
