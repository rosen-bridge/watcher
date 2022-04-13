import { main } from "./scanner/scanner";
import "reflect-metadata";
import { KoiosNetwork } from "./network/koios";
import { CardanoUtils } from "./scanner/utils";

// main()

// KoiosNetwork.getTxUtxos(["9f00d372e930d685c3b410a10f2bd035cd9a927c4fd8ef8e419c79b210af7ba6"]).then(res=>console.log(res[0].utxos[0].asset_list))
CardanoUtils.observationsAtHeight("651ad9676d5a42674c60421e8db1f173999e8a1b646b0e78ce4015ece8a060a1").then(res=>console.log(res))
// KoiosNetwork.getTxMetaData(["928052b80bfc23801da525a6bf8f805da36f22fa0fd5fec2198b0746eb82b72b"]).then(res=>console.log(res[0].metadata))