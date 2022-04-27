import { main } from "./cardano/scanner/scanner";
import "reflect-metadata";
import express from "express";
import { generateSK } from "./api/generateAddress";
import generateAddress from "./api/generateAddress";
import { Explorer } from "./ergo/network/explorer";
import * as ergoLib from "ergo-lib-wasm-nodejs";

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
const api=new Explorer();
const tree=ergoLib.Address.from_mainnet_str("9erMHuJYNKQkZCaDs9REhpNaWbhMPbdVmqgM4s7M2GjtQ56j2xG").to_ergo_tree();

 api.getCoveringErgAndTokenForAddress(tree.to_base16_bytes(),1000).then(res=>console.log(res))
