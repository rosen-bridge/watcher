import { Config } from './config';
import fs from 'fs';
import { RosenTokens } from '@rosen-bridge/tokens';

const config = Config.getConfig();

class TokensConfig {
  readonly tokens: RosenTokens;

  constructor() {
    const tokensPath = config.rosenTokensPath;
    if (!fs.existsSync(tokensPath)) {
      throw new Error(`tokensMap file with path ${tokensPath} doesn't exist`);
    } else {
      const tokensJson: string = fs.readFileSync(tokensPath, 'utf8');
      this.tokens = JSON.parse(tokensJson);
    }
  }
}

const Tokens = new TokensConfig().tokens;

export { Tokens };
