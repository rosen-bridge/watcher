import { loggerFactory } from '../log/Logger';
import express from 'express';
import { AddressBalance } from '../ergo/interfaces';
import { Transaction } from './Transaction';

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
  const nanoErgs = BigInt(reqBody.amount.nanoErgs);
  const tokens = reqBody.amount.tokens.map((token: any) => {
    return {
      tokenId: token.tokenId,
      amount: BigInt(token.amount),
    };
  });

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
    await txInstance.withdrawFromWallet(
      withdrawBody.amount,
      withdrawBody.address
    );
    res.status(200).send('OK');
  } catch (e) {
    logger.warn(`An error occurred while withdrawing from wallet: ${e}`);
    res.status(500).send({ message: e.message });
  }
});

export default withdrawRouter;
