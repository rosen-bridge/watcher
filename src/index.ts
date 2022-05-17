import { main } from "./cardano/scanner/scanner";
import "reflect-metadata";
import express from "express";
import { generateSK } from "./api/generateAddress";
import generateAddress from "./api/generateAddress";
import { ErgoNetwork } from "./ergo/network/ergoNetwork";
import * as ergoLib from "ergo-lib-wasm-nodejs";
import { Contracts } from "./api/contracts";
import { Transaction } from "./api/lock";
import { strToUint8Array } from "./utils/utils";
import config from "config";
import { rosenConfig } from "./api/rosenConfig";
import bigInt from "big-integer";
import lockRSN from "./api/lockRSN";

// main()
const app = express();
app.use('/address', generateAddress);
app.use('/lock',lockRSN);


const port = process.env.PORT || 3000;

app.listen(port, () => console.log(`app listening on port ${port}`));
//
// generateSK()
// const api=new ErgoNetwork();
// const tree=ergoLib.Address.from_mainnet_str("9erMHuJYNKQkZCaDs9REhpNaWbhMPbdVmqgM4s7M2GjtQ56j2xG").to_ergo_tree();

// api.getCoveringErgAndTokenForAddress(tree.to_base16_bytes(),1000).then(res=>console.log(res))
// api.getRSNBoxes(0).then(res=>console.log(res.getBoxJson()))

// const rwtRepo=Contracts.generateRWTRepoContractAddress().then(res=>console.log(res));
// const test = createRepoBox();


// const api = new ErgoNetwork();
// api.getRSNBoxes().then(res => console.log(res.getErgoBox()))
// api.getRepoBox().then(res => console.log(res.getErgoBox()))

// console.log(ergoLib.I64.from_str("12").checked_add(ergoLib.I64.from_str("-12")).to_str());
// ergoLib.I64.from_str("-"+RWTCount.toString())
//
// console.log(ergoLib.BoxValue.SAFE_USER_MIN().as_i64().to_str());
//
//
const lock = new Transaction(rosenConfig, "9hwWcMhrebk4Ew5pBpXaCJ7zuH8eYkY9gRfLjNP3UeBYNDShGCT", "7c390866f06156c5c67b355dac77b6f42eaffeb30e739e65eac2c7e27e6ce1e2");
// lock.getPermit("100");
lock.watcherHasLocked().then(res=>console.log(res));

// const test = bigInt("1111111111111111111111111111111111111111");
// console.log(test.toString())
// const times = bigInt("2");
// console.log(test.times(times));

// lock.initRepoBox(200,10,"2");
// lock.getPermit(100);

// const bankAddress=ergoLib.Address.from_base58("N9nHZxAm7Z476Nbw6yF2X6BQEct7nNCm4SJeCK8DJEkERj6LXMJvKqG49WWSfNDufuuFEtN8msfWDd8UR4QUCmLEwFRWXC5hxEdk1XhdRSgiwuqyiPqpSTXtqUgGf67uCzEtHtN5nQKKuRYyr6xfFfV8YXKhms5JVqhmCM9869Nr4KzmLAdSLqwG6LswnFwRWwZZfC6Jf65RKV4xV5GTDqL5Ppc2QwnGDYFEUPPgLdskLbDAgwfDgE2mZnCfovUGmCjinh8UD1tW3AKfBPjFJbdF6eST8SB7EpDt162cZu7992Gaa3jNYwYnJKGKqU1izwb2WRVC3yXSHFQxr8GkTa3uQ9WAL1hyMSSNg7GqzF5a8GXFUTCw97zXUevKjtBAKxmjLQTfsmDdzYTe1oBNXEgffhVndtxhCfViYbnHVHUqEv8NQA8xiZaEzj9eCfrYyPepiq1sRruFwgjqhqhpetrQaKcSXmFjeFzCHnDR3aAV9dXQr6SyqAf7p7ML9H4rYNhLJAc4Usbuq8rVH8ysmTZPb7erhWmKXG8yFWqc6mE6tekXUuyvPhh3uXJWZgc6Z2RDbDNRvZNkxbUMDEDfb3iLtcNd3wGGLFndzryQNft8FZS4xwaskVZFQkFga3dfCgkMv3NAXrRTPmrDYD2WgurR8PfewJAJ2nu4GpMJadgTkkkLYvgrVxC8jp3w39dXzSCKAcQ7cGWyvYW6HK1s1VcG9QiogDf6YhM5mfroCCn6HweQ7hDdYtRvSyuDBVaZAJmhxKBffsGsApKocqPeZMjo8hsRr3bWgJA2xBhzxn42HCgDf2qULBH4b9HN5N3hyR7WURyVr9Y1vXwFTakEtMsr861X88mi2yUi7aqRh3XAFoN11Do9N34UPSzreELFk3SCxJT4uAdsKQrCm5yRo1zt5Mgh4tpHfgk4SsY7");
//
// console.log(bankAddress.to_ergo_tree().to_base16_bytes());


// const api = new ErgoNetwork();
// api.getErgoStateContext().then(res => console.log(res))
// lock.initRepoBox();

// const SK = ergoLib.SecretKey.random_dlog();
// console.log(Buffer.from(SK.to_bytes()).toString('hex'));
// console.log(SK.get_address().to_base58(0));




const sk = "7c390866f06156c5c67b355dac77b6f42eaffeb30e739e65eac2c7e27e6ce1e2";
const address = "9hwWcMhrebk4Ew5pBpXaCJ7zuH8eYkY9gRfLjNP3UeBYNDShGCT";
// const sk = ergoLib.SecretKey.dlog_from_bytes(strToUint8Array("0e63ebf90bb888862f38b3e1def61707e14ea1775b4003f6f708305550824652"));
// console.log(sk.get_address().to_base58(0));

