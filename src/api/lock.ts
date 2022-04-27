import { ErgoNetwork } from "../ergo/network/ergoNetwork";
import * as ergoLib from "ergo-lib-wasm-nodejs";
import { ErgoBox } from "ergo-lib-wasm-nodejs";


const BANK = "9erMHuJYNKQkZCaDs9REhpNaWbhMPbdVmqgM4s7M2GjtQ56j2xG";

const lockRSN = async (bank: ErgoBox) => {
    const ergoNetwork = new ErgoNetwork();
    const height = await ergoNetwork.getHeight();
    const bankAddress = ergoLib.Address.from_base58(BANK);

    const outBank = new ergoLib.ErgoBoxCandidateBuilder(
        //TODO: min box value should feel later
        ergoLib.BoxValue.from_i64(ergoLib.I64.from_str("1100000")),
        //TODO: bank address should feel later
        ergoLib.Contract.pay_to_address(bankAddress),
        height
    );
    outBank.add_token(
        bank.tokens().get(0).id(),
        bank.tokens().get(0).amount(),
    );
    const EWRCount = bank.tokens().get(0).amount().as_i64().as_num();
    //TODO:should feel later
    const amountNeed = 2;
    outBank.add_token(
        bank.tokens().get(1).id(),
        ergoLib.TokenAmount.from_i64(ergoLib.I64.from_str((EWRCount - amountNeed).toString()))
    );



}
