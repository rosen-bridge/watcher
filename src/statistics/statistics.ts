import { Config } from "../config/config";
import { ErgoNetwork } from "../ergo/network/ergoNetwork";

const config = Config.getConfig();

class Statistics{
    private static instance: Statistics;
    private readonly watcherAddress = config.address;
    private readonly ergoNetwork = ErgoNetwork;

    //TODO:should fixed later
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    private constructor() {
    }

    static getInstance = () => {
        if (!Statistics.instance) {
            Statistics.instance = new Statistics();
        }
        return Statistics.instance;
    }

    getErgs = async (): Promise<string> => {
        const balance = await this.ergoNetwork.getBalanceConfirmed(this.watcherAddress);
        return balance.nanoErgs.toString();
    }

    getCommitments = ()=>{

    }
}


export default Statistics
