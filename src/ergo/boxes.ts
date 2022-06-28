import * as wasm from "ergo-lib-wasm-nodejs";
import { contractHash, hexStrToUint8Array } from "./utils";
import { ErgoConfig } from "../config/config";
import { rosenConfig } from "../config/rosenConfig";
import { bigIntToUint8Array} from "../utils/utils";
import { BridgeDataBase } from "../bridge/models/bridgeModel";
import { BoxType } from "../entities/BoxEntity";
import { Observation } from "../objects/interfaces";
import { ErgoNetwork } from "./network/ergoNetwork";
import { NotEnoughFund } from "../errors/errors";

const ergoConfig = ErgoConfig.getConfig();


export class Boxes {
    _dataBase: BridgeDataBase
    repoNFTId: wasm.TokenId;
    RWTTokenId: wasm.TokenId;
    RSN: wasm.TokenId;
    watcherPermitContract: wasm.Contract;
    watcherPermitAddress: wasm.Address;
    minBoxValue: wasm.BoxValue;
    fee: wasm.BoxValue;
    userAddressContract: wasm.Contract;
    userAddress: wasm.Address;
    repoAddressContract: wasm.Contract;
    repoAddress: wasm.Address;

    constructor(db: BridgeDataBase) {
        this._dataBase = db
        this.repoNFTId = wasm.TokenId.from_str(ergoConfig.RepoNFT);
        this.RWTTokenId = wasm.TokenId.from_str(ergoConfig.RWTId);
        this.RSN = wasm.TokenId.from_str(rosenConfig.RSN);
        this.watcherPermitAddress = wasm.Address.from_base58(rosenConfig.watcherPermitAddress);
        this.watcherPermitContract = wasm.Contract.pay_to_address(this.watcherPermitAddress);
        this.minBoxValue = wasm.BoxValue.from_i64(wasm.I64.from_str(rosenConfig.minBoxValue));
        this.userAddress = wasm.Address.from_base58(ergoConfig.address);
        this.userAddressContract = wasm.Contract.pay_to_address(this.userAddress);
        this.repoAddress = wasm.Address.from_base58(rosenConfig.RWTRepoAddress);
        this.repoAddressContract = wasm.Contract.pay_to_address(this.repoAddress);
        this.fee = wasm.BoxValue.from_i64(wasm.I64.from_str(rosenConfig.fee));
    }

    getPermits = async (RWTCount: bigint): Promise<Array<wasm.ErgoBox>> => {
        // TODO: Rewrite the function to return the required number of RWTs after changing database
        const permits = await this._dataBase.getUnspentSpecialBoxes(BoxType.PERMIT)
        const permitBoxes = permits.map(async (permit) => {
            const box = wasm.ErgoBox.from_json(permit.boxJson)
            return await ErgoNetwork.trackMemPool(box)
        })
        return Promise.all(permitBoxes)
    }

    getWIDBox = async (): Promise<wasm.ErgoBox> => {
        const WID = (await this._dataBase.getUnspentSpecialBoxes(BoxType.PERMIT))[0]
        let WIDBox = wasm.ErgoBox.from_json(WID.boxJson)
        WIDBox = await ErgoNetwork.trackMemPool(WIDBox)
        return WIDBox
    }

    getUserPaymentBox = async (requiredValue: bigint): Promise<Array<wasm.ErgoBox>> => {
        const boxes = await this._dataBase.getUnspentSpecialBoxes(BoxType.PERMIT)
        let selectedBoxes = []
        let totalValue = BigInt(0)
        for(const box of boxes){
            totalValue = totalValue + BigInt(box.value)
            selectedBoxes.push(box)
            if(totalValue > requiredValue) break
        }
        if(totalValue < requiredValue){
            console.log("ERROR: Not enough fund to create the transaction")
            throw new NotEnoughFund
        }
        const outBoxes = selectedBoxes.map(async (fund) => {
            const box = wasm.ErgoBox.from_json(fund.boxJson)
            return await ErgoNetwork.trackMemPool(box)
        })
        return Promise.all(outBoxes)
    }

    /**
     * getting repoBox from network with tracking mempool transactions
     */
    getRepoBox = async (): Promise<wasm.ErgoBox> => {
        return await ErgoNetwork.trackMemPool(
            await ErgoNetwork.getBoxWithToken(
                this.repoAddress,
                this.repoNFTId.to_str()
            )
        )
    }

    /**
     * creates a new permit box with required data
     * @param value
     * @param height
     * @param RWTCount
     * @param WID
     */
    createPermit = (height: number, RWTCount: bigint, WID: Uint8Array): wasm.ErgoBoxCandidate => {
        const builder = new wasm.ErgoBoxCandidateBuilder(
            this.minBoxValue,
            this.watcherPermitContract,
            height
        );
        if (RWTCount > 0) {
            builder.add_token(this.RWTTokenId, wasm.TokenAmount.from_i64(wasm.I64.from_str(RWTCount.toString())))
        }
        builder.set_register_value(4, wasm.Constant.from_coll_coll_byte([WID]))
        builder.set_register_value(5, wasm.Constant.from_byte_array(new Uint8Array([0])))
        return builder.build()
    }

    /**
     * creates a new commitment box with the required information on registers
     * @param value
     * @param height
     * @param WID
     * @param requestId
     * @param eventDigest
     * @param permitScriptHash
     */
    createCommitment = (height: number, WID: string, requestId: string, eventDigest: Uint8Array, permitScriptHash: Uint8Array): wasm.ErgoBoxCandidate => {
        const contract = wasm.Contract.pay_to_address(wasm.Address.from_base58(rosenConfig.commitmentAddress));
        const builder = new wasm.ErgoBoxCandidateBuilder(
            this.minBoxValue,
            contract,
            height
        );
        builder.add_token(this.RWTTokenId, wasm.TokenAmount.from_i64(wasm.I64.from_str("1")))
        builder.set_register_value(4, wasm.Constant.from_coll_coll_byte([hexStrToUint8Array(WID)]))
        builder.set_register_value(5, wasm.Constant.from_coll_coll_byte([hexStrToUint8Array(requestId)]))
        builder.set_register_value(6, wasm.Constant.from_byte_array(eventDigest))
        builder.set_register_value(7, wasm.Constant.from_byte_array(permitScriptHash))
        return builder.build()
    }

    /**
     * user output box used in getting permit transaction by watcher
     * @param height
     * @param address
     * @param amount
     * @param tokenId issued token for the getting permit transaction
     * @param tokenAmount
     * @param changeTokens other tokens in the input of transaction
     */
    createUserBoxCandidate = async (height: number,
                                    address: string,
                                    amount: string,
                                    tokenId: wasm.TokenId,
                                    tokenAmount: wasm.TokenAmount,
                                    changeTokens: Map<string, string>) => {
        const userBoxBuilder = new wasm.ErgoBoxCandidateBuilder(
            wasm.BoxValue.from_i64(wasm.I64.from_str(amount)),
            this.userAddressContract,
            height
        );
        userBoxBuilder.add_token(tokenId, tokenAmount);
        for (const [tokenId, tokenAmount] of changeTokens) {
            userBoxBuilder.add_token(
                wasm.TokenId.from_str(tokenId),
                wasm.TokenAmount.from_i64(wasm.I64.from_str(tokenAmount)),
            );
        }
        return userBoxBuilder.build();
    }

    /**
     * Creates trigger event box with the aggregated information of WIDs
     * @param value
     * @param height
     * @param WIDs
     * @param observation
     */
    createTriggerEvent = (value: bigint,
                          height: number,
                          WIDs: Array<Uint8Array>,
                          observation: Observation) => {
        const builder = new wasm.ErgoBoxCandidateBuilder(
            wasm.BoxValue.from_i64(wasm.I64.from_str(value.toString())),
            wasm.Contract.pay_to_address(wasm.Address.from_base58(rosenConfig.eventTriggerAddress)),
            height
        );
        builder.add_token(this.RWTTokenId, wasm.TokenAmount.from_i64(wasm.I64.from_str(WIDs.length.toString())))
        const eventData = [
            Buffer.from(observation.sourceTxId, "hex"),
            Buffer.from(observation.fromChain),
            Buffer.from(observation.toChain),
            Buffer.from(observation.fromAddress),
            Buffer.from(observation.toAddress),
            bigIntToUint8Array(BigInt(observation.amount)),
            bigIntToUint8Array(BigInt(observation.bridgeFee)),
            bigIntToUint8Array(BigInt(observation.networkFee)),
            Buffer.from(observation.sourceChainTokenId, "hex"),
            Buffer.from(observation.targetChainTokenId, "hex"),
            Buffer.from(observation.sourceBlockId, "hex")]
        const permitHash = contractHash(wasm.Contract.pay_to_address(wasm.Address.from_base58(rosenConfig.watcherPermitAddress)))
        builder.set_register_value(4, wasm.Constant.from_coll_coll_byte(WIDs))
        builder.set_register_value(5, wasm.Constant.from_coll_coll_byte(eventData))
        builder.set_register_value(6, wasm.Constant.from_byte_array(permitHash))
        return builder.build()
    }

    /**
     * create repo box that used in output of permit transactions
     * @param height
     * @param RWTCount
     * @param RSNCount
     * @param users
     * @param userRWT
     * @param R6
     * @param R7
     */
    createRepo = async (height: number,
                        RWTCount: string,
                        RSNCount: string,
                        users: Array<Uint8Array>,
                        userRWT: Array<string>,
                        R6: wasm.Constant,
                        R7: number) => {
        const repoBuilder = new wasm.ErgoBoxCandidateBuilder(
            this.minBoxValue,
            this.repoAddressContract,
            height
        );
        repoBuilder.add_token(this.repoNFTId, wasm.TokenAmount.from_i64(wasm.I64.from_str("1")),);
        repoBuilder.add_token(this.RWTTokenId, wasm.TokenAmount.from_i64(wasm.I64.from_str(RWTCount)),);
        repoBuilder.add_token(this.RSN, wasm.TokenAmount.from_i64(wasm.I64.from_str(RSNCount)),);

        repoBuilder.set_register_value(4, wasm.Constant.from_coll_coll_byte(users));
        repoBuilder.set_register_value(5, wasm.Constant.from_i64_str_array(userRWT));
        repoBuilder.set_register_value(6, R6);
        repoBuilder.set_register_value(7, wasm.Constant.from_i32(R7));
        return repoBuilder.build();
    }
}

