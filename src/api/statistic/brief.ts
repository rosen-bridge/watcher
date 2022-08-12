import express from "express";
import { ergoNetworkApi, watcherTransaction } from "../../index";
import { ErgoNetwork } from "../../ergo/network/ergoNetwork";
import { ErgoConfig } from "../../config/config";

const statisticRouter = express.Router();
const ergoConfig = ErgoConfig.getConfig();

statisticRouter.get('/brief', async () => {
    const watcherPermitState = watcherTransaction.watcherPermitState!;
    let WID = "";
    if (watcherPermitState) {
        WID = watcherTransaction.watcherWID!;
    }
    // const PermitCount=
    const confirmedBalance = await ErgoNetwork.getAddressBalanceConfirmed(watcherTransaction.userAddress.to_base58(ergoConfig.networkType));
    const nanoErgs = confirmedBalance.nanoErgs;
    const RSNCount=confirmedBalance.
})

export default statisticRouter;
