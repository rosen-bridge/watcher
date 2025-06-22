import * as wasm from 'ergo-lib-wasm-nodejs';
import { ErgoBox } from 'ergo-lib-wasm-nodejs';
import {
  ChartRecord,
  Observation,
  RevenueChartRecord,
} from '../utils/interfaces';
import { bigIntToUint8Array } from '../utils/utils';
import { ErgoNetwork } from './network/ergoNetwork';
import { ChangeBoxCreationError, NotEnoughFund } from '../errors/errors';
import { blake2b } from 'blakejs';
import { Buffer } from 'buffer';
import { getConfig } from '../config/config';
import { Transaction } from '../api/Transaction';
import { watcherDatabase } from '../init';
import { AddressBalance, TokenData } from './interfaces';
import { RevenueView } from '../database/entities/revenueView';
import { TokenEntity } from '../database/entities/tokenEntity';
import { RevenueEntity } from '../database/entities/revenueEntity';
import {
  ERGO_NATIVE_ASSET,
  ERGO_CHAIN_NAME,
  ERGO_DECIMALS,
} from '../config/constants';
import { PagedItemData } from '../types/items';
import { EventTriggerEntity } from '@rosen-bridge/watcher-data-extractor';
import { ObservationEntity } from '@rosen-bridge/observation-extractor';
import { CallbackLoggerFactory } from '@rosen-bridge/callback-logger';
import { JsonBI } from './network/parser';
import { TokensConfig } from '../config/tokensConfig';

const logger = CallbackLoggerFactory.getInstance().getLogger(import.meta.url);
const txFee = parseInt(getConfig().general.fee);

export const extractBoxes = (boxes: wasm.ErgoBoxes): Array<wasm.ErgoBox> => {
  return Array(boxes.len())
    .fill('')
    .map((item, index) => boxes.get(index));
};
export const extractTokens = (tokens: wasm.Tokens): Array<wasm.Token> => {
  return Array(tokens.len())
    .fill('')
    .map((item, index) => tokens.get(index));
};
export const decodeSerializedBox = (boxSerialized: string) => {
  return wasm.ErgoBox.sigma_parse_bytes(
    new Uint8Array(Buffer.from(boxSerialized, 'base64'))
  );
};
export const boxHaveAsset = (box: ErgoBox, asset: string) => {
  return extractTokens(box.tokens())
    .map((token) => token.id().to_str())
    .includes(asset);
};
/**
 * Returns the biggest bigint
 * @param a
 * @param b
 */
export const bigintMax = (a: bigint, b: bigint) => {
  return a > b ? a : b;
};

export class ErgoUtils {
  /**
   * Creates a change box from the input and output boxesSample
   * if output boxesSample have more assets than the inputs throws an exception
   * if some input assets needs to be burnt throw exception
   * if all input assets were transferred to the outputs returns null
   * @param boxes
   * @param candidates
   * @param height
   * @param secret
   * @param contract change contract if it is needed, unless use the secret's public address as the change address
   */
  static createChangeBox = (
    boxes: wasm.ErgoBoxes,
    candidates: Array<wasm.ErgoBoxCandidate>,
    height: number,
    secret: wasm.SecretKey,
    contract?: wasm.Contract
  ): wasm.ErgoBoxCandidate | null => {
    const processBox = (
      box: wasm.ErgoBox | wasm.ErgoBoxCandidate,
      tokens: { [id: string]: bigint },
      widTokensCount: { [id: string]: bigint },
      sign: number
    ) => {
      extractTokens(box.tokens()).forEach((token) => {
        if (token.id().to_str() === Transaction.watcherWID) {
          widTokensCount[Transaction.watcherWID] +=
            BigInt(token.amount().as_i64().to_str()) * BigInt(sign);
        } else {
          if (!Object.hasOwnProperty.call(tokens, token.id().to_str())) {
            tokens[token.id().to_str()] =
              BigInt(token.amount().as_i64().to_str()) * BigInt(sign);
          } else {
            tokens[token.id().to_str()] +=
              BigInt(token.amount().as_i64().to_str()) * BigInt(sign);
          }
        }
      });
    };
    let value = BigInt(0);
    const tokens: { [id: string]: bigint } = {};
    const widToken = {
      [Transaction.watcherWID!]: 0n,
    };
    extractBoxes(boxes).forEach((box) => {
      value += BigInt(box.value().as_i64().to_str());
      processBox(box, tokens, widToken, 1);
    });
    logger.debug(
      `input value is ${value} and input tokens are [${JsonBI.stringify(
        tokens
      )}]`
    );
    candidates.forEach((candidate) => {
      value -= BigInt(candidate.value().as_i64().to_str());
      processBox(candidate, tokens, widToken, -1);
    });
    logger.debug(
      `remained value is ${value} and remained tokens are [${JsonBI.stringify(
        tokens
      )}]`
    );

    if (
      value > BigInt(txFee + wasm.BoxValue.SAFE_USER_MIN().as_i64().as_num())
    ) {
      const change = new wasm.ErgoBoxCandidateBuilder(
        wasm.BoxValue.from_i64(
          wasm.I64.from_str((value - BigInt(txFee)).toString())
        ),
        contract
          ? contract
          : wasm.Contract.pay_to_address(secret.get_address()),
        height
      );
      [
        ...(widToken[Transaction.watcherWID!] ? Object.entries(widToken) : []),
        ...Object.entries(tokens),
      ].forEach(([token, value]) => {
        if (value > 0) {
          change.add_token(
            wasm.TokenId.from_str(token),
            wasm.TokenAmount.from_i64(wasm.I64.from_str(value.toString()))
          );
        } else if (value < 0) {
          throw new ChangeBoxCreationError(
            `Not enough token [${token}] in the input boxes, require ${
              -1n * value
            } more.`
          );
        }
      });
      return change.build();
    } else if (value < 0) {
      throw new NotEnoughFund();
    } else {
      Object.entries(tokens).forEach(([token, value]) => {
        if (value !== BigInt(0)) {
          throw new ChangeBoxCreationError(
            `Token [${token}] with value ${value} is present in the inputs but absent in the outputs.`
          );
        }
      });
    }
    return null;
  };

  /**
   * Returns number of extra tokens (except allowed tokens) in the boxes
   * @param boxes
   * @param allowedTokens
   */
  static getExtraTokenCount = (
    boxes: wasm.ErgoBoxes,
    allowedTokens: wasm.TokenId[]
  ): number => {
    let extraTokenCount = 0;
    const allowedTokensString = allowedTokens.map((token) => token.to_str());
    extractBoxes(boxes).forEach((box) => {
      extractTokens(box.tokens()).forEach((token) => {
        if (!allowedTokensString.includes(token.id().to_str())) {
          extraTokenCount++;
        }
      });
    });
    return extraTokenCount;
  };

  /**
   * signs the transaction by required secret
   * @param builder
   * @param secret
   * @param inputs
   * @param dataInputs
   */
  static buildTxAndSign = async (
    builder: wasm.TxBuilder,
    secret: wasm.SecretKey,
    inputs: wasm.ErgoBoxes,
    dataInputs: wasm.ErgoBoxes = wasm.ErgoBoxes.from_boxes_json([])
  ) => {
    const tx = builder.build();
    logger.debug(
      `Tx with txId: [${tx
        .id()
        .to_str()}] built successfully, tx json format: [${tx.to_json()}]`
    );

    const secrets = new wasm.SecretKeys();
    secrets.add(secret);
    const wallet = wasm.Wallet.from_secrets(secrets);
    const ctx = await ErgoNetwork.getErgoStateContext();
    return wallet.sign_transaction(ctx, tx, inputs, dataInputs);
  };

  /**
   * Creates the transaction from input, data input and output boxesSample, then signs the created transaction with the secrets
   * @param secret
   * @param boxes inout boxesSample
   * @param candidates output boxesSample
   * @param height current network height
   * @param dataInputs
   * @param changeContract change contract if it is needed, unless use the secret's public address as the change address
   */
  static createAndSignTx = async (
    secret: wasm.SecretKey,
    boxes: wasm.ErgoBoxes,
    candidates: Array<wasm.ErgoBoxCandidate>,
    height: number,
    dataInputs?: wasm.ErgoBoxes,
    changeContract?: wasm.Contract
  ): Promise<wasm.Transaction> => {
    const change = ErgoUtils.createChangeBox(
      boxes,
      candidates,
      height,
      secret,
      changeContract
    );
    const candidateBoxes = new wasm.ErgoBoxCandidates(candidates[0]);
    candidates.slice(1).forEach((item) => candidateBoxes.add(item));
    if (change) {
      candidateBoxes.add(change);
    }
    const boxSelection = new wasm.BoxSelection(
      boxes,
      new wasm.ErgoBoxAssetsDataList()
    );
    const txBuilder = wasm.TxBuilder.new(
      boxSelection,
      candidateBoxes,
      height,
      wasm.BoxValue.from_i64(wasm.I64.from_str(txFee.toString())),
      secret.get_address()
    );
    if (dataInputs) {
      const txDataInputs = new wasm.DataInputs();
      Array(dataInputs.len())
        .fill('')
        .forEach((item, index) =>
          txDataInputs.add(new wasm.DataInput(dataInputs.get(index).box_id()))
        );
      txBuilder.set_data_inputs(txDataInputs);
    }
    return ErgoUtils.buildTxAndSign(
      txBuilder,
      secret,
      boxes,
      dataInputs ? dataInputs : wasm.ErgoBoxes.from_boxes_json([])
    );
  };

  /**
   * Creates commitment from observation information and the watcher WID
   * @param observation
   * @param WID
   */
  static commitmentFromObservation = (
    observation: Observation,
    WID: string
  ): Uint8Array => {
    const content = Buffer.concat([
      Buffer.from(observation.sourceTxId),
      Buffer.from(observation.fromChain),
      Buffer.from(observation.toChain),
      Buffer.from(observation.fromAddress),
      Buffer.from(observation.toAddress),
      bigIntToUint8Array(BigInt(observation.amount)),
      bigIntToUint8Array(BigInt(observation.bridgeFee)),
      bigIntToUint8Array(BigInt(observation.networkFee)),
      Buffer.from(observation.sourceChainTokenId),
      Buffer.from(observation.targetChainTokenId),
      Buffer.from(observation.sourceBlockId),
      bigIntToUint8Array(BigInt(observation.height)),
      Buffer.from(WID, 'hex'),
    ]);
    return blake2b(content, undefined, 32);
  };

  /**
   * Produces the contract hash
   * @param contract
   */
  static contractHash = (contract: wasm.Contract): Buffer => {
    return Buffer.from(
      blake2b(
        Buffer.from(contract.ergo_tree().to_base16_bytes(), 'hex'),
        undefined,
        32
      )
    );
  };

  /**
   * returns the required number of commitments for creating a new event trigger
   * read configs from repoConfig box and uses the repo box to find the total number of registered watchers
   * @param repo
   * @param repoConfig
   */
  static requiredCommitmentCount = (
    repo: wasm.ErgoBox,
    repoConfig: wasm.ErgoBox
  ): bigint => {
    const R5 = repo.register_value(5);
    const configRegister = repoConfig.register_value(4);
    if (!R5 || !configRegister)
      throw new Error(
        'rwtRepo or repoConfig registers is not in a valid format'
      );
    const configs = configRegister.to_i64_str_array();
    const max = BigInt(configs[3]);
    const min = BigInt(configs[2]);
    const percentage = parseInt(configs[1]);
    const watcherCount = Number(R5.to_i64().to_str());
    const formula = min + BigInt(Math.floor((percentage * watcherCount) / 100));
    return (max < formula ? max : formula) + 1n;
  };

  /**
   * Calculate the sum of box values
   * @param boxes
   * @returns sum of box Erg values
   */
  static getBoxValuesSum = (boxes: Array<wasm.ErgoBox>): bigint => {
    return boxes
      .map((box) => BigInt(box.value().as_i64().to_str()))
      .reduce((a, b) => a + b, BigInt(0));
  };

  /**
   * Calculate the sum of box assets
   * @param boxes
   * @returns sum of box assets
   */
  static getBoxAssetsSum = (boxes: Array<wasm.ErgoBox>): Array<TokenData> => {
    const assets = new Map<string, bigint>();
    boxes.forEach((box) => {
      for (let i = 0; i < box.tokens().len(); i++) {
        const token = box.tokens().get(i);
        const id = token.id().to_str();
        const amount = token.amount().as_i64().to_str();
        const assetsAmount = assets.get(id) || 0n;
        assets.set(id, assetsAmount + BigInt(amount));
      }
    });
    return [...assets].map(([tokenId, amount]) => ({ tokenId, amount }));
  };

  /**
   * Extracts the total balance from the serialized boxes
   * @param serializedBoxes to extract balance from
   * @returns AddressBalance of the given boxes
   */
  static extractBalanceFromBoxes = async (
    serializedBoxes: Array<string>
  ): Promise<AddressBalance> => {
    const boxes = serializedBoxes.map((box) => decodeSerializedBox(box));
    const tokens = this.getBoxAssetsSum(boxes);
    return {
      nanoErgs: this.getBoxValuesSum(boxes),
      tokens: tokens,
    };
  };

  /**
   * fill token name and decimals for list of extracted tokens
   * assume token amount is wrapped and should set significant decimals
   * @param tokens
   * @returns
   */
  static fillTokensDetails = async (
    tokens: Array<TokenData>
  ): Promise<Array<TokenData>> => {
    const tokensInfo = await watcherDatabase.getTokenEntity(
      tokens.map((token) => token.tokenId)
    );
    const tokensInfoMap = new Map<string, TokenEntity>();
    tokensInfo.forEach((token) => {
      tokensInfoMap.set(token.tokenId, token);
    });
    return tokens.map((token) => {
      const tokenInfo = tokensInfoMap.get(token.tokenId);
      const name =
        token.tokenId === ERGO_NATIVE_ASSET
          ? ERGO_NATIVE_ASSET
          : tokenInfo?.tokenName;
      const decimals =
        token.tokenId === ERGO_NATIVE_ASSET
          ? ERGO_DECIMALS
          : tokenInfo?.decimals || 0;
      return {
        ...token,
        name: name,
        decimals: decimals,
        isNativeToken: token.tokenId === ERGO_NATIVE_ASSET,
      };
    });
  };

  /**
   * Returns full token data by searching on token map
   * use significant decimals
   * @param tokenId
   * @param chain
   * @returns TokenData
   */
  static tokenDetailByTokenMap = (tokenId: string, chain: string) => {
    const tokenMap = TokensConfig.getInstance().getTokenMap();
    const tokenDetail = tokenMap.search(chain, {
      tokenId,
    });
    let name = 'Unsupported token';
    let decimals = 0;
    let isNativeToken = false;
    if (tokenDetail.length) {
      const significantDecimal = tokenMap.getSignificantDecimals(tokenId);
      name = tokenDetail[0][chain].name;
      decimals = significantDecimal || 0;
      isNativeToken = tokenDetail[0][chain].type === 'native';
    }

    return {
      tokenId: tokenId,
      name: name,
      decimals: decimals,
      isNativeToken,
    };
  };

  /**
   * Returns full token data by checking token details in database and tokenMap
   * use significant decimals
   * @param tokenId
   */
  static tokenDetail = async (tokenId: string) => {
    const tokenInfo = (await watcherDatabase.getTokenEntity([tokenId]))[0];
    if (tokenInfo) {
      return {
        tokenId: tokenId,
        name: tokenInfo.tokenName,
        decimals: tokenInfo.decimals,
        isNativeToken: tokenId == ERGO_NATIVE_ASSET,
      };
    }
    return this.tokenDetailByTokenMap(tokenId, ERGO_CHAIN_NAME);
  };

  /**
   * Fill token info in events and observations
   * @param pagedItems
   * @returns pagedItems with token info
   */
  static fillTokenDetailsInEvents = (
    pagedItems: PagedItemData<EventTriggerEntity | ObservationEntity>
  ) => {
    return {
      ...pagedItems,
      items: pagedItems.items.map((item) => ({
        ...item,
        lockToken: ErgoUtils.tokenDetailByTokenMap(
          item.sourceChainTokenId,
          getConfig().general.networkWatcher
        ),
      })),
    };
  };

  /**
   * Fetches the balance of the watcher UTXOs
   */
  static getWatcherBalance = async (): Promise<AddressBalance> => {
    const UTXOs = await watcherDatabase.getUnspentBoxesByAddress(
      getConfig().general.address
    );
    const serializedUTXOs = UTXOs.map((box) => box.serialized);
    return this.extractBalanceFromBoxes(serializedUTXOs);
  };

  /**
   * Gets permit count of the mentioned address
   * @param RWTId RWT token id
   * @returns permit count
   */
  static getPermitCount = async (RWTId: string): Promise<bigint> => {
    if (!Transaction.watcherWID) return 0n;
    const permitBoxes = await watcherDatabase.getUnspentPermitBoxes(
      Transaction.watcherWID
    );
    const serializedUTXOs = permitBoxes.map((box) => box.boxSerialized);
    const { tokens } = await this.extractBalanceFromBoxes(serializedUTXOs);
    const RWT = tokens.find((token) => token.tokenId === RWTId);
    if (RWT) {
      return RWT.amount;
    }
    return 0n;
  };

  /**
   * Extracts the revenue from the revenue view
   * @param revenues
   */
  static extractRevenueFromView = async (
    revenues: Array<RevenueView>,
    tokens: Array<RevenueEntity>
  ) => {
    const tokenMap = new Map<number, Array<TokenData>>();
    tokens.forEach((token) => {
      if (tokenMap.has(token.permit.id)) {
        tokenMap.get(token.permit.id)?.push({
          tokenId: token.tokenId,
          amount: BigInt(token.amount),
          isNativeToken: token.tokenId === ERGO_NATIVE_ASSET,
        });
      } else {
        tokenMap.set(token.permit.id, [
          {
            tokenId: token.tokenId,
            amount: BigInt(token.amount),
            isNativeToken: token.tokenId === ERGO_NATIVE_ASSET,
          },
        ]);
      }
    });
    return Promise.all(
      revenues.map(async ({ tokenId, ...revenue }) => {
        const rowTokens = tokenMap.get(revenue.id) || [];
        return {
          ...revenue,
          lockToken: this.tokenDetailByTokenMap(tokenId, revenue.fromChain),
          revenues: await ErgoUtils.fillTokensDetails(rowTokens),
        };
      })
    );
  };

  static transformChartData = async (chartData: RevenueChartRecord[]) => {
    const chartMap = new Map<string, Array<ChartRecord>>();
    const labels: Array<string> = [];
    chartData.forEach((record) => {
      const year = Number(record.year);
      const month = Number(record.month) || 1;
      const day = Number(record.day) || 1;
      let timestamp = 0;
      if (!isNaN(year)) {
        timestamp = Math.max(Date.UTC(year, month - 1, day), 0);
      } else {
        timestamp = Number(record.week_number) * 7 * 24 * 60 * 60 * 1000;
      }
      const chartRecord: ChartRecord = {
        label: String(timestamp),
        amount: record.revenue.toString(),
      };
      if (!labels.includes(String(timestamp))) labels.push(String(timestamp));
      const chartRecords = chartMap.get(record.tokenId) || [];
      chartRecords.push(chartRecord);
      chartMap.set(record.tokenId, chartRecords);
    });
    // transform chartMap to json
    const jsonObject: {
      title: Omit<TokenData, 'amount'>;
      data: Array<ChartRecord>;
    }[] = [];
    await Promise.all(
      [...chartMap.entries()].map(async ([tokenId, records]) => {
        const filledRecords = labels.map((timestamp) => {
          const filtered = records.filter((rec) => rec.label === timestamp);
          if (filtered.length) return filtered[0];
          return { label: timestamp, amount: '0' };
        });
        jsonObject.push({
          title: await this.tokenDetail(tokenId),
          data: filledRecords,
        });
      })
    );
    return jsonObject;
  };
}
