import { ErgoNetwork } from "../ergo/network/ergoNetwork";
import * as wasm from "ergo-lib-wasm-nodejs";
import { strToUint8Array, uint8ArrayToHex } from "../utils/utils";
import { Contracts } from "./contractAddresses";
import { rosenConfig } from "./rosenConfig";
import { ErgoConfig } from "../config/config";

const ergoConfig = ErgoConfig.getConfig();

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
    watcherLockState?: boolean;
    contracts: Contracts;

    /**
     * constructor
     * @param rosenConfig hard coded Json of rosen config
     * @param userAddress string
     * @param userSecret  string
     * @param watcherPermitAddress
     * @param watcherRepoAddress
     */
    private constructor(
        rosenConfig: rosenConfig,
        userAddress: string,
        userSecret: string,
        watcherPermitAddress: string,
        watcherRepoAddress: string,
    ) {
        this.ergoNetwork = new ErgoNetwork();
        this.contracts = new Contracts();
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
        this.watcherLockState = undefined;
    }

    static init = async (rosenConfig: rosenConfig, userAddress: string, userSecret: string): Promise<Transaction> => {
        const contracts = new Contracts();
        const watcherPermitAddress = await contracts.generateWatcherPermitContract();
        const watcherRepoAddress = await contracts.generateRWTRepoContractAddress();
        return new Transaction(
            rosenConfig,
            userAddress,
            userSecret,
            watcherPermitAddress,
            watcherRepoAddress
        );
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
     * checks user boxes to see if there is any input boxes that lock tokens that saved
     *  in the repo box registers or not
     * @param users
     */
    checkWID = (users: Array<Uint8Array>): Array<Promise<boolean>> => {
        return users.map(async (id) => {
            const wid = uint8ArrayToHex(id);
            try {
                const box = await (
                    this.ergoNetwork.getBoxWithToken(
                        this.userAddress,
                        wid,
                    )
                );
                return true;
            } catch (error) {
                return false;
            }
        });
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
     */
    returnPermit = async (RWTCountString: string) => {
        if (!await this.watcherHasLocked()) {
            throw new Error("you have locked RSN");
        }
        const RWTCount = BigInt(RWTCountString);
        const height = await this.ergoNetwork.getHeight();

        //TODO: permit box should grab from the network with respect to the value in the register
        const permitBox = await (
            this.ergoNetwork.getBoxWithToken(
                this.watcherPermitAddress,
                this.RWTTokenId.to_str(),
            )
        );
        const repoBox = await this.getRepoBox();

        const users = repoBox.register_value(4)?.to_coll_coll_byte();
        if (users === undefined) {
            throw new Error("Incorrect RepoBox input");
        }
        const ans = this.checkWID(users);
        let WID = "";
        for (let i = 0; i < ans.length; i++) {
            if (await ans[i]) {
                WID = uint8ArrayToHex(users[i]);
                break;
            }
        }
        if (WID === "") {
            throw new Error("You don't have locked any RSN token");
        }

        const widBox = await (
            this.ergoNetwork.getBoxWithToken(
                this.userAddress,
                WID,
            )
        )

        const usersCount: Array<string> | undefined = repoBox.register_value(5)?.to_i64_str_array();
        if (usersCount === undefined) {
            throw new Error("Incorrect RepoBox input");
        }

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
            throw new Error("You don't have enough RWT locked to extract from repo box");
        }
        const RepoRWTCount = repoBox.tokens().get(1).amount().as_i64().checked_add(
            wasm.I64.from_str(
                inputRWTCount.toString()
            )
        );
        const RSNTokenCount = repoBox.tokens().get(2).amount().as_i64().checked_add(
            wasm.I64.from_str(
                (inputRWTCount * (-BigInt("100"))).toString()
            )
        );

        const R6 = repoBox.register_value(6);
        if (R6 === undefined) {
            throw new Error("register 6 of repo box is not set");
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
                    (inputRWTCount * BigInt(RSNRWTRatio) + BigInt(rsnCount)).toString()
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
        outputBoxes.add(userOutBox);
        const permitBoxRWTCount = BigInt(permitBox.tokens().get(0).amount().as_i64().to_str());
        if (permitBoxRWTCount > RWTCount) {
            const permitOut = await this.createPermitBox(
                height,
                (permitBoxRWTCount - RWTCount).toString(),
                strToUint8Array(WID)
            );
            outputBoxes.add(permitOut);
        }

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
        this.watcherLockState = !this.watcherLockState;
        return signedTx.id().to_str();
    }

    /**
     * get an unsigned transaction and sign it using watcher secret key
     * @param builder
     * @param inputBoxes
     */
    buildTxAndSign = async (builder: wasm.TxBuilder, inputBoxes: wasm.ErgoBoxes): Promise<wasm.Transaction> => {
        const tx = builder.build();
        const sks = new wasm.SecretKeys();
        const sk = wasm.SecretKey.dlog_from_bytes(strToUint8Array(this.userSecret));
        sks.add(sk);
        const wallet = wasm.Wallet.from_secrets(sks);
        const ctx = await this.ergoNetwork.getErgoStateContext();
        const tx_data_inputs = wasm.ErgoBoxes.from_boxes_json([]);
        return wallet.sign_transaction(ctx, tx, inputBoxes, tx_data_inputs);
    }

    /**
     * generate a map of tokenId and amount from inputBoxes list with offset set to 0
     *  by default
     * @param inputBoxes
     * @param offset
     */
    inputBoxesTokenMap = (inputBoxes: wasm.ErgoBoxes, offset: number = 0): Map<string, string> => {
        const changeTokens = new Map<string, string>();
        for (let i = offset; i < inputBoxes.len(); i++) {
            const boxTokens = inputBoxes.get(i).tokens();
            for (let j = 0; j < boxTokens.len(); j++) {
                const token = boxTokens.get(0);
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
            await (
                this.ergoNetwork.getBoxWithToken(
                    this.repoAddress,
                    this.RepoNFTId.to_str()
                )
            )
        )
    }

    /**
     * getting watcher permit transaction
     * @param RSNCount
     */
    getPermit = async (RSNCount: string): Promise<string> => {
        if (await this.watcherHasLocked()) {
            throw new Error("you don't have any RSN");
        }
        const height = await this.ergoNetwork.getHeight();
        const repoBox = await this.getRepoBox();
        const R6 = repoBox.register_value(6);
        if (R6 === undefined) {
            throw new Error("register 6 of repo box is not set");
        }
        const RSNRWTRation = R6.to_i64_str_array()[0];

        const RWTCount = BigInt(RSNCount) / BigInt(R6.to_i64_str_array()[0]);

        const RSNInput = await (
            this.ergoNetwork.getBoxWithToken(
                this.userAddress,
                this.RSN.to_str()
            )
        );

        const users: Array<Uint8Array> | undefined = repoBox.register_value(4)?.to_coll_coll_byte();
        if (users === undefined) {
            throw new Error("Incorrect RepoBox input");
        }
        const repoBoxId = repoBox.box_id().as_bytes();
        users.push(repoBoxId);
        const usersCount: Array<string> | undefined = repoBox.register_value(5)?.to_i64_str_array();
        if (usersCount === undefined) {
            throw new Error("Incorrect RepoBox input");
        }

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
        const testTokenId = wasm.TokenId.from_str(repoBox.box_id().to_str());
        const testTokenAmount = wasm.TokenAmount.from_i64(wasm.I64.from_str("1"));
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
                throw new Error("You don't have enough Erg to make the transaction");
            }
        }

        let totalInputValue = wasm.I64.from_str("0");
        for (let i = 0; i < inputBoxes.len(); i++) {
            totalInputValue = totalInputValue.checked_add(inputBoxes.get(i).value().as_i64());
        }

        const changeTokens = this.inputBoxesTokenMap(inputBoxes, 1);

        const rsnCount = changeTokens.get(this.RSN.to_str());
        if (rsnCount === undefined) {
            throw new Error("You don't have enough RSN");
        }

        const RSNChangeAmount = (BigInt(rsnCount) - BigInt(RSNCount));
        if (RSNChangeAmount < 0) {
            throw new Error("You don't have enough RSN");
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
            testTokenId,
            testTokenAmount,
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
        this.watcherLockState = !this.watcherLockState;
        return signedTx.id().to_str();
    }

    /**
     * checks if watcher has locked RSN or not
     */
    watcherHasLocked = async (): Promise<boolean> => {
        if (this.watcherLockState === undefined) {
            const repoBox = await this.getRepoBox();
            const users = repoBox.register_value(4)?.to_coll_coll_byte();
            if (users === undefined) {
                return false;
            }
            const ans = users.map(async (id) => {
                const wid = uint8ArrayToHex(id);
                try {
                    const box = await (
                        this.ergoNetwork.getBoxWithToken(
                            this.userAddress,
                            wid,
                        )
                    );
                    return true;
                } catch (error) {
                    return false;
                }
            });

            this.watcherLockState = (
                await Promise.all(ans))
                .reduce(
                    (prev, curr) => prev || curr,
                    false
                );
        }

        return this.watcherLockState;
    }
}
