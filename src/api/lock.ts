import { ErgoNetwork } from "../ergo/network/ergoNetwork";
import * as ergoLib from "ergo-lib-wasm-nodejs";
import { TokenAmount, TokenId } from "ergo-lib-wasm-nodejs";
import { Contracts } from "./contracts";
import { strToUint8Array } from "../utils/utils";


const BANK = "9fEsTTtn2i4sHLmYMJqTLMPvrEQjMgWJxoupr1v2b6nT98Eyvgb";
// const SK = "0e63ebf90bb888862f38b3e1def61707e14ea1775b4003f6f708305550824652";
const SK = "7c390866f06156c5c67b355dac77b6f42eaffeb30e739e65eac2c7e27e6ce1e2";
// const RSN = "25bcbb2381e2569221737f12e06215c59cef8bb1403225084aaf6cf61f500bff";
// const RSN = "34a217f1d2bc0f84607dad61c886de53f1ca919c389f184136f05a0de1d196f2";
// const RepoNFTId = "3688bf4dbfa9e77606446ca0189546621097cee6979e2befc8ef56825ba82580";
const RepoNFTId = "a40b86c663fbbfefa243c9c6ebbc5690fc4e385f15b44c49ba469c91c5af0f48";

// const RWTId = "333661c5deaeb94a7b09c9b7d01e8cd057960a3526e9eb8a46a803cb7e8423f8";
const RWTId = "3c6cb596273a737c3e111c31d3ec868b84676b7bad82f9888ad574b44edef267";

const RSN = "a2a6c892c38d508a659caf857dbe29da4343371e597efd42e40f9bc99099a516";
const watcherPermitAddress = "EE7687i4URb4YuSGSQXPCbAjMfN4dUt5Qx8BqKZJiZhDY8fdnSUwcAGqAsqfn1tW1byXB8nDrgkFzkAFgaaempKxfcPtE1W4ZA6mbFZohS4qMVYjUTQNhcZh3XPmgrKLCHqSJBmZTzkr3DQVzvo1YYSpfwPSHeomitjSFC4iS9N71YR6SbNXYPTFSjTPZTgxs7S2hBTrk7FsYXXe3EnVmnnEA8p1EZ5MBhLWBRgdBLGMuVUwPUeVEHszKmLHfqSkN7bnCAgrCaNbg1gZAPfmxgyLLYZJNS4NqpoYZogancR9hRk2D6FBncc81A3vNMrGWKmVFctX9cJNiFH7yvK1sdJekgVRazZnu9KRbKe61kUZToAfNAWcskHDNgex7t5k61pr2vjENf3L64o7WiaqVGaky5QmFvZuRBdw3fwx4F84zVNrpBjB7AsBnJb7ZCeFBq7rDCaBvZdnM9m2WNVkcZYEkmvgqSg1KV6DAVRWK85dkLaEgf4zyDqV9N6aG7iWExPeAMetGF6k2n89s6TZvtq99TqbW8T7tCLkn4B";

const userAddress = "9hwWcMhrebk4Ew5pBpXaCJ7zuH8eYkY9gRfLjNP3UeBYNDShGCT";


export class Transactions {

    ergoNetwork: ErgoNetwork;

    constructor() {
        this.ergoNetwork = new ErgoNetwork();
    }

    createPermitBox = async (height: number, RWTId: string, RWTCount: number, WID: Uint8Array) => {
        const permitBuilder = new ergoLib.ErgoBoxCandidateBuilder(
            //TODO: minimum box value should added to the config file
            ergoLib.BoxValue.SAFE_USER_MIN(),
            ergoLib.Contract.pay_to_address(ergoLib.Address.from_base58(watcherPermitAddress)),
            height
        );
        const RWTTokenId = ergoLib.TokenId.from_str(RWTId);
        const RWTTokenAmount = ergoLib.TokenAmount.from_i64(ergoLib.I64.from_str(RWTCount.toString()));
        // const RWTToken = new ergoLib.Token(RWTTokenId, RWTTokenAmount);

        permitBuilder.add_token(
            RWTTokenId,
            RWTTokenAmount
        );

        permitBuilder.set_register_value(4, ergoLib.Constant.from_byte_array(WID));
        permitBuilder.set_register_value(5, ergoLib.Constant.from_byte_array(new Uint8Array([0])));

        const permitOut = permitBuilder.build();
        return permitOut;

    }

    createUserBoxCandidate = async (height: number, address: string, amount: number, tokenId: TokenId, tokenAmount: TokenAmount) => {
        const userBoxBuilder = new ergoLib.ErgoBoxCandidateBuilder(
            //TODO: minimum box value should added to the config file
            ergoLib.BoxValue.from_i64(ergoLib.I64.from_str(amount.toString())),
            ergoLib.Contract.pay_to_address(ergoLib.Address.from_base58(watcherPermitAddress)),
            height
        );
        userBoxBuilder.add_token(
            tokenId,
            tokenAmount
        );

        return userBoxBuilder.build();
    }

    createRepo = async (
        height: number,
        RWTId: string,
        RWTCount: number,
        RSNCount: number,
        users: Array<Uint8Array>,
        //TODO: should check number
        userRWT: Array<string>,
        R7: number) => {
        //TODO: repo nft should be handled correctly

        const RepoNFT = RepoNFTId;


        const RWTRepoContract = await Contracts.generateRWTRepoContractAddress();

        const repoBuilder = new ergoLib.ErgoBoxCandidateBuilder(
            //TODO: minimum box value should added to the config file
            ergoLib.BoxValue.SAFE_USER_MIN(),
            ergoLib.Contract.pay_to_address(RWTRepoContract),
            height
        );
        const RepoNFTTokenId = ergoLib.TokenId.from_str(RepoNFT);
        const RepoNFTTokenAmount = ergoLib.TokenAmount.from_i64(ergoLib.I64.from_str("1"));
        const RepoNFTToken = new ergoLib.Token(RepoNFTTokenId, RepoNFTTokenAmount);


        repoBuilder.add_token(
            RepoNFTToken.id(),
            RepoNFTToken.amount(),
        );

        const RWTTokenId = ergoLib.TokenId.from_str(RWTId);
        const RWTTokenAmount = ergoLib.TokenAmount.from_i64(ergoLib.I64.from_str(RWTCount.toString()));
        const RWTToken = new ergoLib.Token(RWTTokenId, RWTTokenAmount);

        repoBuilder.add_token(
            RWTToken.id(),
            RWTToken.amount(),
        );

        repoBuilder.set_register_value(4, ergoLib.Constant.from_coll_coll_byte(users));
        repoBuilder.set_register_value(5, ergoLib.Constant.from_i64_str_array(userRWT));
        repoBuilder.set_register_value(6, ergoLib.Constant.from_i64_str_array([100, 51, 0, 999]));
        repoBuilder.set_register_value(7, ergoLib.Constant.from_i32(R7));

        return repoBuilder.build();

    }

    getPermit = async (RSNCount: number) => {
        const ergoNetwork = new ErgoNetwork();
        const height = await ergoNetwork.getHeight();
        const bankAddress = ergoLib.Address.from_base58(BANK);

        const RWTCount = RSNCount / 100;
        // const RWTCount = RSNCount;

        //TODO:should handled if is not exist
        const RSNBox = (await ergoNetwork.getRSNBoxes()).getErgoBox();
        const repoBox = (await (ergoNetwork.getRepoBox())).getErgoBox();

        //TODO: in case of RSNBox and RepoBox are the same should handled correctly
        const users: Array<Uint8Array> | undefined = repoBox.register_value(4)?.to_coll_coll_byte();
        //TODO: should handled with error handling
        if (users === undefined) {
            return;
        }
        const repoBoxId = repoBox.box_id().as_bytes();
        users.push(repoBoxId);
        const usersCount: Array<string> | undefined = repoBox.register_value(5)?.to_i64_str_array();
        //TODO: should handled with error handling
        if (usersCount === undefined) {
            return;
        }

        const count = RWTCount.toString();
        usersCount.push(count);
        // console.log('test');
        // console.log(repoBox.to_json());
        const RepoRWTCount = repoBox.tokens().get(1).amount().as_i64().checked_add(
            ergoLib.I64.from_str(
                "-" + RWTCount.toString()
            )
        );
        const RSNTokenCount = repoBox.tokens().get(0).amount().as_i64().checked_add(
            ergoLib.I64.from_str(
                (RWTCount * 100).toString()
            )
        );


        // console.log(RSNBox.to_json());
        console.log("***********************************");
        console.log(RepoRWTCount.to_str());
        console.log(RWTCount);

        const repoOut = await this.createRepo(
            height,
            RWTId,
            Number(RepoRWTCount.to_str()),
            Number(RSNTokenCount.to_str()),
            users,
            usersCount,
            0
        );


        // createPermitBox = async (height: number, RWTId: string, RWTCount: number, WID: Uint8Array) => {

        const permitOut = await this.createPermitBox(height, RWTId, RWTCount, repoBox.box_id().as_bytes());
        console.log(permitOut.tokens().get(0).to_json())


        const testTokenId = ergoLib.TokenId.from_str(repoBox.box_id().to_str());
        const testTokenAmount = ergoLib.TokenAmount.from_i64(ergoLib.I64.from_str("1"));
        const userOut = await this.createUserBoxCandidate(height, userAddress, 1000000, testTokenId, testTokenAmount);
        // = async (height: number, address: string, amount: number, tokenId: TokenId, tokenAmount: TokenAmount) => {


        // console.log(repoOut.tokens().get(0).to_json())
        // console.log(repoOut.tokens().get(1).to_json())

        const inputBoxes = new ergoLib.ErgoBoxes(repoBox);
        inputBoxes.add(RSNBox);
        const outputBoxes = new ergoLib.ErgoBoxCandidates(repoOut);
        outputBoxes.add(permitOut);
        outputBoxes.add(userOut);
        const boxSelector = new ergoLib.SimpleBoxSelector();
        const coveringTokens = new ergoLib.Tokens();

        const RepoNFTToken = new ergoLib.Token(
            ergoLib.TokenId.from_str(RepoNFTId),
            ergoLib.TokenAmount.from_i64(ergoLib.I64.from_str("1"))
        );
        coveringTokens.add(RepoNFTToken);

        const RWTToken = new ergoLib.Token(
            ergoLib.TokenId.from_str(RWTId),
            ergoLib.TokenAmount.from_i64(ergoLib.I64.from_str("100000")),
        );

        console.log("#########")
        console.log(RWTCount)
        console.log(RSNTokenCount.to_str())

        coveringTokens.add(RWTToken);

        const RSNToken = new ergoLib.Token(
            ergoLib.TokenId.from_str(RSN),
            ergoLib.TokenAmount.from_i64(RSNTokenCount),
        );

        coveringTokens.add(RSNToken);
        console.log(RSNBox.to_json());
        console.log(repoBox.to_json());
        console.log("test");

        const selection = boxSelector.select(
            inputBoxes,
            ergoLib.BoxValue.from_i64(
                ergoLib.BoxValue.SAFE_USER_MIN().as_i64().checked_add(
                    ergoLib.BoxValue.SAFE_USER_MIN().as_i64().checked_add(ergoLib.BoxValue.SAFE_USER_MIN().as_i64()
                        .checked_add(ergoLib.BoxValue.SAFE_USER_MIN().as_i64()
                        )
                    )
                )
            ),
            coveringTokens
        );

        const builder = ergoLib.TxBuilder.new(
            selection,
            outputBoxes,
            height,
            ergoLib.BoxValue.SAFE_USER_MIN(),
            ergoLib.Address.from_mainnet_str(BANK),
            ergoLib.BoxValue.SAFE_USER_MIN()
        );
        const tx = builder.build();
        console.log("****************************");
        console.log(tx.to_json());
        const sks = new ergoLib.SecretKeys();
        const sk = ergoLib.SecretKey.dlog_from_bytes(strToUint8Array(SK));
        sks.add(sk);
        const wallet = ergoLib.Wallet.from_secrets(sks);
        const ctx = await this.ergoNetwork.getErgoStateContext();
        const tx_data_inputs = ergoLib.ErgoBoxes.from_boxes_json([]);
        const signedTx = wallet.sign_transaction(ctx, tx, inputBoxes, tx_data_inputs);
        // await this.ergoNetwork.sendTx(signedTx.to_json());
        console.log("transaction is sent to the network");
        console.log("transaction id is", signedTx.id().to_str());

        // createRepo = async (
        //     height: number,
        //     RWTId: string,
        //     RWTCount: number,
        //     RSNCount: number,
        //     users: Array<Uint8Array>,
        //     //TODO: should check number
        //     userRWT: Array<string>,
        //     R7: number) => {


        // //TODO: should be completed
        // const RWTId="2222222222222222222222222222222222222222222222222222222222222222";


        // const users=
        // const outBank = new ergoLib.ErgoBoxCandidateBuilder(
        //     //TODO: min box value should feel later
        //     ergoLib.BoxValue.from_i64(ergoLib.I64.from_str("1100000")),
        //     //TODO: bank address should feel later
        //     ergoLib.Contract.pay_to_address(bankAddress),
        //     height
        // );
        // outBank.add_token(
        //     bank.tokens().get(0).id(),
        //     bank.tokens().get(0).amount(),
        // );
        // const EWRCount = bank.tokens().get(0).amount().as_i64().as_num();
        // //TODO:should feel later
        // const amountNeed = 2;
        // outBank.add_token(
        //     bank.tokens().get(1).id(),
        //     ergoLib.TokenAmount.from_i64(ergoLib.I64.from_str((EWRCount - amountNeed).toString()))
        // );

        //
        // const testUser = new Uint8Array([21, 31]);
        //
        // const test = await createRepo(10, "2222222222222222222222222222222222222222222222222222222222222222", 10, 10, [testUser], [0], 0)
        // console.log("Test is ", test);

    }

    initRepoBox = async (RWTCount: number, Factor: number, chainId: string) => {
        // const RSNBox = await this.ergoNetwork.getRSNBoxes();
        const RepoNFT = await this.ergoNetwork.getRepoBox();
        // console.log(RepoNFT.getErgoBox().value().as_i64().to_str());
        // console.log(RSNBox.getErgoBox().tokens().get(0).id().to_str())
        // console.log(RepoNFT.getErgoBox().tokens().get(0).id().to_str())
        const height = await this.ergoNetwork.getHeight();
        const RWTId = RepoNFT.getErgoBox().box_id().to_str();

        const repoOut = await this.createRepo(
            height,
            RWTId,
            RWTCount,
            1,
            [strToUint8Array(chainId)],
            ["0"],
            0
        );

        // console.log(RSNBox.getBoxJson());
        // console.log(RepoNFT.getBoxJson());
        // console.log(repoOut.tokens().get(0).to_json());
        // console.log(repoOut.tokens().get(1).to_json());
        const inputBoxes = new ergoLib.ErgoBoxes(RepoNFT.getErgoBox());
        // inputBoxes.add(RepoNFT.getErgoBox());
        const outputBoxes = new ergoLib.ErgoBoxCandidates(repoOut);
        const boxSelector = new ergoLib.SimpleBoxSelector();
        const coveringTokens = new ergoLib.Tokens();
        // const

        // const  = ergoLib.TokenAmount.from_i64(ergoLib.I64.from_str(RSNCount.toString()));
        // const RSNToken = new ergoLib.Token(
        //     ergoLib.TokenId.from_str(RSN),
        //     ergoLib.TokenAmount.from_i64(ergoLib.I64.from_str("1"))
        // );
        // coveringTokens.add(RSNToken);

        const RepoNFTToken = new ergoLib.Token(
            ergoLib.TokenId.from_str(RepoNFTId),
            ergoLib.TokenAmount.from_i64(ergoLib.I64.from_str("1"))
        );
        // const RWTToken = new ergoLib.Token(
        //     ergoLib.TokenId.from_str(RWTId),
        //     ergoLib.TokenAmount.from_i64(ergoLib.I64.from_str("1"))
        // );
        // coveringTokens.add(RWTToken);
        // ergoLib.BoxValue.from_i64(ergoLib.I64.from_str(.toString()))

        coveringTokens.add(RepoNFTToken);
        const selection = boxSelector.select(
            inputBoxes,
            ergoLib.BoxValue.from_i64(
                ergoLib.BoxValue.SAFE_USER_MIN().as_i64().checked_add(
                    ergoLib.BoxValue.SAFE_USER_MIN().as_i64()
                )
            ),
            coveringTokens
        );

        const builder = ergoLib.TxBuilder.new(
            selection,
            outputBoxes,
            height,
            ergoLib.BoxValue.SAFE_USER_MIN(),
            ergoLib.Address.from_mainnet_str(BANK),
            ergoLib.BoxValue.SAFE_USER_MIN()
        );
        const tx = builder.build();
        const sks = new ergoLib.SecretKeys();
        const sk = ergoLib.SecretKey.dlog_from_bytes(strToUint8Array(SK));
        sks.add(sk);
        const wallet = ergoLib.Wallet.from_secrets(sks);
        const ctx = await this.ergoNetwork.getErgoStateContext();
        const tx_data_inputs = ergoLib.ErgoBoxes.from_boxes_json([]);
        const signedTx = wallet.sign_transaction(ctx, tx, inputBoxes, tx_data_inputs);
        await this.ergoNetwork.sendTx(signedTx.to_json());
        console.log("transaction is sent to the network");
        console.log("transaction id is", signedTx.id().to_str());
    }

}



