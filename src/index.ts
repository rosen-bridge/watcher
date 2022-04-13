import { main } from "./scanner/scanner";
import "reflect-metadata";
import { KoiosNetwork } from "./network/koios";

// main()

KoiosNetwork.getTxUtxos(["9f00d372e930d685c3b410a10f2bd035cd9a927c4fd8ef8e419c79b210af7ba6"]).then(res=>console.log(res[0].utxos[0].asset_list))
