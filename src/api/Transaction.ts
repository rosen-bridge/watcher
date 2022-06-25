import { ErgoNetwork } from "../ergo/network/ergoNetwork";
import * as wasm from "ergo-lib-wasm-nodejs";
import { strToUint8Array, uint8ArrayToHex } from "../utils/utils";
import { rosenConfig } from "../config/rosenConfig";
import { ErgoConfig } from "../config/config";

const ergoConfig = ErgoConfig.getConfig();

export type ApiResponse = {
    response: string;
    status: number;
}

/**
 * Transaction class used by watcher to generate transaction for ergo network
 */
export class Transaction{

    ergoNetwork: ErgoNetwork;
    RepoNFTId: wasm.TokenId;
    RWTTokenId: wasm.TokenId;
    RSN: wasm.TokenId;
    watcherPermitContract: wasm.Contract;
    watcherPermitAddress: wasm.Address;
    minBoxValue: wasm.BoxValue;
    fee: wasm.BoxValue;
    userAddressContract: wasm.Contract;
    userAddress: wasm.Address;
    userSecret: string;
    repoAddressContract: wasm.Contract;
    repoAddress: wasm.Address;
    watcherPermitState?: boolean;
    watcherWID?: string;

    /**
     * constructor
     * @param rosenConfig hard coded Json of rosen config
     * @param userAddress string
     * @param userSecret  string
     */
    constructor(
        rosenConfig: rosenConfig,
        userAddress: string,
        userSecret: string,
    ) {
        const watcherPermitAddress = rosenConfig.watcherPermitAddress;
        const watcherRepoAddress = rosenConfig.RWTRepoAddress;
        this.ergoNetwork = new ErgoNetwork();
        this.RepoNFTId = wasm.TokenId.from_str(ergoConfig.RepoNFT);
        this.RWTTokenId = wasm.TokenId.from_str(ergoConfig.RWTId);
        this.RSN = wasm.TokenId.from_str(rosenConfig.RSN);
        this.watcherPermitAddress = wasm.Address.from_base58(watcherPermitAddress);
        this.watcherPermitContract = wasm.Contract.pay_to_address(this.watcherPermitAddress);
        this.minBoxValue = wasm.BoxValue.from_i64(wasm.I64.from_str(rosenConfig.minBoxValue));
        this.userAddress = wasm.Address.from_base58(userAddress);
        this.userAddressContract = wasm.Contract.pay_to_address(this.userAddress);
        this.repoAddress = wasm.Address.from_base58(watcherRepoAddress);
        this.repoAddressContract = wasm.Contract.pay_to_address(this.repoAddress);
        this.userSecret = userSecret;
        this.fee = wasm.BoxValue.from_i64(wasm.I64.from_str(rosenConfig.fee));
        this.watcherPermitState = undefined;
        this.watcherWID = "";
        this.getWatcherState();
    }

    /**
     * generating permit box used in returning permit and getting permit
     * @param height
     * @param RWTCount
     * @param WID
     */
    createPermitBox = async (
        height: number,
        RWTCount: string,
        WID: Uint8Array
    ) => {
        const permitBuilder = new wasm.ErgoBoxCandidateBuilder(
            this.minBoxValue,
            this.watcherPermitContract,
            height
        );

        const RWTTokenAmount = wasm.TokenAmount.from_i64(wasm.I64.from_str(RWTCount));

        permitBuilder.add_token(
            this.RWTTokenId,
            RWTTokenAmount
        );

        permitBuilder.set_register_value(4, wasm.Constant.from_coll_coll_byte([WID]));
        permitBuilder.set_register_value(5, wasm.Constant.from_byte_array(new Uint8Array([0])));

        return permitBuilder.build();

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
    createUserBoxCandidate = async (
        height: number,
        address: string,
        amount: string,
        tokenId: wasm.TokenId,
        tokenAmount: wasm.TokenAmount,
        changeTokens: Map<string, string>,
    ) => {
        const userBoxBuilder = new wasm.ErgoBoxCandidateBuilder(
            wasm.BoxValue.from_i64(wasm.I64.from_str(amount)),
            this.userAddressContract,
            height
        );
        userBoxBuilder.add_token(
            tokenId,
            tokenAmount
        );

        for (const [tokenId, tokenAmount] of changeTokens) {
            userBoxBuilder.add_token(
                wasm.TokenId.from_str(tokenId),
                wasm.TokenAmount.from_i64(wasm.I64.from_str(tokenAmount)),
            );
        }

        return userBoxBuilder.build();
    }

    /**
     * it gets repoBox users list and find the corresponding wid to the watcher and
     *  returns it's wid or in case of no permits return empty string
     * @param users
     */
    getWID = async (users: Array<Uint8Array>): Promise<string> => {
        const usersWID = users.map(async (id) => {
            const wid = uint8ArrayToHex(id);
            try {
                const box = await this.ergoNetwork.getBoxWithToken(this.userAddress, wid,);
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
     * create repo box that used in output of permit transactions
     * @param height
     * @param RWTCount
     * @param RSNCount
     * @param users
     * @param userRWT
     * @param R6
     * @param R7
     */
    createRepo = async (
        height: number,
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

        repoBuilder.add_token(
            this.RepoNFTId,
            wasm.TokenAmount.from_i64(wasm.I64.from_str("1")),
        );
        repoBuilder.add_token(
            this.RWTTokenId,
            wasm.TokenAmount.from_i64(wasm.I64.from_str(RWTCount)),
        );
        repoBuilder.add_token(
            this.RSN,
            wasm.TokenAmount.from_i64(wasm.I64.from_str(RSNCount)),
        );

        repoBuilder.set_register_value(4, wasm.Constant.from_coll_coll_byte(users));
        repoBuilder.set_register_value(5, wasm.Constant.from_i64_str_array(userRWT));
        repoBuilder.set_register_value(6, R6);
        repoBuilder.set_register_value(7, wasm.Constant.from_i32(R7));
        return repoBuilder.build();
    }

    /**
     * generating returning permit transaction and send it to the network
     * @param RWTCount
     */
    returnPermit = async (RWTCount: bigint): Promise<ApiResponse> => {
        await this.getWatcherState();
        if (!this.watcherPermitState) {
            return {response: "you doesn't have permit box", status: 500}
        }
        const WID = this.watcherWID!;
        const height = await this.ergoNetwork.getHeight();

        //TODO: permit box should grab from the network with respect to the value in the register
        const permitBox = await this.ergoNetwork.getBoxWithToken(this.watcherPermitAddress, this.RWTTokenId.to_str());
        const repoBox = await this.getRepoBox();

        const users = repoBox.register_value(4)?.to_coll_coll_byte()!;

        const widBox = await this.ergoNetwork.getBoxWithToken(this.userAddress, WID)

        const usersCount: Array<string> | undefined = repoBox.register_value(5)?.to_i64_str_array()!;

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

        const R6 = repoBox.register_value(6);
        if (R6 === undefined) {
            return {response: "register 6 of repo box is not set", status: 500}
        }

        const RSNRWTRatio = R6.to_i64_str_array()[0];

        const repoOut = await this.createRepo(
            height,
            RepoRWTCount.to_str(),
            RSNTokenCount.to_str(),
            newUsers,
            newUsersCount,
            R6,
            widIndex
        );

        const inputBoxes = new wasm.ErgoBoxes(repoBox);
        inputBoxes.add(permitBox);
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
        const permitValue = BigInt(permitBox.value().as_i64().to_str());
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
        const permitBoxRWTCount = BigInt(permitBox.tokens().get(0).amount().as_i64().to_str());
        if (permitBoxRWTCount > RWTCount) {
            const permitOut = await this.createPermitBox(
                height,
                (permitBoxRWTCount - RWTCount).toString(),
                strToUint8Array(WID)
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

        const signedTx = await this.buildTxAndSign(builder, inputBoxes);
        await this.ergoNetwork.sendTx(signedTx.to_json());
        this.watcherPermitState = !this.watcherPermitState;
        this.watcherWID = "";
        return {response: signedTx.id().to_str(), status: 200}
    }

    /**
     * get an unsigned transaction and sign it using watcher secret key
     * @param builder
     * @param inputBoxes
     * @param dataInputs
     */
    buildTxAndSign = async (
        builder: wasm.TxBuilder,
        inputBoxes: wasm.ErgoBoxes,
        dataInputs: wasm.ErgoBoxes = wasm.ErgoBoxes.from_boxes_json([])
    ): Promise<wasm.Transaction> => {
        const tx = builder.build();
        const sks = new wasm.SecretKeys();
        const sk = wasm.SecretKey.dlog_from_bytes(strToUint8Array(this.userSecret));
        sks.add(sk);
        const wallet = wasm.Wallet.from_secrets(sks);
        const ctx = await this.ergoNetwork.getErgoStateContext();
        return wallet.sign_transaction(ctx, tx, inputBoxes, dataInputs);
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
     * getting repoBox from network with tracking mempool transactions
     */
    getRepoBox = async (): Promise<wasm.ErgoBox> => {
        return await this.ergoNetwork.trackMemPool(
            await this.ergoNetwork.getBoxWithToken(
                this.repoAddress,
                this.RepoNFTId.to_str()
            )
        )
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
        const height = await this.ergoNetwork.getHeight();
        const repoBox = await this.getRepoBox();
        const R6 = repoBox.register_value(6);
        if (R6 === undefined) {
            return {response: "register 6 of repo box is not set", status: 500};
        }
        const RSNRWTRation = R6.to_i64_str_array()[0];

        const RWTCount = RSNCount / BigInt(R6.to_i64_str_array()[0]);

        const RSNInput = await this.ergoNetwork.getBoxWithToken(this.userAddress, this.RSN.to_str())

        const users: Array<Uint8Array> | undefined = repoBox.register_value(4)?.to_coll_coll_byte()!;
        const repoBoxId = repoBox.box_id().as_bytes();
        users.push(repoBoxId);
        const usersCount: Array<string> | undefined = repoBox.register_value(5)?.to_i64_str_array()!;

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

        const repoOut = await this.createRepo(
            height,
            RepoRWTCount.to_str(),
            RSNTokenCount.to_str(),
            users,
            usersCount,
            R6,
            0
        );

        const permitOut = await this.createPermitBox(height, RWTCount.toString(), repoBox.box_id().as_bytes());
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
                const boxes = await this.ergoNetwork.getErgBox(
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

        const userOut = await this.createUserBoxCandidate(
            height,
            //TODO:should change to read from config
            this.userAddress.to_base58(wasm.NetworkPrefix.Mainnet),
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

        const signedTx = await this.buildTxAndSign(builder, inputBoxes);
        await this.ergoNetwork.sendTx(signedTx.to_json());
        this.watcherPermitState = !this.watcherPermitState;
        this.watcherWID = WIDToken.to_str();
        return {response: signedTx.id().to_str(), status: 200};
    }

    /**
     * updating watcher state(permitState and WID if exist)
     */
    getWatcherState = async () => {
        if (this.watcherPermitState === undefined) {
            const repoBox = await this.getRepoBox();
            const users = repoBox.register_value(4)?.to_coll_coll_byte()!;
            this.watcherWID = await this.getWID(users);
            this.watcherPermitState = (this.watcherWID !== "");
        }
    }
}
