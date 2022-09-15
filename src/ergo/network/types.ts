type TxInput = {
    boxId: string,
    address: string
}

type TxOutput = {
    address: string,
}

type ErgoTx = {
    inputs: Array<TxInput>,
    outputs: Array<TxOutput>,
}

type Asset = {
    tokenId: string,
    index: number,
    amount: bigint,
    name: string,
}

interface ErgoBoxJson{
    boxId: string,
    address: string,
    value: bigint,
    assets?: Array<Asset>,
}

interface AddressBoxes{
    items: Array<ErgoBoxJson>,
    total: number,
}

interface ExplorerTransaction{
    id: string,
    creationTimestamp: number,
    numConfirmations: number,
}

interface Balance{
    nanoErgs: bigint,
    tokens: Array<Asset>,
}

export {
    ErgoTx,
    ErgoBoxJson,
    AddressBoxes,
    ExplorerTransaction,
    Balance
}
