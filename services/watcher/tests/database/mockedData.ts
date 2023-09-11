import { Commitment } from '../../src/utils/interfaces';
import {
  CommitmentEntity,
  EventTriggerEntity,
  PermitEntity,
} from '@rosen-bridge/watcher-data-extractor';
import { BoxEntity } from '@rosen-bridge/address-extractor';
import { ObservationEntity } from '@rosen-bridge/observation-extractor';
import {
  ObservationStatusEntity,
  TxStatus,
} from '../../src/database/entities/observationStatusEntity';
import { BlockEntity } from '@rosen-bridge/scanner';
import { PROCEED } from '@rosen-bridge/scanner/dist/entities/blockEntity';
import * as Constants from '../../src/config/constants';
import { TokenEntity } from '../../src/database/entities/tokenEntity';
import { RevenueEntity } from '../../src/database/entities/revenueEntity';
import { firstPermit, secondPermit } from '../ergo/statistics/mockUtils';

export const ergoBlockEntity = new BlockEntity();
ergoBlockEntity.scanner = Constants.ERGO_WATCHER;
ergoBlockEntity.id = 1;
ergoBlockEntity.hash = 'blockHash';
ergoBlockEntity.height = 1111;
ergoBlockEntity.parentHash = 'parentHash';
ergoBlockEntity.status = PROCEED;
ergoBlockEntity.timestamp = 123;

export const cardanoBlockEntity = new BlockEntity();
cardanoBlockEntity.scanner = Constants.CARDANO_WATCHER;
cardanoBlockEntity.id = 2;
cardanoBlockEntity.hash = 'blockHash2';
cardanoBlockEntity.height = 2222;
cardanoBlockEntity.parentHash = 'parentHash2';
cardanoBlockEntity.status = PROCEED;
cardanoBlockEntity.timestamp = 123456789;

export const firstCommitment: Commitment = {
  WID: 'f875d3b916e56056968d02018133d1c122764d5c70538e70e56199f431e95e9b',
  commitment:
    'c0666e24aa83e38b3955aae906140bda7f2e1974aca897c28962e7eaebd84026',
  eventId: 'ab59962c20f57d9d59e95f5170ccb3472df4279ad4967e51ba8be9ba75144c7b',
  boxId: '1ab9da11fc216660e974842cc3b7705e62ebb9e0bf5ff78e53f9cd40abadd117',
  rwtCount: '1',
};
export const secondCommitment: Commitment = {
  WID: 'ecbde212e49df0e8f65dbaba5f59a6760a8f4c58a3d3451bad68b72ee3588703',
  commitment:
    '45891bf7173066ada6f83dc1bfcf2bf0c53ad90f5e4a5778781c82ad68f822e1',
  eventId: '2f4a12a39d3c925c0776131eded109e8430d958cd3cd0fcff13c73f49c57085f',
  boxId: '43d0ead059054f29ca9c831c93613e1ca98e8fbbc8b166c4fa24120a9d489824',
  rwtCount: '1',
};
export const thirdCommitment: Commitment = {
  WID: 'ecbde212e49df0e8f65dbaba5f59a6760a8f4c58a3d3451bad68b72ee3588703',
  commitment:
    'f0fc04ceea089b372c6e312f974be9be0ec8a9fa3568a0a6c155cb7d535186c7',
  eventId: 'ab59962c20f57d9d59e95f5170ccb3472df4279ad4967e51ba8be9ba75144c7b',
  boxId: 'a18dc1f812aa156037c47db5bd7fc9ef85646c97a1abb76b30045b8e5f7e31e2',
  rwtCount: '1',
};
export const commitmentEntity = new CommitmentEntity();
commitmentEntity.commitment = 'commitment';
commitmentEntity.boxId = 'boxId';
commitmentEntity.WID = 'WID';
commitmentEntity.eventId = 'eventId';
commitmentEntity.block = 'block';
commitmentEntity.extractor = 'extractor';
commitmentEntity.height = 105;
commitmentEntity.boxSerialized = '222';
commitmentEntity.txId = 'txId222';

export const spentCommitmentEntityOfWID = new CommitmentEntity();
spentCommitmentEntityOfWID.commitment = 'commitment3';
spentCommitmentEntityOfWID.boxId = 'boxId3';
spentCommitmentEntityOfWID.WID = 'WID';
spentCommitmentEntityOfWID.eventId = 'eventId3ofWID';
spentCommitmentEntityOfWID.block = 'block';
spentCommitmentEntityOfWID.extractor = 'extractor';
spentCommitmentEntityOfWID.height = 105;
spentCommitmentEntityOfWID.spendHeight = 110;
spentCommitmentEntityOfWID.boxSerialized = '2223';
spentCommitmentEntityOfWID.txId = 'txId2223';

export const spentCommitmentEntity = new CommitmentEntity();
spentCommitmentEntity.commitment = 'commitment';
spentCommitmentEntity.boxId = 'boxId2';
spentCommitmentEntity.WID = 'WID2';
spentCommitmentEntity.eventId = 'eventId';
spentCommitmentEntity.spendBlock = 'spendBlockHash';
spentCommitmentEntity.block = 'block2';
spentCommitmentEntity.extractor = 'extractor';
spentCommitmentEntity.height = 100;
spentCommitmentEntity.spendHeight = 110;
spentCommitmentEntity.boxSerialized = '222';
spentCommitmentEntity.txId = 'txId222';

export const permitEntity = new PermitEntity();
permitEntity.WID = 'WID';
permitEntity.block = 'blockID';
permitEntity.height = 100;
permitEntity.extractor = 'extractor';
permitEntity.boxId = 'boxId';
permitEntity.boxSerialized =
  '4JFDEBMEAAQABAQEAAQCBAAOIKWZu5SyMPjTrJSFarJMMbI1q0k9NBUJcQKRbGAPu/lpBAQEAAQABAABAQQCBAAEAAQADiAlLna8Y7mrm00/ZhS6SaI5OFo/wqVFsrb+zFCE1sKy9gUCAQHYB9YBsqVzAADWAoyy22MIp3MBAAHWA661tKVzArGl2QEDY5Gx22MIcgNzA9kBA2Ou22MIcgPZAQVNDpOMcgUBcgLWBOTGpwQa1gWypXMEANYG22MIcgXWB65yBtkBB00Ok4xyBwFyApWTjLLbYwhyAXMFAAFzBtGWgwMB73IDk4yy22MIsqRzBwBzCAABsnIEcwkAlXIHloMCAZOMsnIGcwoAAXICk8JyBcKncwvYAdYIwqfRloMFAe9yA5PCcgFyCJPkxnIBBBpyBJOMsttjCLKkcwwAcw0AAbJyBHMOAJVyB9gB1gmycgZzDwCWgwcBk4xyCQFyApPLwnIFcxDmxnIFBRrmxnIFBg6T5MZyBQcOy3IIk+TGcgUEGnIEk4xyCQJzEXMSg409AY5bArpymtNkhnYZ0qi5/xQ4GQwUl5oSqgoknplhlPB0j04CGgEg6nBM+OG41ADB3w+3C5REC0ZdGcNoShXSZQQdxBkrdqcOAQCxOUv5J/07IIrBwF3p+WQnGKX2r1GQ6VhYtAvGgeH+dAA=';
permitEntity.txId = 'txId';

export const spentPermitEntity = new PermitEntity();
spentPermitEntity.WID = 'WID';
spentPermitEntity.block = 'blockID2';
spentPermitEntity.height = 100;
spentPermitEntity.extractor = 'extractor';
spentPermitEntity.boxId = 'boxId2';
spentPermitEntity.boxSerialized =
  '4JFDEBMEAAQABAQEAAQCBAAOIKWZu5SyMPjTrJSFarJMMbI1q0k9NBUJcQKRbGAPu/lpBAQEAAQABAABAQQCBAAEAAQADiAlLna8Y7mrm00/ZhS6SaI5OFo/wqVFsrb+zFCE1sKy9gUCAQHYB9YBsqVzAADWAoyy22MIp3MBAAHWA661tKVzArGl2QEDY5Gx22MIcgNzA9kBA2Ou22MIcgPZAQVNDpOMcgUBcgLWBOTGpwQa1gWypXMEANYG22MIcgXWB65yBtkBB00Ok4xyBwFyApWTjLLbYwhyAXMFAAFzBtGWgwMB73IDk4yy22MIsqRzBwBzCAABsnIEcwkAlXIHloMCAZOMsnIGcwoAAXICk8JyBcKncwvYAdYIwqfRloMFAe9yA5PCcgFyCJPkxnIBBBpyBJOMsttjCLKkcwwAcw0AAbJyBHMOAJVyB9gB1gmycgZzDwCWgwcBk4xyCQFyApPLwnIFcxDmxnIFBRrmxnIFBg6T5MZyBQcOy3IIk+TGcgUEGnIEk4xyCQJzEXMSg409AY5bArpymtNkhnYZ0qi5/xQ4GQwUl5oSqgoknplhlPB0j04CGgEg6nBM+OG41ADB3w+3C5REC0ZdGcNoShXSZQQdxBkrdqcOAQCxOUv5J/07IIrBwF3p+WQnGKX2r1GQ6VhYtAvGgeH+dAA=';
spentPermitEntity.spendBlock = 'blockHash2';
spentPermitEntity.spendHeight = 110;
spentPermitEntity.txId = 'txId2';

export const plainBox = new BoxEntity();
plainBox.address = '9eYicprScbobMdmWYRHwbYiM3g19EQ3iAK24FconvXFVfaEooVH';
plainBox.createBlock = 'blockID';
plainBox.creationHeight = 100;
plainBox.extractor = Constants.ADDRESS_EXTRACTOR_NAME;
plainBox.boxId = 'boxId';
plainBox.serialized =
  '4JFDAAjNA6/nE35QL09xxfyBlz5Ab8mVjg38uMAXUIzi9gNqo6UP6848AYROPPRLMYG0ysvMv3WW00H0EUfXPa9LVl7KrJg6uiUIrbwBAHuYkTd1b0VCBfANI9wUXfe48u5Dx0lstbC6MR+NULUcAQ==';

export const spentPlainBox = new BoxEntity();
spentPlainBox.address = 'address';
spentPlainBox.createBlock = 'blockID';
spentPlainBox.creationHeight = 100;
spentPlainBox.extractor = Constants.ADDRESS_EXTRACTOR_NAME;
spentPlainBox.boxId = 'boxId2';
spentPlainBox.serialized = 'box2';
spentPlainBox.spendBlock = 'blockHash';

export const addressValidBox = new BoxEntity();
addressValidBox.address = '9eYicprScbobMdmWYRHwbYiM3g19EQ3iAK24FconvXFVfaEooVH';
addressValidBox.createBlock = 'blockID';
addressValidBox.creationHeight = 100;
addressValidBox.extractor = Constants.ADDRESS_EXTRACTOR_NAME;
addressValidBox.boxId = 'boxId3';
addressValidBox.serialized =
  'gLL19gYACM0Dr+cTflAvT3HF/IGXPkBvyZWODfy4wBdQjOL2A2qjpQ/RjT0BBQ8FSMAPxKAwLilT3j+WfLGMfLWkxSaxY7/kZwqSai8BAJVusRG2h5VtH5w8R7TSrHzuQbd2cO/foKTfUEvEDpbqAg==';

export const validBox0Token = {
  tokenId: '844e3cf44b3181b4cacbccbf7596d341f41147d73daf4b565ecaac983aba2508',
  amount: 24109n,
  name: 'RSN',
};

export const validBox1Token = {
  tokenId: '050f0548c00fc4a0302e2953de3f967cb18c7cb5a4c526b163bfe4670a926a2f',
  amount: 1n,
  name: 'Test',
};

export const validTwoBoxErgAmount = {
  amount: 1861100000,
  tokenId: 'erg',
  name: 'Ergo',
};

export const eventTriggerEntity = new EventTriggerEntity();
eventTriggerEntity.sourceTxId = 'txId';
eventTriggerEntity.block = 'blockID';
eventTriggerEntity.height = 100;
eventTriggerEntity.extractor = 'extractor';
eventTriggerEntity.boxId = 'boxId';
eventTriggerEntity.boxSerialized = 'box';
eventTriggerEntity.amount = '100';
eventTriggerEntity.networkFee = '1000';
eventTriggerEntity.bridgeFee = '200';
eventTriggerEntity.fromAddress = 'fromAddressStar';
eventTriggerEntity.toAddress = 'toAddress';
eventTriggerEntity.fromChain = 'fromChain';
eventTriggerEntity.toChain = 'toChain';
eventTriggerEntity.sourceChainTokenId = 'tokenId2';
eventTriggerEntity.targetChainTokenId = 'targetTokenId';
eventTriggerEntity.WIDs = '1,2,3';
eventTriggerEntity.sourceBlockId = 'block';
eventTriggerEntity.sourceChainHeight = 123456;
eventTriggerEntity.eventId =
  'ab59962c20f57d9d59e95f5170ccb3472df4279ad4967e51ba8be9ba75144c7b';
eventTriggerEntity.txId = 'txId';

export const newEventTriggerEntity = new EventTriggerEntity();
newEventTriggerEntity.sourceTxId = 'txId2';
newEventTriggerEntity.block = 'blockID2';
newEventTriggerEntity.height = 100;
newEventTriggerEntity.extractor = 'extractor';
newEventTriggerEntity.boxId = 'boxId2';
newEventTriggerEntity.boxSerialized = 'box2';
newEventTriggerEntity.amount = '100';
newEventTriggerEntity.networkFee = '1000';
newEventTriggerEntity.bridgeFee = '200';
newEventTriggerEntity.fromAddress = 'fromAddress';
newEventTriggerEntity.toAddress = 'toAddressStar';
newEventTriggerEntity.fromChain = 'fromChain';
newEventTriggerEntity.toChain = 'toChain';
newEventTriggerEntity.sourceChainTokenId = 'tokenId';
newEventTriggerEntity.targetChainTokenId = 'targetTokenId';
newEventTriggerEntity.WIDs = '1,2,3';
newEventTriggerEntity.sourceBlockId = 'block';
newEventTriggerEntity.sourceChainHeight = 123457;
newEventTriggerEntity.eventId =
  'ab59962c20f57d9d59e95f5170ccb3472df4279ad4967e51ba8be9ba75144c7b';
newEventTriggerEntity.txId = 'createTxId2';
newEventTriggerEntity.spendTxId = 'txId2';

export const observationEntity1 = new ObservationEntity();
observationEntity1.height = 1;
observationEntity1.amount = '10';
observationEntity1.extractor = 'observation-extractor';
observationEntity1.bridgeFee = '100';
observationEntity1.fromAddress = 'fromAddress';
observationEntity1.block = 'blockHash';
observationEntity1.fromChain = 'ergo';
observationEntity1.networkFee = '1000';
observationEntity1.sourceBlockId = 'block';
observationEntity1.sourceTxId = 'txId';
observationEntity1.sourceChainTokenId = 'sourceToken';
observationEntity1.toAddress = 'addr1';
observationEntity1.targetChainTokenId = 'targetToken';
observationEntity1.toChain = 'cardano';
observationEntity1.requestId = 'reqId2';

export const observationEntity2 = new ObservationEntity();
observationEntity2.height = 1;
observationEntity2.amount = '10';
observationEntity2.extractor = 'observation-extractor';
observationEntity2.bridgeFee = '100';
observationEntity2.fromAddress = 'fromAddress';
observationEntity2.block = 'hash';
observationEntity2.fromChain = 'ergo';
observationEntity2.networkFee = '1000';
observationEntity2.sourceBlockId = 'block';
observationEntity2.sourceTxId = 'txId';
observationEntity2.sourceChainTokenId = 'sourceToken';
observationEntity2.toAddress = 'addr1';
observationEntity2.targetChainTokenId = 'targetToken';
observationEntity2.toChain = 'cardano';
observationEntity2.requestId = 'reqId1';

export const observationEntity3 = new ObservationEntity();
observationEntity3.height = 3;
observationEntity3.amount = '44000';
observationEntity3.extractor = 'observation-extractor';
observationEntity3.bridgeFee = '300';
observationEntity3.fromAddress = 'fromAddress';
observationEntity3.block = 'hash';
observationEntity3.fromChain = 'ergo';
observationEntity3.networkFee = '1000';
observationEntity3.sourceBlockId = 'block';
observationEntity3.sourceTxId = 'txId3';
observationEntity3.sourceChainTokenId = 'sourceToken';
observationEntity3.toAddress = 'addr3';
observationEntity3.targetChainTokenId = 'targetToken';
observationEntity3.toChain = 'cardano';
observationEntity3.requestId = 'reqId3';

export const observationEntity4 = new ObservationEntity();
observationEntity4.height = 10;
observationEntity4.amount = '5';
observationEntity4.extractor = 'observation-extractor';
observationEntity4.bridgeFee = '100';
observationEntity4.fromAddress = 'fromAddress4';
observationEntity4.block = 'hash';
observationEntity4.fromChain = 'ergo';
observationEntity4.networkFee = '1000';
observationEntity4.sourceBlockId = 'block';
observationEntity4.sourceTxId = 'txId4';
observationEntity4.sourceChainTokenId = 'sourceToken4';
observationEntity4.toAddress = 'addr4';
observationEntity4.targetChainTokenId = 'targetToken';
observationEntity4.toChain = 'cardano';
observationEntity4.requestId = 'reqId4';

export const revenue1 = new RevenueEntity();
revenue1.tokenId =
  '3c6cb596273a737c3e111c31d3ec868b84676b7bad82f9888ad574b44edef267';
revenue1.amount = '10';
revenue1.permit = secondPermit;

export const revenue2 = new RevenueEntity();
revenue2.tokenId =
  '0034c44f0c7a38f833190d44125ff9b3a0dd9dbb89138160182a930bc521db95';
revenue2.amount = '10';
revenue2.permit = secondPermit;

export const revenue3 = new RevenueEntity();
revenue3.tokenId =
  '8e5b02ba729ad364867619d2a8b9ff1438190c14979a12aa0a249e996194f074';
revenue3.amount = '9999';
revenue3.permit = permitEntity;

export const revenue4 = new RevenueEntity();
revenue4.tokenId =
  '3c6cb596273a737c3e111c31d3ec868b84676b7bad82f9888ad574b44edef267';
revenue4.amount = '1';
revenue4.permit = firstPermit;

export const observationStatusTimedOut = new ObservationStatusEntity();
observationStatusTimedOut.status = TxStatus.TIMED_OUT;
export const observationStatusNotCommitted = new ObservationStatusEntity();
observationStatusNotCommitted.status = TxStatus.NOT_COMMITTED;
export const observationStatusCommitted = new ObservationStatusEntity();
observationStatusCommitted.status = TxStatus.COMMITTED;
export const observationStatusRevealed = new ObservationStatusEntity();
observationStatusRevealed.status = TxStatus.REVEALED;

export const unspentCommitment = new CommitmentEntity();
export const unspentCommitmentDuplicate = new CommitmentEntity();
export const unspentCommitment2 = new CommitmentEntity();
export const redeemedCommitment = new CommitmentEntity();
unspentCommitment.WID = 'WID1';
unspentCommitment.txId = 'txId1';
unspentCommitmentDuplicate.WID = unspentCommitment.WID;
unspentCommitmentDuplicate.txId = unspentCommitment.txId;
unspentCommitment2.WID = 'WID2';
unspentCommitment2.txId = 'txId2';
redeemedCommitment.WID = 'WID3';
redeemedCommitment.txId = 'txId3';
redeemedCommitment.spendBlock = 'hash';

const eventTrigger = new EventTriggerEntity();
eventTrigger.id = 1;
eventTrigger.height = 111;

export const tokenRecord = new TokenEntity();
tokenRecord.tokenId = 'tokenId';
tokenRecord.tokenName = 'tokenName';

export const validToken1Record = new TokenEntity();
validToken1Record.tokenId =
  '844e3cf44b3181b4cacbccbf7596d341f41147d73daf4b565ecaac983aba2508';
validToken1Record.tokenName = 'RSN';

export const validToken2Record = new TokenEntity();
validToken2Record.tokenId =
  '050f0548c00fc4a0302e2953de3f967cb18c7cb5a4c526b163bfe4670a926a2f';
validToken2Record.tokenName = 'Test';

export const commitmentTxJson = {
  id: '555f7d54e7073f3ad6f0a587bf8c4f748e9a82b0868362b12a28854de968ea48',
  blockId: 'd00a388e2929e9930485c119c9b2d93ef8429f8909c295dec7946fcbe5c0eeae',
  inclusionHeight: 249264,
  timestamp: 1657975583651,
  index: 3,
  globalIndex: 262251,
  numConfirmations: 82282,
  inputs: [
    {
      boxId: 'a1314c434472c11bbc6b81da8f0bd7c857065762a0f13b64e067b8f7ad0a4769',
      value: 1100000,
      index: 0,
      spendingProof: {
        proofBytes: '',
        extension: {},
      },
      outputBlockId:
        'd00a388e2929e9930485c119c9b2d93ef8429f8909c295dec7946fcbe5c0eeae',
      outputTransactionId:
        '52d1c79bbf8a3137c56cc18410b41be931e95e2ce71f45864a58e1566e9b700a',
      outputIndex: 0,
      outputGlobalIndex: 539660,
      outputCreatedAt: 249262,
      outputSettledAt: 249264,
      ergoTree:
        '10130400040004040400040204000e20a40b86c663fbbfefa243c9c6ebbc5690fc4e385f15b44c49ba469c91c5af0f480404040004000400010104020400040004000e205977b8061ddad79d59af7c01d896bb848cdac3d7ff40478aa78eb3eec50065dc05020101d807d601b2a5730000d6028cb2db6308a773010001d603aeb5b4a57302b1a5d901036391b1db630872037303d9010363aedb63087203d901054d0e938c7205017202d604e4c6a7041ad605b2a5730400d606db63087205d607ae7206d901074d0e938c720701720295938cb2db63087201730500017306d196830301ef7203938cb2db6308b2a473070073080001b2720473090095720796830201938cb27206730a0001720293c27205c2a7730bd801d608c2a7d196830501ef720393c27201720893e4c67201041a7204938cb2db6308b2a4730c00730d0001b27204730e00957207d801d609b27206730f0096830701938c720901720293cbc272057310e6c67205051ae6c67205060e93e4c67205070ecb720893e4c67205041a7204938c72090273117312',
      address:
        'EE7687i4URb4YuSGSQXPCbAjMfN4dUt5Qx8BqKZJiZhDY8fdnSUwcAGqAsqfn1tW1byXB8nDrgkFzkAFgaaempKxfcPtDzAbnu9QfknzmtfnLYHdxPPg7Qtjy7jK5yUpPQ2M4Ps3h5kH57xWDJxcKviEMY11rQnxATjTKTQgGtfzsAPpqsUyT2ZpVYsFzUGJ4nSj4WaDZSU1Hovv6dPkSTArLQSjp38wE72ae6hbNJwXGkqgfBtdVXcZVtnqevw9xUNcE6i942CQ9hVMfbdRobnsaLgsDLQomsh8jLMXqkMde5qH2vGBUqnLKgjxCZaa7vStpPXT5EuzLn9napGwUcbJjgRk69FsRSfCrcydZbYxw4Gnh6ZB9at2USpwL1HdVkHVh8M6Kbw6ppRfeG4JeFsUw33H4sSRk6UPqfuFcRUf7Cec2vmPezXTPT7CXQqEeCjxmWXqfyEQUfnCwpiH5fQ9A8CQ3jTyFhxBTpoGDdtiVCmhqhKxjh9M7gcjpr1dUjGMCWxjir94ejfq24XQrSscrZuUT5NVHTWAkzQ',
      assets: [
        {
          tokenId:
            '497287b9a1eff643791277744a74b7d598b834dc613f2ebc972e33767c61ac2b',
          index: 0,
          amount: 99,
          name: 'RWT',
          decimals: 0,
          type: 'EIP-004',
        },
      ],
      additionalRegisters: {
        R4: {
          serializedValue:
            '1a0120064c58ea394d41fada074a3c560a132467adf4ca1512c409c014c625ca285e9c',
          sigmaType: 'Coll[Coll[SByte]]',
          renderedValue:
            '[064c58ea394d41fada074a3c560a132467adf4ca1512c409c014c625ca285e9c]',
        },
        R5: {
          serializedValue: '0e0100',
          sigmaType: 'Coll[SByte]',
          renderedValue: '00',
        },
      },
    },
    {
      boxId: '5d11ae9f6bfd73c35ebc821f8fae9dd39bb96dcc9b493ef637321e37e00825a2',
      value: 5600000,
      index: 1,
      spendingProof: {
        proofBytes:
          '46d3142a06ba2031e6c6d889605cbb6175823f80cd3afdf9b69aa3da8f011322b4109f03220812c74232113daa64ae4183d88ab87404f77b',
        extension: {},
      },
      outputBlockId:
        'd00a388e2929e9930485c119c9b2d93ef8429f8909c295dec7946fcbe5c0eeae',
      outputTransactionId:
        '52d1c79bbf8a3137c56cc18410b41be931e95e2ce71f45864a58e1566e9b700a',
      outputIndex: 2,
      outputGlobalIndex: 539662,
      outputCreatedAt: 249262,
      outputSettledAt: 249264,
      ergoTree:
        '0008cd028bcc85fa22006fa13767ab00af28ae0b2389d576fb59cfd0e46865e0449eeb8a',
      address: '9fadVRGYyiSBCgD7QtZU13BfGoDyTQ1oX918P8py22MJuMEwSuo',
      assets: [
        {
          tokenId:
            '064c58ea394d41fada074a3c560a132467adf4ca1512c409c014c625ca285e9c',
          index: 0,
          amount: 1,
          name: null,
          decimals: null,
          type: null,
        },
        {
          tokenId:
            'a2a6c892c38d508a659caf857dbe29da4343371e597efd42e40f9bc99099a516',
          index: 1,
          amount: 9000,
          name: 'RSN',
          decimals: 0,
          type: 'EIP-004',
        },
      ],
      additionalRegisters: {},
    },
  ],
  dataInputs: [],
  outputs: [
    {
      boxId: '127b8ba5bcb44033355161580632c15cdd26fbc73b578ee5ae9ed1cb4fde4c9f',
      transactionId:
        '555f7d54e7073f3ad6f0a587bf8c4f748e9a82b0868362b12a28854de968ea48',
      blockId:
        'd00a388e2929e9930485c119c9b2d93ef8429f8909c295dec7946fcbe5c0eeae',
      value: 1100000,
      index: 0,
      globalIndex: 539664,
      creationHeight: 249262,
      settlementHeight: 249264,
      ergoTree:
        '10130400040004040400040204000e20a40b86c663fbbfefa243c9c6ebbc5690fc4e385f15b44c49ba469c91c5af0f480404040004000400010104020400040004000e205977b8061ddad79d59af7c01d896bb848cdac3d7ff40478aa78eb3eec50065dc05020101d807d601b2a5730000d6028cb2db6308a773010001d603aeb5b4a57302b1a5d901036391b1db630872037303d9010363aedb63087203d901054d0e938c7205017202d604e4c6a7041ad605b2a5730400d606db63087205d607ae7206d901074d0e938c720701720295938cb2db63087201730500017306d196830301ef7203938cb2db6308b2a473070073080001b2720473090095720796830201938cb27206730a0001720293c27205c2a7730bd801d608c2a7d196830501ef720393c27201720893e4c67201041a7204938cb2db6308b2a4730c00730d0001b27204730e00957207d801d609b27206730f0096830701938c720901720293cbc272057310e6c67205051ae6c67205060e93e4c67205070ecb720893e4c67205041a7204938c72090273117312',
      address:
        'EE7687i4URb4YuSGSQXPCbAjMfN4dUt5Qx8BqKZJiZhDY8fdnSUwcAGqAsqfn1tW1byXB8nDrgkFzkAFgaaempKxfcPtDzAbnu9QfknzmtfnLYHdxPPg7Qtjy7jK5yUpPQ2M4Ps3h5kH57xWDJxcKviEMY11rQnxATjTKTQgGtfzsAPpqsUyT2ZpVYsFzUGJ4nSj4WaDZSU1Hovv6dPkSTArLQSjp38wE72ae6hbNJwXGkqgfBtdVXcZVtnqevw9xUNcE6i942CQ9hVMfbdRobnsaLgsDLQomsh8jLMXqkMde5qH2vGBUqnLKgjxCZaa7vStpPXT5EuzLn9napGwUcbJjgRk69FsRSfCrcydZbYxw4Gnh6ZB9at2USpwL1HdVkHVh8M6Kbw6ppRfeG4JeFsUw33H4sSRk6UPqfuFcRUf7Cec2vmPezXTPT7CXQqEeCjxmWXqfyEQUfnCwpiH5fQ9A8CQ3jTyFhxBTpoGDdtiVCmhqhKxjh9M7gcjpr1dUjGMCWxjir94ejfq24XQrSscrZuUT5NVHTWAkzQ',
      assets: [
        {
          tokenId:
            '497287b9a1eff643791277744a74b7d598b834dc613f2ebc972e33767c61ac2b',
          index: 0,
          amount: 98,
          name: 'RWT',
          decimals: 0,
          type: 'EIP-004',
        },
      ],
      additionalRegisters: {
        R4: {
          serializedValue:
            '1a0120064c58ea394d41fada074a3c560a132467adf4ca1512c409c014c625ca285e9c',
          sigmaType: 'Coll[Coll[SByte]]',
          renderedValue:
            '[064c58ea394d41fada074a3c560a132467adf4ca1512c409c014c625ca285e9c]',
        },
        R5: {
          serializedValue: '0e0100',
          sigmaType: 'Coll[SByte]',
          renderedValue: '00',
        },
      },
      spentTransactionId:
        '845dd80bad067047aac1d6199af5b2271eceba20b27a3294f99732f26c07c74e',
      mainChain: true,
    },
    {
      boxId: '55795a7a13612d8557fdb12e2624f7d91c1076ae528e51bb89fe560389c6da86',
      transactionId:
        '555f7d54e7073f3ad6f0a587bf8c4f748e9a82b0868362b12a28854de968ea48',
      blockId:
        'd00a388e2929e9930485c119c9b2d93ef8429f8909c295dec7946fcbe5c0eeae',
      value: 1100000,
      index: 1,
      globalIndex: 539665,
      creationHeight: 249262,
      settlementHeight: 249264,
      ergoTree:
        '101c04000e209ccf1988673407c6b4484ff906e3d25792b2004ff1baebd79ee032dc0bfe275f04000200020004020400010004000400040004000400040604040402050205c8010500040204000400020004000400040204000400d80bd601b2a4730000d6027301d60393cbc272017202d604e4c6a7041ad6059572037201b2a5730200d606e4c67205041ad607c67205051ad608e67207d609957208b0e472078301027303d901093c0e0eb38c7209018c7209028301027304d60ab472097305b17209d60bb2a5730600957203d801d60cb2b5a5d9010c63d801d60ec6720c041a95e6720e93e4720e72047307730800d19683040193cbc2720ce4c6a7070e938cb2db6308720c730900018cb2db6308a7730a0001efae7206d9010d0e93720483010e720d93cbb3720ab27204730b00e4c6a7060ed801d60ccbc2720b9593720c7202d806d60db5a4d9010d6393c2a7c2720dd60eb1720dd60fb2db6501fe730c00d610e4c6720f0611d611b27210730d00d6129ab27210730e009d9cb27210730f00997eb1e4c6720f041a0573107311d19683080192c1720bb0ad720dd9011363c172137312d90113599a8c7213018c72130293b1b5720dd901136393e4c67213041a72047313ae7206d901130e9383010e7213720493e4c67205060ee4c6a7070e93b17206720e93cbb3720ab27204731400e4c6a7060e93e4c6a7051a83010e957208cbb2e472077315008301027316917e720e05958f7211721272117212d19683050193c5a7c57201938cb2db6308720b731700018cb2db6308a77318000193e4c6720b041a7204938cb2db6308b2a4731900731a0001b27204731b0093720ce4c6a7070e',
      address:
        '58grLgCGkazxJRdoVa73dDS2cFC2ZmfzWL3ibDeHPtcoXmWd72jjvjXX59Yi8S7MyLHGiWi44eRreMy1tz23AndoJVQMSatGFZnMzax3x4Xi8rJNsaKGSREEq4oY8gHJ53UtH7yW3D32HoFEkwrXNGCfzHCZ58jSuDzGxfmzWoLSFRqBAE7DFDjq1Ro6jVpJkQjNXwzKCPaSY2mLvFb9RSPLRSzMEW4A9Gjhr9MGnPaHD7L1WAk7c851Q66A3wKtFNzwts4cju48CEMMYZN3MzyzVeEAgsbnggNHA4RbQD2vDEZRNuYwruD9SWeJ337BsWnpJaXedkqu3sQREnA93U1Q2yeW2QRE3z77K7tiVjWziekFZW3Bbvy3MPURAAJpY1N3gEzhV3WLS48XZqYAVTRDBsXKWk1r5bNorRJUaXWSEvwRJNbJLsbhQD5WrZsVvkPXtjM1NG8Uyv96CSohKcuitgfpYrnvdGwyGyS2wRAf6UNveP73sJEpBFvEcFNJWmFkWwvEj9EAihGXcygTpkW5bNuEjt3jPwbavjtiRf74xD1z27FuT3bBdFF4hAr3tycJi4jzLHDMroQfaYMauwSWLrRCRq9w4HgaRAh8HeqYH1TVwi85dVrnmJCzzCPwycTk5ApgpoJLzarNMq5FSws9E6PXhTuNihgoTLQmehV2dSPLF8ATLFDxR1vaT8is3zGgs6Qg1ZfFmhe9poxvt2FjwYmnxTNMn5pgGCGf2eob8Ax1FfHLzh678kSxhGgxCa4bJeTfvZwPuXUBLrfAEbyR69XDSWruzxQffu6csRkCUEo49zTvU1YQZfLifXGo2RrZnihp545b3QuZL',
      assets: [
        {
          tokenId:
            '497287b9a1eff643791277744a74b7d598b834dc613f2ebc972e33767c61ac2b',
          index: 0,
          amount: 1,
          name: 'RWT',
          decimals: 0,
          type: 'EIP-004',
        },
      ],
      additionalRegisters: {
        R4: {
          serializedValue:
            '1a0120064c58ea394d41fada074a3c560a132467adf4ca1512c409c014c625ca285e9c',
          sigmaType: 'Coll[Coll[SByte]]',
          renderedValue:
            '[064c58ea394d41fada074a3c560a132467adf4ca1512c409c014c625ca285e9c]',
        },
        R5: {
          serializedValue:
            '1a0120d6f0cafb8b09baef18a8baba8bc0c1b76b0cb101dbd035e88de907739cb36563',
          sigmaType: 'Coll[Coll[SByte]]',
          renderedValue:
            '[d6f0cafb8b09baef18a8baba8bc0c1b76b0cb101dbd035e88de907739cb36563]',
        },
        R6: {
          serializedValue:
            '0e20c902aa4978dbb2eb493bd93cd265043fc141b05f8094b73a946779fed42c881b',
          sigmaType: 'Coll[SByte]',
          renderedValue:
            'c902aa4978dbb2eb493bd93cd265043fc141b05f8094b73a946779fed42c881b',
        },
        R7: {
          serializedValue:
            '0e2047819ff42f0ac3cb92e13d1baaa296da6d486e86676ffbefbf8682a7ab471032',
          sigmaType: 'Coll[SByte]',
          renderedValue:
            '47819ff42f0ac3cb92e13d1baaa296da6d486e86676ffbefbf8682a7ab471032',
        },
      },
      spentTransactionId: null,
      mainChain: true,
    },
    {
      boxId: 'dcefd7a8595439afa69eb4fcdf99db390b280d1298322f7883c73dc65cab9c4a',
      transactionId:
        '555f7d54e7073f3ad6f0a587bf8c4f748e9a82b0868362b12a28854de968ea48',
      blockId:
        'd00a388e2929e9930485c119c9b2d93ef8429f8909c295dec7946fcbe5c0eeae',
      value: 3400000,
      index: 2,
      globalIndex: 539666,
      creationHeight: 249262,
      settlementHeight: 249264,
      ergoTree:
        '0008cd028bcc85fa22006fa13767ab00af28ae0b2389d576fb59cfd0e46865e0449eeb8a',
      address: '9fadVRGYyiSBCgD7QtZU13BfGoDyTQ1oX918P8py22MJuMEwSuo',
      assets: [
        {
          tokenId:
            '064c58ea394d41fada074a3c560a132467adf4ca1512c409c014c625ca285e9c',
          index: 0,
          amount: 1,
          name: null,
          decimals: null,
          type: null,
        },
        {
          tokenId:
            'a2a6c892c38d508a659caf857dbe29da4343371e597efd42e40f9bc99099a516',
          index: 1,
          amount: 9000,
          name: 'RSN',
          decimals: 0,
          type: 'EIP-004',
        },
      ],
      additionalRegisters: {},
      spentTransactionId:
        '845dd80bad067047aac1d6199af5b2271eceba20b27a3294f99732f26c07c74e',
      mainChain: true,
    },
    {
      boxId: '4fe09434d53ec2ef5b512f0749fd9dbbadac6f4faf51e83104a5fd860530ae81',
      transactionId:
        '555f7d54e7073f3ad6f0a587bf8c4f748e9a82b0868362b12a28854de968ea48',
      blockId:
        'd00a388e2929e9930485c119c9b2d93ef8429f8909c295dec7946fcbe5c0eeae',
      value: 1100000,
      index: 3,
      globalIndex: 539667,
      creationHeight: 249262,
      settlementHeight: 249264,
      ergoTree:
        '1005040004000e36100204a00b08cd0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798ea02d192a39a8cc7a701730073011001020402d19683030193a38cc7b2a57300000193c2b2a57301007473027303830108cdeeac93b1a57304',
      address:
        '2iHkR7CWvD1R4j1yZg5bkeDRQavjAaVPeTDFGGLZduHyfWMuYpmhHocX8GJoaieTx78FntzJbCBVL6rf96ocJoZdmWBL2fci7NqWgAirppPQmZ7fN9V6z13Ay6brPriBKYqLp1bT2Fk4FkFLCfdPpe',
      assets: [],
      additionalRegisters: {},
      spentTransactionId: null,
      mainChain: true,
    },
  ],
  size: 1599,
};

export const permitBox = {
  boxId: 'a1314c434472c11bbc6b81da8f0bd7c857065762a0f13b64e067b8f7ad0a4769',
  value: 1100000,
  index: 0,
  spendingProof: null,
  blockId: 'd00a388e2929e9930485c119c9b2d93ef8429f8909c295dec7946fcbe5c0eeae',
  transactionId:
    '52d1c79bbf8a3137c56cc18410b41be931e95e2ce71f45864a58e1566e9b700a',
  outputIndex: 0,
  creationHeight: 249262,
  ergoTree:
    '10130400040004040400040204000e20a40b86c663fbbfefa243c9c6ebbc5690fc4e385f15b44c49ba469c91c5af0f480404040004000400010104020400040004000e205977b8061ddad79d59af7c01d896bb848cdac3d7ff40478aa78eb3eec50065dc05020101d807d601b2a5730000d6028cb2db6308a773010001d603aeb5b4a57302b1a5d901036391b1db630872037303d9010363aedb63087203d901054d0e938c7205017202d604e4c6a7041ad605b2a5730400d606db63087205d607ae7206d901074d0e938c720701720295938cb2db63087201730500017306d196830301ef7203938cb2db6308b2a473070073080001b2720473090095720796830201938cb27206730a0001720293c27205c2a7730bd801d608c2a7d196830501ef720393c27201720893e4c67201041a7204938cb2db6308b2a4730c00730d0001b27204730e00957207d801d609b27206730f0096830701938c720901720293cbc272057310e6c67205051ae6c67205060e93e4c67205070ecb720893e4c67205041a7204938c72090273117312',
  address:
    'EE7687i4URb4YuSGSQXPCbAjMfN4dUt5Qx8BqKZJiZhDY8fdnSUwcAGqAsqfn1tW1byXB8nDrgkFzkAFgaaempKxfcPtDzAbnu9QfknzmtfnLYHdxPPg7Qtjy7jK5yUpPQ2M4Ps3h5kH57xWDJxcKviEMY11rQnxATjTKTQgGtfzsAPpqsUyT2ZpVYsFzUGJ4nSj4WaDZSU1Hovv6dPkSTArLQSjp38wE72ae6hbNJwXGkqgfBtdVXcZVtnqevw9xUNcE6i942CQ9hVMfbdRobnsaLgsDLQomsh8jLMXqkMde5qH2vGBUqnLKgjxCZaa7vStpPXT5EuzLn9napGwUcbJjgRk69FsRSfCrcydZbYxw4Gnh6ZB9at2USpwL1HdVkHVh8M6Kbw6ppRfeG4JeFsUw33H4sSRk6UPqfuFcRUf7Cec2vmPezXTPT7CXQqEeCjxmWXqfyEQUfnCwpiH5fQ9A8CQ3jTyFhxBTpoGDdtiVCmhqhKxjh9M7gcjpr1dUjGMCWxjir94ejfq24XQrSscrZuUT5NVHTWAkzQ',
  assets: [
    {
      tokenId:
        '497287b9a1eff643791277744a74b7d598b834dc613f2ebc972e33767c61ac2b',
      index: 0,
      amount: 99,
      name: 'RWT',
      decimals: 0,
      type: 'EIP-004',
    },
  ],
  additionalRegisters: {
    R4: {
      serializedValue:
        '1a0120064c58ea394d41fada074a3c560a132467adf4ca1512c409c014c625ca285e9c',
      sigmaType: 'Coll[Coll[SByte]]',
      renderedValue:
        '[064c58ea394d41fada074a3c560a132467adf4ca1512c409c014c625ca285e9c]',
    },
    R5: {
      serializedValue: '0e0100',
      sigmaType: 'Coll[SByte]',
      renderedValue: '00',
    },
  },
};

export const observation1 = {
  id: 1,
  fromChain: 'ergo',
  toChain: 'cardano',
  fromAddress: 'fromAddress',
  toAddress: 'addr1',
  height: 1,
  amount: '10',
  networkFee: '1000',
  bridgeFee: '100',
  sourceChainTokenId: 'sourceToken',
  targetChainTokenId: 'targetToken',
  sourceTxId: 'txId',
  sourceBlockId: 'block',
  requestId: 'reqId1',
  block: 'hash',
  extractor: 'observation-extractor',
};

export const observation2 = {
  id: 2,
  fromChain: 'ergo',
  toChain: 'cardano',
  fromAddress: 'fromAddress4',
  toAddress: 'addr4',
  height: 10,
  amount: '5',
  networkFee: '1000',
  bridgeFee: '100',
  sourceChainTokenId: 'sourceToken4',
  targetChainTokenId: 'targetToken',
  sourceTxId: 'txId4',
  sourceBlockId: 'block',
  requestId: 'reqId4',
  block: 'hash',
  extractor: 'observation-extractor',
};
export const permitMockRWT =
  '8e5b02ba729ad364867619d2a8b9ff1438190c14979a12aa0a249e996194f074';

export const generalInfo = {
  currentBalance: 1100000,
  network: 'ergo',
  permitCount: 0,
  health: 'Healthy',
  address: '9eYicprScbobMdmWYRHwbYiM3g19EQ3iAK24FconvXFVfaEooVH',
};
