import { ErgoNetwork } from "../ergo/network/ergoNetwork";
import * as ergoLib from "ergo-lib-wasm-nodejs";
import { Address, BoxValue, Contract, TokenAmount, TokenId } from "ergo-lib-wasm-nodejs";
import { strToUint8Array } from "../utils/utils";
import bigInt from "big-integer";

export class Transactions {

    ergoNetwork: ErgoNetwork;
    RepoNFTId: TokenId;
    RWTTokenId: TokenId;
    RSN: TokenId;
    watcherPermitAddress: Contract;
    minBoxValue: BoxValue;
    userAddressContract: Contract;
    userAddress: Address;
    userSecret: string;
    repoAddress: Contract;

    constructor(
        rosenConfig: {
            RSN: string,
            RepoNFT: string,
            RWTId: string,
            minBoxValue: string,
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
        this.watcherPermitAddress = ergoLib.Contract.pay_to_address(ergoLib.Address.from_base58(rosenConfig.watcherPermitAddress));
        this.minBoxValue = ergoLib.BoxValue.from_i64(ergoLib.I64.from_str(rosenConfig.minBoxValue));
        this.userAddressContract = ergoLib.Contract.pay_to_address(ergoLib.Address.from_base58(userAddress));
        this.userAddress = ergoLib.Address.from_base58(userAddress);
        this.repoAddress = ergoLib.Contract.pay_to_address(ergoLib.Address.from_base58(rosenConfig.watcherRepoAddress));
        this.userSecret = userSecret;
    }

    private createPermitBox = async (
        height: number,
        RWTCount: string,
        WID: Uint8Array
    ) => {
        const permitBuilder = new ergoLib.ErgoBoxCandidateBuilder(
            this.minBoxValue,
            this.watcherPermitAddress,
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

    private createRepo = async (
        height: number,
        RWTCount: string,
        RSNCount: string,
        users: Array<Uint8Array>,
        userRWT: Array<string>,
        R7: number) => {

        const repoBuilder = new ergoLib.ErgoBoxCandidateBuilder(
            this.minBoxValue,
            this.repoAddress,
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

    getPermit = async (RSNCount: string) => {

        const ergoNetwork = new ErgoNetwork();
        const height = await ergoNetwork.getHeight();


        const RWTCount = bigInt(RSNCount).divide("100");
        const RSNBox = (await ergoNetwork.getRSNBoxes()).getErgoBox();
        const repoBox = (await (ergoNetwork.getRepoBox())).getErgoBox();
        const users: Array<Uint8Array> | undefined = repoBox.register_value(4)?.to_coll_coll_byte();
        if (users === undefined) {
            return;
        }
        const repoBoxId = repoBox.box_id().as_bytes();
        users.push(repoBoxId);
        const usersCount: Array<string> | undefined = repoBox.register_value(5)?.to_i64_str_array();
        if (usersCount === undefined) {
            return;
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
        inputBoxes.add(RSNBox);
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
        const tx = builder.build();
        const sks = new ergoLib.SecretKeys();
        const sk = ergoLib.SecretKey.dlog_from_bytes(strToUint8Array(this.userSecret));
        sks.add(sk);
        const wallet = ergoLib.Wallet.from_secrets(sks);
        const ctx = await this.ergoNetwork.getErgoStateContext();
        const tx_data_inputs = ergoLib.ErgoBoxes.from_boxes_json([]);
        const signedTx = wallet.sign_transaction(ctx, tx, inputBoxes, tx_data_inputs);
        // await this.ergoNetwork.sendTx(signedTx.to_json());
        console.log("transaction is sent to the network");
        console.log("transaction id is", signedTx.id().to_str());

    }

}



