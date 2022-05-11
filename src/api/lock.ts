import { ErgoNetwork } from "../ergo/network/ergoNetwork";
import * as ergoLib from "ergo-lib-wasm-nodejs";
import { ErgoBox } from "ergo-lib-wasm-nodejs";
import { Contracts } from "./contracts";
import { strToUint8Array } from "../utils/utils";


const BANK = "9fEsTTtn2i4sHLmYMJqTLMPvrEQjMgWJxoupr1v2b6nT98Eyvgb";
const SK = "0e63ebf90bb888862f38b3e1def61707e14ea1775b4003f6f708305550824652";
const RSN = "25bcbb2381e2569221737f12e06215c59cef8bb1403225084aaf6cf61f500bff";
const RepoNFTId = "3688bf4dbfa9e77606446ca0189546621097cee6979e2befc8ef56825ba82580";

export class Transactions {

    ergoNetwork: ErgoNetwork;

    constructor() {
        this.ergoNetwork = new ErgoNetwork();
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

        const RepoNFT = "3688bf4dbfa9e77606446ca0189546621097cee6979e2befc8ef56825ba82580";


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
        const RWTTokenAmount = ergoLib.TokenAmount.from_i64(ergoLib.I64.from_str(RSNCount.toString()));
        const RWTToken = new ergoLib.Token(RWTTokenId, RWTTokenAmount);

        repoBuilder.add_token(
            RWTToken.id(),
            RWTToken.amount(),
        );

        repoBuilder.set_register_value(4, ergoLib.Constant.from_coll_coll_byte(users));
        repoBuilder.set_register_value(5, ergoLib.Constant.from_i64_str_array(userRWT));
        repoBuilder.set_register_value(6, ergoLib.Constant.from_i64_str_array([100, 51, 0, 999]));
        repoBuilder.set_register_value(7, ergoLib.Constant.from_i32(R7));

        const outRepo = repoBuilder.build();

        return outRepo;


    }

    createRepoBox = async (RSNCount: number) => {
        const ergoNetwork = new ErgoNetwork();
        const height = await ergoNetwork.getHeight();
        const bankAddress = ergoLib.Address.from_base58(BANK);

        const RWTCount = RSNCount / 100;

        //TODO:should handled if is not exist
        const box1 = (await ergoNetwork.getRSNBoxes()).getErgoBox();
        const repoBox = (await (ergoNetwork.getRepoBox())).getErgoBox();
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

        // //TODO: should be completed
        // const RWTId="2222222222222222222222222222222222222222222222222222222222222222";
        // const repoOut=createRepo(height,RWTId,);
        // await createRepo(10,
        //     "2222222222222222222222222222222222222222222222222222222222222222",
        //     10,
        //     10,
        //     [testUser],
        //     [0],
        //     0
        // );


        // createRepo = async (
        //     height: number,
        //     RWTId: string,
        //     RWTCount: number,
        //     RSNCount: number,
        //     users: Array<Uint8Array>,
        //     //TODO: should check number
        //     userRWT: Array<string>,
        //     R7: number) => {


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
        const RSNBox = await this.ergoNetwork.getRSNBoxes();
        const RepoNFT = await this.ergoNetwork.getRepoBox();
        console.log(RepoNFT.getErgoBox().value().as_i64().to_str());

        const height = await this.ergoNetwork.getHeight();
        const RWTId = RSNBox.getErgoBox().box_id().to_str();

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
        const inputBoxes = new ergoLib.ErgoBoxes(RSNBox.getErgoBox());
        inputBoxes.add(RepoNFT.getErgoBox());
        const outputBoxes = new ergoLib.ErgoBoxCandidates(repoOut);
        const box_selector = new ergoLib.SimpleBoxSelector();
        const coveringTokens = new ergoLib.Tokens();
        // const

        // const  = ergoLib.TokenAmount.from_i64(ergoLib.I64.from_str(RSNCount.toString()));
        const RSNToken = new ergoLib.Token(
            ergoLib.TokenId.from_str(RSN),
            ergoLib.TokenAmount.from_i64(ergoLib.I64.from_str("1"))
        );
        coveringTokens.add(RSNToken);

        const RepoNFTToken = new ergoLib.Token(
            ergoLib.TokenId.from_str(RepoNFTId),
            ergoLib.TokenAmount.from_i64(ergoLib.I64.from_str("1"))
        );
        // ergoLib.BoxValue.from_i64(ergoLib.I64.from_str(.toString()))
        coveringTokens.add(RepoNFTToken);
        const selection = box_selector.select(
            inputBoxes,
            ergoLib.BoxValue.from_i64(ergoLib.I64.from_str("11000000")),
            coveringTokens
        );
        // const selection = new ergoLib.BoxSelection(inputBoxes, new ergoLib.ErgoBoxAssetsDataList());
        const builder = ergoLib.TxBuilder.new(
            selection,
            outputBoxes,
            height,
            ergoLib.BoxValue.SAFE_USER_MIN(),
            // ergoLib.BoxValue.from_i64(ergoLib.I64.from_str("2000000")),
            ergoLib.Address.from_mainnet_str(BANK),
            ergoLib.BoxValue.SAFE_USER_MIN()
        );

        const tx = builder.build();
        // console.log(tx.to_json());

        const sks = new ergoLib.SecretKeys();
        const sk = ergoLib.SecretKey.dlog_from_bytes(strToUint8Array(SK));
        sks.add(sk);
        const wallet = ergoLib.Wallet.from_secrets(sks);
        const ctx = await this.ergoNetwork.getErgoStateContext();
        const tx_data_inputs = ergoLib.ErgoBoxes.from_boxes_json([]);
        const signedTx = wallet.sign_transaction(ctx, tx, inputBoxes, tx_data_inputs);
        await this.ergoNetwork.sendTx(signedTx.to_json());
        console.log("transaction is sent to the network");
        console.log(signedTx.to_json());
    }

}



