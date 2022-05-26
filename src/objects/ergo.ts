import { ErgoBox, ErgoTree } from 'ergo-lib-wasm-nodejs';
import { JsonBI } from "../network/parser";

export interface Info {
    fullHeight: number,
}

abstract class Box {
    protected ergoBox: ErgoBox;

    constructor(boxJson: JSON) {
        this.ergoBox = ErgoBox.from_json(JsonBI.stringify(boxJson));
    }

    getErgoBox = (): ErgoBox => {
        return this.ergoBox
    }

    getErgoTree = (): ErgoTree => {
        return this.ergoBox.ergo_tree()
    }

    getBoxJson = (): string => {
        return this.ergoBox.to_json()
    }

}

export class RSNBox extends Box {
    constructor(boxJson: JSON) {
        super(boxJson);
    }
}

export class RepoBox extends Box {
    constructor(boxJson: JSON) {
        super(boxJson);
    }
}

export class PermitBox extends Box{
    constructor(boxJson: JSON) {
        super(boxJson);
    }
}

export class WIDBox extends Box{
    constructor(boxJson: JSON) {
        super(boxJson);
    }
}

