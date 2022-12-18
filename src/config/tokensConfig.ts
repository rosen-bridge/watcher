import fs from 'fs';
import { RosenTokens } from '@rosen-bridge/tokens';

class TokensConfig {
  readonly tokens: RosenTokens;

  constructor(tokensPath: string) {
    if (!fs.existsSync(tokensPath)) {
      throw new Error(`tokensMap file with path ${tokensPath} doesn't exist`);
    } else {
      const tokensJson: string = fs.readFileSync(tokensPath, 'utf8');
      this.tokens = JSON.parse(tokensJson);
    }
  }
}

export { TokensConfig };
