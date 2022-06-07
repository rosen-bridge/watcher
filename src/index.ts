import "reflect-metadata";
import express from "express";
import generateAddress from "./api/generateAddress";
import lockRSN from "./api/permit";
import { Transaction } from "./api/Transaction";
import { ErgoConfig } from "./config/config";
import * as wasm from "ergo-lib-wasm-nodejs";
import { strToUint8Array } from "./utils/utils";
import { rosenConfig } from "./api/rosenConfig";
import { ErgoNetwork } from "./ergo/network/ergoNetwork";

export let watcherTransaction: Transaction;

const init = async () => {
    const generateTransactionObject = async (): Promise<Transaction> => {
        const ergoConfig = ErgoConfig.getConfig();
        const watcherAddress = wasm.SecretKey.dlog_from_bytes(
            strToUint8Array(ergoConfig.secretKey)
        ).get_address().to_base58(ergoConfig.networkType);

        return await Transaction.init(
            rosenConfig,
            watcherAddress,
            ergoConfig.secretKey
        );
    }

    const initExpress = () => {
        const app = express();
        app.use('/address', generateAddress);
        app.use('/permit', lockRSN);

        const port = process.env.PORT || 3000;

        app.listen(port, () => console.log(`app listening on port ${port}`));
    }

    try {
        generateTransactionObject().then(
            res => {
                watcherTransaction = res;
                initExpress();
            }
        );
    } catch (e) {
        throw new Error("Watcher initiate Error with Error: " + e);
    }

}

// init();

// const test = new ErgoNetwork();
// test.getBoxWithToken(wasm.Address.from_mainnet_str("N9nHZxAm7Z476Nbw6yF2X6BQEct7nNCm4SJeCK8DJEkERj6LXMJvKqG49WWSfNDufuuFEtN8msfWDd8UR4QUCmLEwFRWXC5hxEdk1XhdRSgiwuqyiPqpSTXtqUgGf67uCzEtHtN5nQKKuRYyr6xfFfV8YXKhms5JVqhmCM9869Nr4KzmLAdSLqwG6LswnFwRWwZZfC6Jf65RKV4xV5GTDqL5Ppc2QwnGDYFEUPPgLdskLbDAgwfDgE2mZnCfovUGmCjinh8UD1tW3AKfBPjFJbdF6eST8SB7EpDt162cZu7992Gaa3jNYwYnJKGKqU1izwb2WRVC3yXSHFQxr8GkTa3uQ9WAL1hyMSSNg7GqzF5a8GXFUTCw97zXUevKjtBAKxmjLQTfsmDdzYTe1oBNXEgffhVndtxhCfViYbnHVHUqEv8NQA8xiZaEzj9eCfrYyPepiq1sRruFwgjqhqhpetrQaKcSXmFjeFzCHnDR3aAV9dXQr6SyqAf7p7ML9H4rYNhLJAc4Usbuq8rVH8ysmTZPb7erhWmKXG8yFWqc6mE6tekXUuyvPhh3uXJWZgc6Z2RDbDNRvZNkxbUMDEDfb3iLtcNd3wGGLFndzryQNft8FZS4xwaskVZFQkFga3dfCgkMv3NAXrRTPmrDYD2WgurR8PfewJAJ2nu4GpMJadgTkkkLYvgrVxC8jp3w39dXzSCKAcQ7cGWyvYW6HK1s1VcG9QiogDf6YhM5mfroCCn6HweQ7hDdYtRvSyuDBVaZAJmhxKBffsGsApKocqPeZMjo8hsRr3bWgJA2xBhzxn42HCgDf2qULBH4b9HN5N3hyR7WURyVr9Y1vXwFTakEtMsr861X88mi2yUi7aqRh3XAFoN11Do9N34UPSzreELFk3SCxJT4uAdsKQrCm5yRo1zt5Mgh4tpHfgk4SsY7"),
//     "a40b86c663fbbfefa243c9c6ebbc5690fc4e385f15b44c49ba469c91c5af0f48").then(res => console.log(res.to_json()))
// const network = new ErgoNetwork();
// network.getErgBox(wasm.Address.from_mainnet_str("9iAEDf2b4J5T1QSAPStkSbSzNUUW38cy8EMJkKC3cxHCBoaQYfY"),100000000n)
//     .then(res=>{
//         const box=res[0];
//         return network.trackMemPool(box)
//     })
//     .then(res=>{
//     const sk = wasm.SecretKey.dlog_from_bytes(strToUint8Array("a17f30e2612a26e67057b51c7074d8cebd21673c810f54d04d7d0e1408044c09"));
//     const sks=new wasm.SecretKeys();
//     sks.add(sk);
//     const wallet=wasm.Wallet.from_secrets(sks);
//     const box=res;
//     const boxes=new wasm.ErgoBoxes(box);
//     const boxSelector = new wasm.SimpleBoxSelector();
//     const target_balance=wasm.BoxValue.from_i64(wasm.I64.from_str("1000000").checked_add(wasm.BoxValue.SAFE_USER_MIN().as_i64()));
//     // const selection =new wasm.BoxSelection(boxes,new wasm.ErgoBoxAssetsDataList());
//     const selection=boxSelector.select(boxes,target_balance,new wasm.Tokens());
//     const outbox_value=wasm.BoxValue.SAFE_USER_MIN();
//     const contract =wasm.Contract.pay_to_address(wasm.Address.from_mainnet_str("9iAEDf2b4J5T1QSAPStkSbSzNUUW38cy8EMJkKC3cxHCBoaQYfY"))
//     const outbox=new wasm.ErgoBoxCandidateBuilder(outbox_value,contract,0).build();
//     const txOutputs=new wasm.ErgoBoxCandidates(outbox);
//     const txbuilder=wasm.TxBuilder.new(selection,txOutputs,0,wasm.BoxValue.SAFE_USER_MIN(),wasm.Address.from_mainnet_str("9iAEDf2b4J5T1QSAPStkSbSzNUUW38cy8EMJkKC3cxHCBoaQYfY"),wasm.BoxValue.SAFE_USER_MIN()).build();
//     // console.log(txbuilder.to_json())
//     const ctx =network.getErgoStateContext().then(ctx =>{
//         const tx_data_inputs = wasm.ErgoBoxes.from_boxes_json([]);
//         const signedTx=wallet.sign_transaction(ctx,txbuilder,boxes,tx_data_inputs);
//         console.log(signedTx.to_json())
//         network.sendTx(signedTx.to_json())
//     });
//
// });
