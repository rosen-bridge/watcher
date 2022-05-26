export interface Asset {
    policy_id: string,
    asset_name: string,
    quantity: string
}

export interface Utxo {
    payment_addr: {
        bech32: string
    },
    tx_hash: string,
    value: string,
    asset_list: Array<Asset>
}

export interface Tx {
    utxos: Array<Utxo>
}

export interface MetaData {
    0: RosenData,
}

export interface RosenData {
    to: string,
    from: string,
    fee: string,
    targetChainTokenId: string,
    toAddress: string,
    fromAddress: string,
}

export interface TxMetaData {
    tx_hash: string,
    metadata: object,
}
