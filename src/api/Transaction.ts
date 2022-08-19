import { ErgoNetwork } from "../ergo/network/ergoNetwork";
import * as wasm from "ergo-lib-wasm-nodejs";
import { hexStrToUint8Array, uint8ArrayToHex } from "../utils/utils";
import { rosenConfig } from "../config/rosenConfig";
import { Config } from "../config/config";
import { Boxes } from "../ergo/boxes";
import { ErgoUtils } from "../ergo/utils";
import { addWidExtractor } from "../jobs/Scanner";

const ergoConfig = Config.getConfig();

export type ApiResponse = {
    response: string;
    status: number;
}

/**
 * Transaction class used by watcher to generate transaction for ergo network
 */
export class Transaction{
    watcherPermitState?: boolean;
    watcherWID?: string;
    boxes: Boxes
    minBoxValue: wasm.BoxValue;
    fee: wasm.BoxValue;
    userSecret: wasm.SecretKey;
    userAddress: wasm.Address;
    userAddressContract: wasm.Contract;
    RSN: wasm.TokenId;

    /**
     * constructor
     * @param rosenConfig hard coded Json of rosen config
     * @param userAddress string
     * @param userSecret  string
     * @param boxes
     */
    constructor(
        rosenConfig: rosenConfig,
        userAddress: string,
        userSecret: wasm.SecretKey,
        boxes: Boxes
    ) {
        this.watcherPermitState = undefined;
        this.watcherWID = "";
        this.boxes = boxes;
        this.fee = wasm.BoxValue.from_i64(wasm.I64.from_str(rosenConfig.fee));
        this.minBoxValue = wasm.BoxValue.from_i64(wasm.I64.from_str(rosenConfig.minBoxValue));
        this.userSecret = userSecret
        this.userAddress = wasm.Address.from_base58(userAddress);
        this.RSN = wasm.TokenId.from_str(rosenConfig.RSN);
        this.userAddressContract = wasm.Contract.pay_to_address(this.userAddress);
        this.getWatcherState();
    }

    /**
     * it gets repoBox users list and find the corresponding wid to the watcher and
     *  returns it's wid or in case of no permits return empty string
     * @param users
     */
    getWID = async (users: Array<Uint8Array>): Promise<string> => {
        // TODO: This function hasn't good performance
        const usersWID = users.map(async (id) => {
            const wid = uint8ArrayToHex(id);
            try {
                await ErgoNetwork.getBoxWithToken(this.userAddress, wid,);
                return true;
            } catch (error) {
                return false;
            }
        });
        for (const [i, userWID] of usersWID.entries()) {
            if (await userWID) {
                return uint8ArrayToHex(users[i])
            }
        }
        return "";
    }

    /**
     * generating returning permit transaction and send it to the network
     * @param RWTCount
     */
    returnPermit = async (RWTCount: bigint): Promise<ApiResponse> => {
        await this.getWatcherState();
        if (!this.watcherPermitState) {
            return {response: "you don't have permit box", status: 500}
        }
        const WID = this.watcherWID!;
        const height = await ErgoNetwork.getHeight();

        const permitBoxes = await this.boxes.getPermits(WID, RWTCount)
        const repoBox = await this.boxes.getRepoBox();
        const R4 = repoBox.register_value(4)
        const R5 = repoBox.register_value(5)
        const R6 = repoBox.register_value(6);

        // This couldn't happen
        if (!R4 || !R5 || !R6) {
            return {response: "one of registers (4, 5, 6) of repo box is not set", status: 500}
        }

        const users = R4.to_coll_coll_byte();

        const widBox = await ErgoNetwork.getBoxWithToken(this.userAddress, WID)

        const usersCount: Array<string> | undefined = R5.to_i64_str_array();

        const widIndex = users.map(user => uint8ArrayToHex(user)).indexOf(WID);
        const inputRWTCount = BigInt(usersCount[widIndex]);
        let newUsers = users;
        let newUsersCount = usersCount;
        let needOutputPermitBox = false;
        if (inputRWTCount == RWTCount) {
            newUsers = users.slice(0, widIndex).concat(users.slice(widIndex + 1, users.length));
            newUsersCount = usersCount.slice(0, widIndex).concat(usersCount.slice(widIndex + 1, usersCount.length));
        } else if (inputRWTCount > RWTCount) {
            newUsersCount[widIndex] = (inputRWTCount - RWTCount).toString();
            needOutputPermitBox = true;
        } else {
            return {response: "You don't have enough RWT locked to extract from repo box", status: 500}
        }
        const RepoRWTCount = repoBox.tokens().get(1).amount().as_i64().checked_add(
            wasm.I64.from_str(
                RWTCount.toString()
            )
        );
        const RSNTokenCount = repoBox.tokens().get(2).amount().as_i64().checked_add(
            wasm.I64.from_str(
                (RWTCount * (-BigInt("100"))).toString()
            )
        );

        const RSNRWTRatio = R6.to_i64_str_array()[0];

        const repoOut = await this.boxes.createRepo(
            height,
            RepoRWTCount.to_str(),
            RSNTokenCount.to_str(),
            newUsers,
            newUsersCount,
            R6,
            widIndex
        );

        const inputBoxes = new wasm.ErgoBoxes(repoBox);
        permitBoxes.forEach(box => inputBoxes.add(box))
        inputBoxes.add(widBox);

        const inputBoxSelection = new wasm.BoxSelection(inputBoxes, new wasm.ErgoBoxAssetsDataList());
        const changeTokens = this.inputBoxesTokenMap(inputBoxes, 2);

        let rsnCount = changeTokens.get(this.RSN.to_str());
        if (rsnCount === undefined) {
            rsnCount = "0";
        } else {
            changeTokens.delete(this.RSN.to_str());
        }

        const repoValue = BigInt(repoBox.value().as_i64().to_str());
        const permitValue = permitBoxes.map(permit =>
            BigInt(permit.value().as_i64().to_str()))
            .reduce((a, b) => a + b, 0n)
        const widValue = BigInt(widBox.value().as_i64().to_str());
        const totalInputValue = repoValue + permitValue + widValue;

        const userOutBoxBuilder = new wasm.ErgoBoxCandidateBuilder(
            wasm.BoxValue.from_i64(wasm.I64.from_str(
                (totalInputValue -
                    BigInt(this.fee.as_i64().to_str()) - repoValue -
                    ((needOutputPermitBox ? BigInt("1") : BigInt("0")) *
                        BigInt(this.minBoxValue.as_i64().to_str())
                    )
                ).toString())),
            this.userAddressContract,
            height
        );

        userOutBoxBuilder.add_token(
            this.RSN,
            wasm.TokenAmount.from_i64(wasm.I64.from_str(
                    ((RWTCount) * BigInt(RSNRWTRatio) + BigInt(rsnCount)).toString()
                )
            ),
        );

        for (const [tokenId, tokenAmount] of changeTokens) {
            if (tokenAmount !== "0") {
                userOutBoxBuilder.add_token(
                    wasm.TokenId.from_str(tokenId),
                    wasm.TokenAmount.from_i64(wasm.I64.from_str(tokenAmount)),
                );
            }
        }
        const userOutBox = userOutBoxBuilder.build();
        const outputBoxes = new wasm.ErgoBoxCandidates(repoOut);
        const permitsRWTCount: bigint = permitBoxes.map(permit =>
            BigInt(permit.tokens().get(0).amount().as_i64().to_str()))
            .reduce((a, b) => a + b, BigInt(0))
        if (permitsRWTCount > RWTCount) {
            const permitOut = this.boxes.createPermit(
                height,
                permitsRWTCount - RWTCount,
                hexStrToUint8Array(WID)
            );
            outputBoxes.add(permitOut);
        }
        outputBoxes.add(userOutBox);


        const builder = wasm.TxBuilder.new(
            inputBoxSelection,
            outputBoxes,
            height,
            this.fee,
            this.userAddress,
            this.minBoxValue,
        );

        const signedTx = await ErgoUtils.buildTxAndSign(builder, this.userSecret, inputBoxes);
        await ErgoNetwork.sendTx(signedTx.to_json());
        this.watcherPermitState = !this.watcherPermitState;
        this.watcherWID = "";
        return {response: signedTx.id().to_str(), status: 200}
    }

    /**
     * generate a map of tokenId and amount from inputBoxes list with offset set to 0
     *  by default
     * @param inputBoxes
     * @param offset
     */
    inputBoxesTokenMap = (inputBoxes: wasm.ErgoBoxes, offset = 0): Map<string, string> => {
        const changeTokens = new Map<string, string>();
        for (let i = offset; i < inputBoxes.len(); i++) {
            const boxTokens = inputBoxes.get(i).tokens();
            for (let j = 0; j < boxTokens.len(); j++) {
                const token = boxTokens.get(j);
                const tokenId = token.id().to_str();
                const tokenAmount = token.amount().as_i64();
                if (changeTokens.get(tokenId) !== undefined) {
                    tokenAmount.checked_add(token.amount().as_i64());
                }
                changeTokens.set(tokenId, tokenAmount.to_str());
            }
        }
        return changeTokens;
    }

    /**
     * getting watcher permit transaction
     * @param RSNCount
     */
    getPermit = async (RSNCount: bigint): Promise<ApiResponse> => {
        await this.getWatcherState();
        if (this.watcherPermitState) {
            return {response: "you don't have locked any RSN", status: 500};
        }
        const height = await ErgoNetwork.getHeight();
        const repoBox = await this.boxes.getRepoBox();
        const R4 = repoBox.register_value(4)
        const R5 = repoBox.register_value(5)
        const R6 = repoBox.register_value(6);

        // This couldn't happen
        if (!R4 || !R5 || !R6) {
            return {response: "one of registers (4, 5, 6) of repo box is not set", status: 500}
        }

        const RSNRWTRation = R6.to_i64_str_array()[0];

        const RWTCount = RSNCount / BigInt(R6.to_i64_str_array()[0]);

        const RSNInput = await ErgoNetwork.getBoxWithToken(this.userAddress, this.RSN.to_str())
        const users: Array<Uint8Array> = R4.to_coll_coll_byte();
        const repoBoxId = repoBox.box_id().as_bytes();
        users.push(repoBoxId);
        const usersCount: Array<string> = R5.to_i64_str_array();

        const count = RWTCount.toString();
        usersCount.push(count);

        const RepoRWTCount = repoBox.tokens().get(1).amount().as_i64().checked_add(
            wasm.I64.from_str(
                (RWTCount * BigInt("-1")).toString()
            )
        );
        const RSNTokenCount = repoBox.tokens().get(2).amount().as_i64().checked_add(
            wasm.I64.from_str(
                (RWTCount * BigInt(RSNRWTRation)).toString()
            )
        );

        const repoOut = await this.boxes.createRepo(
            height,
            RepoRWTCount.to_str(),
            RSNTokenCount.to_str(),
            users,
            usersCount,
            R6,
            0
        );

        const permitOut = await this.boxes.createPermit(height, RWTCount, repoBox.box_id().as_bytes());
        const WIDToken = wasm.TokenId.from_str(repoBox.box_id().to_str());
        const WIDTokenAmount = wasm.TokenAmount.from_i64(wasm.I64.from_str("1"));
        const inputBoxes = new wasm.ErgoBoxes(repoBox);
        inputBoxes.add(RSNInput);

        const repoValue = repoBox.value();
        const permitValue = RSNInput.value();
        const preTotalInputValue = BigInt(repoValue.as_i64().checked_add(permitValue.as_i64()).to_str());
        const outputValue = BigInt(this.minBoxValue.as_i64().to_str()) * (BigInt("3"));
        if (!(preTotalInputValue >= outputValue)) {
            try {
                const boxes = await ErgoNetwork.getErgBox(
                    this.userAddress,
                    outputValue - preTotalInputValue,
                    (box => {
                        return box.box_id().to_str() !== RSNInput.box_id().to_str()
                    }),
                );
                boxes.forEach(box => inputBoxes.add(box));
            } catch {
                return {response: "You don't have enough Erg to make the transaction", status: 500};
            }
        }

        let totalInputValue = wasm.I64.from_str("0");
        for (let i = 0; i < inputBoxes.len(); i++) {
            totalInputValue = totalInputValue.checked_add(inputBoxes.get(i).value().as_i64());
        }

        const changeTokens = this.inputBoxesTokenMap(inputBoxes, 1);

        const rsnCount = changeTokens.get(this.RSN.to_str());
        if (rsnCount === undefined) {
            return {response: "You don't have enough RSN", status: 500};
        }

        const RSNChangeAmount = (BigInt(rsnCount) - RSNCount);
        if (RSNChangeAmount < 0) {
            return {response: "You don't have enough RSN", status: 500};
        }

        (RSNChangeAmount !== 0n
                ? changeTokens.set(this.RSN.to_str(), RSNChangeAmount.toString())
                : changeTokens.delete(this.RSN.to_str())
        )

        const changeBoxValue = (BigInt(totalInputValue.to_str()) - (outputValue)).toString();

        const userOut = await this.boxes.createUserBoxCandidate(
            height,
            this.userAddress.to_base58(ergoConfig.networkType),
            changeBoxValue,
            WIDToken,
            WIDTokenAmount,
            changeTokens,
        );

        const inputBoxSelection = new wasm.BoxSelection(inputBoxes, new wasm.ErgoBoxAssetsDataList());
        const outputBoxes = new wasm.ErgoBoxCandidates(repoOut);
        outputBoxes.add(permitOut);
        outputBoxes.add(userOut);

        const builder = wasm.TxBuilder.new(
            inputBoxSelection,
            outputBoxes,
            height,
            this.fee,
            this.userAddress,
            this.minBoxValue,
        );

        const signedTx = await ErgoUtils.buildTxAndSign(builder, this.userSecret, inputBoxes);
        await ErgoNetwork.sendTx(signedTx.to_json());
        this.watcherPermitState = !this.watcherPermitState;
        this.watcherWID = WIDToken.to_str();
        return {response: signedTx.id().to_str(), status: 200};
    }

    /**
     * updating watcher state(permitState and WID if exist)
     */
    getWatcherState = async () => {
        console.log("Getting watcher status")
        if (this.watcherPermitState === undefined) {
            const repoBox = await this.boxes.getRepoBox();
            const R4 = repoBox.register_value(4)
            console.log("Repo box id is: ", repoBox.box_id().to_str())
            if(R4){
                const users = R4.to_coll_coll_byte();
                this.watcherWID = await this.getWID(users);
                console.log("Watcher WID is set to: ", this.watcherWID)
                this.watcherPermitState = (this.watcherWID !== "");
            }
        }
    }
}
