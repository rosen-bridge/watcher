import { main } from "./cardano/scanner/scanner";
import "reflect-metadata";
import express from "express";
import { generateSK } from "./api/generateAddress";
import generateAddress from "./api/generateAddress";
import { ErgoNetwork } from "./ergo/network/ergoNetwork";
import * as ergoLib from "ergo-lib-wasm-nodejs";
import { Contracts } from "./api/contracts";
import { Transactions } from "./api/lock";

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


