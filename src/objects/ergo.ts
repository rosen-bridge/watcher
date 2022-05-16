import { ErgoBox, ErgoTree } from 'ergo-lib-wasm-nodejs';

export interface Info {
    fullHeight: number,
}

abstract class Box {
    protected ergoBox: ErgoBox;

    constructor(boxJson: JSON) {
        this.ergoBox = ErgoBox.from_json(JSON.stringify(boxJson));
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
