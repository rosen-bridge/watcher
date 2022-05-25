type TxInput = {
    boxId: string,
    address: string
}

type TxOutput = {
    address: string,
}

type ErgoTx = {
    inputs: Array<TxInput>,
    outputs: Array<TxOutput>
}

export default ErgoTx
