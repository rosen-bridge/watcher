import { ROSEN_TOKEN_TEST_PATH } from "./config";
import fs from "fs";
import { RosenTokens } from "@rosen-bridge/tokens";

class TokensConfig{
    readonly tokens: RosenTokens;

    constructor() {
        const tokensPath = this.getAddress();
        if (!fs.existsSync(tokensPath)) {
            throw new Error(`tokensMap file with path ${tokensPath} doesn't exist`);
        } else {
            const tokensJson: string = fs.readFileSync(tokensPath, 'utf8');
            this.tokens = JSON.parse(tokensJson);
        }
    }

    getAddress = () => {
        if (ROSEN_TOKEN_TEST_PATH === undefined) {
            return `src/config/tokens.json`;
        } else {
            return ROSEN_TOKEN_TEST_PATH;
        }
    }

}

const Tokens = new TokensConfig().tokens;

export { Tokens };
