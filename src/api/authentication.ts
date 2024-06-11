import { NextFunction, Request, Response } from 'express';
import { blake2b } from 'blakejs';
import { getConfig } from '../config/config';
import {
  base64ToArrayBuffer,
  uint8ArrayToBase64,
  uint8ArrayToHex,
} from '../utils/utils';

const authenticateKey = (req: Request, res: Response, next: NextFunction) => {
  const api_key: string = req.header('Api-Key')!;
  if (api_key && isValidApiKey(api_key)) {
    next();
  } else {
    res.status(403).send({ message: "Api-Key doesn't exist or it is wrong" });
  }
};

/**
 * check api_key according to old method (pure hash) and salted hash
 * @param api_key
 */
const isValidApiKey = (api_key: string) => {
  const isSaltedHash = getConfig().general.apiKeyHash.includes('$');
  let isValidHash: boolean;
  if (isSaltedHash) {
    const splitSaltedHash = getConfig().general.apiKeyHash.split('$');
    const saltedPass = Buffer.concat([
      base64ToArrayBuffer(splitSaltedHash.at(1)!),
      Buffer.from(api_key),
    ]);
    isValidHash =
      uint8ArrayToBase64(blake2b(saltedPass, undefined, 32)) ===
      splitSaltedHash.at(2);
  } else {
    isValidHash =
      uint8ArrayToHex(blake2b(api_key, undefined, 32)) ===
      getConfig().general.apiKeyHash;
  }
  return isValidHash;
};

export { authenticateKey };
