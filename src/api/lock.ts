import { ErgoNetwork } from "../ergo/network/ergoNetwork";
import * as ergoLib from "ergo-lib-wasm-nodejs";
import { ErgoBox } from "ergo-lib-wasm-nodejs";
import { Contracts } from "./contracts";


const BANK = "9erMHuJYNKQkZCaDs9REhpNaWbhMPbdVmqgM4s7M2GjtQ56j2xG";


const createRepo = async (
    height: number,
    RWTId: string,
    RWTCount: number,
    RSNCount: number,
    users: Array<Uint8Array>,
    //TODO: should check number
    userRWT: Array<string>,
    R7: number) => {

    //TODO: repo nft should be handled correctly

    const RepoNFT = "2222222222222222222222222222222222222222222222222222222222222222";


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
// = async (bank: ErgoBox) =>

export const createRepoBox = async (RSNCount: number) => {
    const ergoNetwork = new ErgoNetwork();
    const height = await ergoNetwork.getHeight();
    const bankAddress = ergoLib.Address.from_base58(BANK);

    const RWTCount = RSNCount / 100;

    //TODO:should handled if is not exist
    const box1 = (await ergoNetwork.getRSNBoxes()).getErgoBox();
    const repoBox = (await (ergoNetwork.getRepoBox())).getErgoBox();
    const oldUsers: Array<Uint8Array> | undefined = repoBox.register_value(4)?.to_coll_coll_byte();
    //TODO: should handled with error handling
    if (oldUsers === undefined) {
        return;
    }
    const repoBoxId = repoBox.box_id().as_bytes();
    const users = oldUsers.push(repoBoxId);
    const oldUsersCount: Array<string> | undefined = repoBox.register_value(5)?.to_i64_str_array();
    //TODO: should handled with error handling
    if (oldUsersCount === undefined) {
        return;
    }
    const userCount = oldUsersCount.push(RWTCount.toString());


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


    const testUser = new Uint8Array([21, 31]);

    const test = await createRepo(10, "2222222222222222222222222222222222222222222222222222222222222222", 10, 10, [testUser], [0], 0)
    console.log("Test is ", test);

}
