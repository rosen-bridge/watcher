import { ErgoBox, ErgoTree } from 'ergo-lib-wasm-nodejs';

abstract class Box {
    protected ergoBox: ErgoBox;

    constructor(boxJson: JSON) {
        this.ergoBox = ErgoBox.from_json(JSON.stringify(boxJson))
    }

    getErgoBox = (): ErgoBox => {
        return this.ergoBox
    }

    getErgoTree = (): ErgoTree => {
        return this.ergoBox.ergo_tree()
    }

}

export class RSNBox extends Box{
    constructor(boxJson: JSON) {
        super(boxJson)
    }
}
