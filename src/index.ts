import { main } from "./cardano/scanner/scanner";
import "reflect-metadata";
import express from "express";
import { generateSK } from "./api/generateAddress";
import generateAddress from "./api/generateAddress";
import { Explorer } from "./ergo/network/explorer";
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
api.getCoveringErgAndTokenForAddress("3Ww8f4ZxN579AayqphK1pqGRBgSZFvAHAEgmAF9My3aLgMmGibcP",1000);
