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



const lock = new Transactions();
lock.initRepoBox(1,10,"2");


// const api = new ErgoNetwork();
// api.getErgoStateContext().then(res => console.log(res))
// lock.initRepoBox();

// const sk = ergoLib.SecretKey.dlog_from_bytes(strToUint8Array("0e63ebf90bb888862f38b3e1def61707e14ea1775b4003f6f708305550824652"));
// console.log(sk.get_address().to_base58(0));

