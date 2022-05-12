import { main } from "./cardano/scanner/scanner";
import "reflect-metadata";
import express from "express";
import { generateSK } from "./api/generateAddress";
import generateAddress from "./api/generateAddress";
import { ErgoNetwork } from "./ergo/network/ergoNetwork";
import * as ergoLib from "ergo-lib-wasm-nodejs";
import { Contracts } from "./api/contracts";
import { Transactions } from "./api/lock";
import { strToUint8Array } from "./utils/utils";

// main()
// const app = express();
// app.use('/address', generateAddress);
//
// app.get("/secret", (req, res) => {
//
// });
//
// const port = process.env.PORT || 3000;
//
// app.listen(port, () => console.log(`app listening on port ${port}`));
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

const lock = new Transactions();
// lock.initRepoBox(200,10,"2");
lock.getPermit(1);

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

