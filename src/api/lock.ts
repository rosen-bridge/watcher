import { ErgoNetwork } from "../ergo/network/ergoNetwork";
import * as ergoLib from "ergo-lib-wasm-nodejs";
import {
    Address,
    BoxSelection,
    BoxValue,
    Contract,
    ErgoBoxAssetsDataList, ErgoBoxes,
    TokenAmount,
    TokenId, TxBuilder
} from "ergo-lib-wasm-nodejs";
import { strToUint8Array, uint8ArrayToHex } from "../utils/utils";
import bigInt from "big-integer";
import { PermitBox, RepoBox, RSNBox, WIDBox } from "../objects/ergo";

export class Transaction {

    ergoNetwork: ErgoNetwork;
    RepoNFTId: TokenId;
    RWTTokenId: TokenId;
    RSN: TokenId;
    watcherPermitContract: Contract;
    watcherPermitAddress: Address;
    minBoxValue: BoxValue;
    fee: BoxValue;
    userAddressContract: Contract;
    userAddress: Address;
    userSecret: string;
    repoAddressContract: Contract;
    repoAddress: Address;

    constructor(
        rosenConfig: {
            RSN: string,
            RepoNFT: string,
            RWTId: string,
            minBoxValue: string,
            fee: string,
            watcherPermitAddress: string,
            watcherRepoAddress: string,
        },
        userAddress: string,
        userSecret: string,
    ) {
        this.ergoNetwork = new ErgoNetwork();
        this.RepoNFTId = ergoLib.TokenId.from_str(rosenConfig.RepoNFT);
        this.RWTTokenId = ergoLib.TokenId.from_str(rosenConfig.RWTId);
        this.RSN = ergoLib.TokenId.from_str(rosenConfig.RSN);
        this.watcherPermitAddress = ergoLib.Address.from_base58(rosenConfig.watcherPermitAddress);
        this.watcherPermitContract = ergoLib.Contract.pay_to_address(this.watcherPermitAddress);
        this.minBoxValue = ergoLib.BoxValue.from_i64(ergoLib.I64.from_str(rosenConfig.minBoxValue));
        this.userAddress = ergoLib.Address.from_base58(userAddress);
        this.userAddressContract = ergoLib.Contract.pay_to_address(this.userAddress);
        this.repoAddress = ergoLib.Address.from_base58(rosenConfig.watcherRepoAddress);
        this.repoAddressContract = ergoLib.Contract.pay_to_address(this.repoAddress);
        this.userSecret = userSecret;
        this.fee = ergoLib.BoxValue.from_i64(ergoLib.I64.from_str(rosenConfig.fee));
    }

    private createPermitBox = async (
        height: number,
        RWTCount: string,
        WID: Uint8Array
    ) => {
        const permitBuilder = new ergoLib.ErgoBoxCandidateBuilder(
            this.minBoxValue,
            this.watcherPermitContract,
            height
        );

        const RWTTokenAmount = ergoLib.TokenAmount.from_i64(ergoLib.I64.from_str(RWTCount));

        permitBuilder.add_token(
            this.RWTTokenId,
            RWTTokenAmount
        );

        permitBuilder.set_register_value(4, ergoLib.Constant.from_coll_coll_byte([WID]));
        permitBuilder.set_register_value(5, ergoLib.Constant.from_byte_array(new Uint8Array([0])));

        return permitBuilder.build();

    }

    private createUserBoxCandidate = async (
        height: number,
        address: string,
        amount: string,
        tokenId: TokenId,
        tokenAmount: TokenAmount
    ) => {
        const userBoxBuilder = new ergoLib.ErgoBoxCandidateBuilder(
            ergoLib.BoxValue.from_i64(ergoLib.I64.from_str(amount)),
            this.userAddressContract,
            height
        );
        userBoxBuilder.add_token(
            tokenId,
            tokenAmount
        );

        return userBoxBuilder.build();
    }

    private checkWID = (users: Array<Uint8Array>): Array<Promise<boolean>> => {
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

    private createRepo = async (
        height: number,
        RWTCount: string,
        RSNCount: string,
        users: Array<Uint8Array>,
        userRWT: Array<string>,
        R7: number) => {

        const repoBuilder = new ergoLib.ErgoBoxCandidateBuilder(
            this.minBoxValue,
            this.repoAddressContract,
            height
        );

        repoBuilder.add_token(
            this.RepoNFTId,
            ergoLib.TokenAmount.from_i64(ergoLib.I64.from_str("1")),
        );
        repoBuilder.add_token(
            this.RWTTokenId,
            ergoLib.TokenAmount.from_i64(ergoLib.I64.from_str(RWTCount)),
        );
        repoBuilder.add_token(
            this.RSN,
            ergoLib.TokenAmount.from_i64(ergoLib.I64.from_str(RSNCount)),
        );

        repoBuilder.set_register_value(4, ergoLib.Constant.from_coll_coll_byte(users));
        repoBuilder.set_register_value(5, ergoLib.Constant.from_i64_str_array(userRWT));
        repoBuilder.set_register_value(
            6,
            ergoLib.Constant.from_i64_str_array(
                ["100", "51", "0", "9999"]
            ));
        repoBuilder.set_register_value(7, ergoLib.Constant.from_i32(R7));
        return repoBuilder.build();
    }

    returnPermit = async () => {
        const height = await this.ergoNetwork.getHeight();

        //TODO:Error handling!!
        //TODO: permit box should grab from the network with respect to the value in the register
        const permitBox = new PermitBox(
            await (
                this.ergoNetwork.getBoxWithToken(
                    this.watcherPermitAddress,
                    this.RWTTokenId.to_str(),
                )
            )
        ).getErgoBox();

        //TODO: chaining transaction should be completed
        const repoBox = new RepoBox(
            await (
                this.ergoNetwork.getBoxWithToken(
                    this.repoAddress,
                    this.RepoNFTId.to_str()
                )
            )
        ).getErgoBox();


        const users = repoBox.register_value(4)?.to_coll_coll_byte();
        if (users === undefined) {
            return;
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
            return;
        }

        const widBox = new WIDBox(
            await (
                this.ergoNetwork.getBoxWithToken(
                    this.userAddress,
                    WID,
                )
            )
        ).getErgoBox();

        const usersCount: Array<string> | undefined = repoBox.register_value(5)?.to_i64_str_array();
        if (usersCount === undefined) {
            return "";
        }

        const widIndex = users.map(user => uint8ArrayToHex(user)).indexOf(WID);

        const inputRWTCount = bigInt(usersCount[widIndex]);

        const newUsers = users.slice(0, widIndex).concat(users.slice(widIndex + 1, users.length));
        const newUsersCount = usersCount.slice(0, widIndex).concat(usersCount.slice(widIndex + 1, usersCount.length));

        const RepoRWTCount = repoBox.tokens().get(1).amount().as_i64().checked_add(
            ergoLib.I64.from_str(
                inputRWTCount.toString()
            )
        );
        const RSNTokenCount = repoBox.tokens().get(2).amount().as_i64().checked_add(
            ergoLib.I64.from_str(
                inputRWTCount.times(bigInt("-100")).toString()
            )
        );

        const repoOut = await this.createRepo(
            height,
            RepoRWTCount.to_str(),
            RSNTokenCount.to_str(),
            newUsers,
            newUsersCount,
            widIndex
        );

        const inputBoxes = new ergoLib.ErgoBoxes(repoBox);
        inputBoxes.add(permitBox);
        inputBoxes.add(widBox);

        const inputBoxSelection = new BoxSelection(inputBoxes, new ErgoBoxAssetsDataList());

        const repoValue = repoBox.value();
        const permitValue = permitBox.value();
        const widValue = widBox.value();
        const totalInputValue = repoValue.as_i64().checked_add(permitValue.as_i64().checked_add(widValue.as_i64()));

        const userOutBoxBuilder = new ergoLib.ErgoBoxCandidateBuilder(
            ergoLib.BoxValue.from_i64(
                totalInputValue.checked_add(
                    ergoLib.I64.from_str(
                        "-" + this.fee.as_i64().to_str()
                    ).checked_add(ergoLib.I64.from_str("-" + repoValue.as_i64().to_str()))
                )
            ),
            this.userAddressContract,
            height
        );
        userOutBoxBuilder.add_token(
            this.RSN,
            ergoLib.TokenAmount.from_i64(ergoLib.I64.from_str(
                    inputRWTCount.times(bigInt("100")).toString()
                )
            ),
        );

        const userOutBox = userOutBoxBuilder.build();

        const outputBoxes = new ergoLib.ErgoBoxCandidates(repoOut);
        outputBoxes.add(userOutBox);
        const builder = ergoLib.TxBuilder.new(
            inputBoxSelection,
            outputBoxes,
            height,
            this.minBoxValue,
            this.userAddress,
            this.minBoxValue,
        );
        const signedTx = await this.buildTxAndSign(builder, inputBoxes);
        console.log(signedTx.to_json())
    }

    private buildTxAndSign = async (builder: TxBuilder, inputBoxes: ErgoBoxes): Promise<ergoLib.Transaction> => {
        const tx = builder.build();
        const sks = new ergoLib.SecretKeys();
        const sk = ergoLib.SecretKey.dlog_from_bytes(strToUint8Array(this.userSecret));
        sks.add(sk);
        const wallet = ergoLib.Wallet.from_secrets(sks);
        const ctx = await this.ergoNetwork.getErgoStateContext();
        const tx_data_inputs = ergoLib.ErgoBoxes.from_boxes_json([]);
        return wallet.sign_transaction(ctx, tx, inputBoxes, tx_data_inputs);
    }

    getPermit = async (RSNCount: string): Promise<string> => {

        const height = await this.ergoNetwork.getHeight();

        const RWTCount = bigInt(RSNCount).divide("100");

        const RSNInput = new RSNBox(
            await (
                this.ergoNetwork.getBoxWithToken(
                    this.userAddress,
                    this.RSN.to_str()
                )
            )
        ).getErgoBox();

        const repoBox = new RepoBox(
            await (
                this.ergoNetwork.getBoxWithToken(
                    this.repoAddress,
                    this.RepoNFTId.to_str()
                )
            )
        ).getErgoBox();

        const users: Array<Uint8Array> | undefined = repoBox.register_value(4)?.to_coll_coll_byte();
        if (users === undefined) {
            return "";
        }
        const repoBoxId = repoBox.box_id().as_bytes();
        users.push(repoBoxId);
        const usersCount: Array<string> | undefined = repoBox.register_value(5)?.to_i64_str_array();
        if (usersCount === undefined) {
            return "";
        }

        const count = RWTCount.toString();
        usersCount.push(count);

        const RepoRWTCount = repoBox.tokens().get(1).amount().as_i64().checked_add(
            ergoLib.I64.from_str(
                RWTCount.times(bigInt("-1")).toString()
            )
        );
        const RSNTokenCount = repoBox.tokens().get(0).amount().as_i64().checked_add(
            ergoLib.I64.from_str(
                RWTCount.times(bigInt("100")).toString()
            )
        );

        const repoOut = await this.createRepo(
            height,
            RepoRWTCount.to_str(),
            RSNTokenCount.to_str(),
            users,
            usersCount,
            0
        );

        const permitOut = await this.createPermitBox(height, RWTCount.toString(), repoBox.box_id().as_bytes());

        const testTokenId = ergoLib.TokenId.from_str(repoBox.box_id().to_str());
        const testTokenAmount = ergoLib.TokenAmount.from_i64(ergoLib.I64.from_str("1"));
        const userOut = await this.createUserBoxCandidate(
            height,
            this.userAddress.to_base58(ergoLib.NetworkPrefix.Mainnet),
            this.minBoxValue.as_i64().to_str(),
            testTokenId,
            testTokenAmount
        );

        const inputBoxes = new ergoLib.ErgoBoxes(repoBox);
        inputBoxes.add(RSNInput);
        const outputBoxes = new ergoLib.ErgoBoxCandidates(repoOut);
        outputBoxes.add(permitOut);
        outputBoxes.add(userOut);
        const boxSelector = new ergoLib.SimpleBoxSelector();
        const coveringTokens = new ergoLib.Tokens();

        const RepoNFTToken = new ergoLib.Token(
            this.RepoNFTId,
            ergoLib.TokenAmount.from_i64(ergoLib.I64.from_str("1"))
        );
        coveringTokens.add(RepoNFTToken);

        const RWTToken = new ergoLib.Token(
            this.RWTTokenId,
            repoBox.tokens().get(1).amount(),
        );
        coveringTokens.add(RWTToken);

        const RSNToken = new ergoLib.Token(
            this.RSN,
            ergoLib.TokenAmount.from_i64(RSNTokenCount),
        );
        coveringTokens.add(RSNToken);

        const selection = boxSelector.select(
            inputBoxes,
            ergoLib.BoxValue.from_i64(
                ergoLib.I64.from_str(
                    bigInt(
                        this.minBoxValue.as_i64().to_str()
                    ).times(bigInt("4")).toString()
                )
            ),
            coveringTokens
        );

        const builder = ergoLib.TxBuilder.new(
            selection,
            outputBoxes,
            height,
            this.minBoxValue,
            this.userAddress,
            this.minBoxValue,
        );

        const signedTx = await this.buildTxAndSign(builder, inputBoxes);
        console.log(signedTx.to_json())
        console.log("transaction id is", signedTx.id().to_str());
        // console.log(signedTx.to_json());
        return signedTx.id().to_str();
    }

    watcherHasLocked = async (): Promise<boolean> => {
        const repoBox = new RepoBox(
            await (
                this.ergoNetwork.getBoxWithToken(
                    this.repoAddress,
                    this.RepoNFTId.to_str(),
                )
            )
        ).getErgoBox();
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

        //TODO: should replaced with includes
        return (
            await Promise.all(ans))
            .reduce(
                (prev, curr) => prev || curr,
                false
            );
    }

}



