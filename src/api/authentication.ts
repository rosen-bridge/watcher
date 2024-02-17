import { NextFunction, Request, Response } from 'express';
import { blake2b } from 'blakejs';
import { getConfig } from '../config/config';
import { uint8ArrayToHex } from '../utils/utils';

const authenticateKey = (req: Request, res: Response, next: NextFunction) => {
  const api_key: string = req.header('Api-Key')!;
  if (
    api_key &&
    uint8ArrayToHex(blake2b(api_key, undefined, 32)) ==
      getConfig().general.apiKeyHash
  ) {
    next();
  } else {
    res.status(403).send({ message: "API_KEY doesn't exist or it is wrong" });
  }
};

export { authenticateKey };
