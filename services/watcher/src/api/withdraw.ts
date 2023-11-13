import { loggerFactory } from '../log/Logger';
import express from 'express';
import { AddressBalance, TokenData } from '../ergo/interfaces';
import { Transaction } from './Transaction';
import { ERGO_NATIVE_ASSET } from '../config/constants';
import { BoxValue } from 'ergo-lib-wasm-nodejs';

const logger = loggerFactory(import.meta.url);

const withdrawRouter = express.Router();

interface WithdrawBody {
  amount: AddressBalance;
  address: string;
}

/**
 * Casts the request body to a WithdrawBody object
 * @param reqBody
 * @returns WithdrawBody object with BigInts
 */
const castReqBodyToWithdrawBody = (reqBody: any): WithdrawBody => {
  let nanoErgs = 0n;
  const tokens: Array<Omit<TokenData, 'name'>> = [];
  reqBody.tokens.forEach((token: any) => {
    if (token.tokenId === ERGO_NATIVE_ASSET) {
      nanoErgs = BigInt(token.amount);
    } else {
      tokens.push({ tokenId: token.tokenId, amount: BigInt(token.amount) });
    }
  });
  nanoErgs =
    nanoErgs === 0n
      ? BigInt(BoxValue.SAFE_USER_MIN().as_i64().to_str())
      : nanoErgs;
  return {
    amount: {
      nanoErgs,
      tokens,
    },
    address: reqBody.address,
  };
};

/**
 * Api for withdrawing from the watcher wallet
 */
withdrawRouter.post('/', async (req, res) => {
  try {
    const withdrawBody = castReqBodyToWithdrawBody(req.body);
    const txInstance = Transaction.getInstance();
    const txId = await txInstance.withdrawFromWallet(
      withdrawBody.amount,
      withdrawBody.address
    );
    res
      .status(200)
      .contentType('application/json')
      .send(JSON.stringify({ txId, status: 'OK' }));
  } catch (e) {
    logger.warn(`An error occurred while withdrawing from wallet: ${e}`);
    res.status(500).send({ message: e.message });
  }
});

export default withdrawRouter;
