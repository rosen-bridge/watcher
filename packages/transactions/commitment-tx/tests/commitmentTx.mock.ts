import { ObservationEntity } from '@rosen-bridge/observation-extractor';
import { RWTRepo } from '@rosen-bridge/rwt-repo';
import { ErgoNetworkType } from '@rosen-bridge/scanner';
import { blake2b } from 'blakejs';
import * as ergoLib from 'ergo-lib-wasm-nodejs';

export const commitmentTxParams = {
  permitAddress:
    'EE7687i4URb4YuSGSQXPCbAjMfN4dUt5Qx8BqKZJiZhDY8fdnSUwcAGqAsqfn1tW1byXB8nDrgkFzkAFgaaempKxfcPtDzAbnu9QfknzmtfnLYHdxPPg7Qtjy7jK5yUpPQ2M4Ps3h5kH57xWDJxcKviEMY11rQnxATjTKTQgGtfzsAPpqsUyT2ZpVYsFzUGJ4nSj4WaDZSU1Hovv6dPkSTArLQSjp38wE72ae6hbNJwXGkqgfBtdVXcZVtnqevw9xUNcE6i942CQ9hVMfbdRobnsaLgsDLQomsh8jLMXqkMde5qH2vGBUqnLKgjxCZaa7vStpPXT5EuzLn9napGwUcbJjgRk69FsRSfCrcydZbYxw4Gnh6ZB9at2USpwL1HdVkHVh8M6Kbw6ppRfeG4JeFsUw33H4sSRk6UPqfuFcRUf7Cec2vmPezXTPT7CXQqEeCjxmWXqfyEQUfnCwpiH5fQ9A8CQ3jTyFhxBTpoGDdtiVCmhqhKxjh9M7gcjpr1dUjGMCWxjir94ejfq24XQrSscrZuUT5NVHTWAkzQ',
  commitmentAddress:
    'EE7687i4URb4YuSGSQXPCbAjMfN4dUt5Qx8BqKZJiZhDY8fdnSUwcAGqAsqfn1tW1byXB8nDrgkFzkAFgaaempKxfcPtDzAbnu9QfknzmtfnLYHdxPPg7Qtjy7jK5yUpPQ2M4Ps3h5kH57xWDJxcKviEMY11rQnxATjTKTQgGtfzsAPpqsUyT2ZpVYsFzUGJ4nSj4WaDZSU1Hovv6dPkSTArLQSjp38wE72ae6hbNJwXGkqgfBtdVXcZVtnqevw9xUNcE6i942CQ9hVMfbdRobnsaLgsDLQomsh8jLMXqkMde5qH2vGBUqnLKgjxCZaa7vStpPXT5EuzLn9napGwUcbJjgRk69FsRSfCrcydZbYxw4Gnh6ZB9at2USpwL1HdVkHVh8M6Kbw6ppRfeG4JeFsUw33H4sSRk6UPqfuFcRUf7Cec2vmPezXTPT7CXQqEeCjxmWXqfyEQUfnCwpiH5fQ9A8CQ3jTyFhxBTpoGDdtiVCmhqhKxjh9M7gcjpr1dUjGMCWxjir94ejfq24XQrSscrZuUT5NVHTWAkzQ',
  rwt: '3825b2b4acaaaba626440113153246c65ddb2e9df406c4a56418b5842c9f839a',
  txFee: '50',
  rwtRepo: new RWTRepo(
    '5qwczr7KdspNWq5dg6FZJZSDJ9YGcYDsCVi53E6M9gPamGjQTee9Zp5HLbJXQvWJ49ksh9Ao9YK3VcjHZjVVN2rP74YoYUwCo1xY25jJQRvmqF7tMJdUYAWxB1mg3U5xrcYy6oKhev7TNtnzgWW9831r6yx5B9jmBDj7FoC36s8y7DeKQPsG1HaZLBnyLyR8iKWRUeASSFg8QXMksZdE1ZgsnF218aEmjbeEmnj2DcjwQgatAhJKRzN24PNStzk2D41UL3Xe5FSTyVw7p3u6vXim2hDSKj3qAcGboaVv9SKayhbezzdYxiuKodcyggY63H39cUhgYFwHWahpNhVZBjWP4Q4yAm7ebxjfF2RFFjW8njZNGS1SERo5dqRZZcQ79faKeXmNkZ47TnHB8qQHhwxg4BVEWppfWUyoTbSFdBHGxZufej126i8P3QZaTT7Wi28iC8HA9xTj8ZT7A5facme2TGCFjVucYjRzPLd8PXHqjPq9hoAvUjRQi9pV6uppFppuhAPoNrCyi8JA2yTEcohaokoYLmRgp86QKW4AgCADJKhTczSoHz5wsDbbzTsGeoajPwPEosM2dDazqBobiuhnX5x1m4iegB4QWYJkeNWxPdXCWgxK3fTqGDhKdS6jja9nKUMtixmaLPrwLF22S61NcifoxwEfgTKT11UnmtGMCXkkTDkcreuGUkhZMAG7Kqy3MeuMvJin8f6fb6Mivr6A6ad6rqKChyPiFWr2YaeVbdeidGbQrW9FfjvYhRrTkwBBMcRac6eazjmVqYbe9Mqy1znj8t5PpdyndoGZHPmSbYo9ZF3ZTbjh9qT3kKPQ6TVc772NGyrYWaupPsbk7MJYTBZ5WWtnHbxQyqSLAEmeq4csX3pr5kcgQCoqkqY3UkgoFRBjsTDFp61FiAc6KdivhAh4AvWB5jAYKfqps6XwgQrCRqifD8XN6k6k41Cs6UeMU5FzH4fMqEwBTDyAsCigVaY7gz3eMdDrARc1Ec23rEYepqtuBeWe2ienoMgYazHwp27DvinbAyppFziYmf1n898UXpNqsD5ctyZxQ54n67mEXUAuYq7nJMEsTQpYSX9P4dh6qP9geDbYRbFwpN27gJG5HwqwhFwk1n4ytVxVrc7nHqUe86c5gPXb1DZTgJc9YC9b3yQhE6gcNk83Yn8vkrHvHXPE7wgzxQHgV1iMBtk8DkoFCBbHcd3X4MTskaSNKYcWgx4QPSf2GAg2xcsgRePe6ZKRuRLqoZ8dJKyZRc911UUxkY7qd4ZaBrp8ymmWy2s3mjbN3CY9uqXTLTdokNVUzdvAcrC8SKUAqbX567RN9TcuE5FmagD7RFpmy6eVME1MWSvdscheeoXWcvMCYPwVAvotnFrsypXmnZHXgEdNLQVsk19iNQKYG7Lxu51msGC7gKmVGaiifzrB',
    '32ee5d947cfe8db5480157ffa566b9b7d9faf41fa145c9d00628c7c1599878f6',
    '3825b2b4acaaaba626440113153246c65ddb2e9df406c4a56418b5842c9f839a',
    ErgoNetworkType.Explorer,
    ''
  ),
  permitScriptHash: '',
};
commitmentTxParams.permitScriptHash = Buffer.from(
  blake2b(
    Buffer.from(
      ergoLib.Address.from_base58(commitmentTxParams.permitAddress)
        .to_ergo_tree()
        .to_base16_bytes(),
      'hex'
    ),
    undefined,
    32
  )
).toString('hex');

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

export const widBox = {
  boxId: '2e24776266d16afbf23e7c96ba9c2ffb9bce25ea75d3ed9f2a9a3b2c84bf1655',
  value: 998900000,
  ergoTree:
    '0008cd024a9f60d062702fc582987b6cc0ab9e8fc30f3ad6e9493d84ae3247a6f1c229db',
  creationHeight: 204200,
  assets: [
    {
      tokenId:
        'f875d3b916e56056968d02018133d1c122764d5c70538e70e56199f431e95e9b',
      amount: 1,
    },
  ],
  additionalRegisters: {},
  transactionId:
    '929498ec7995b0ca8627bfad272961b9f1e83cfdd9481b796b8c419190430643',
  index: 2,
};

export const samplePermitBoxes = [
  {
    boxId: 'eb96ebae7af57f7192f62aec80cfc1d3a7d654d880051795c560c1d5832ea62d',
    transactionId:
      '34c7e33ab69ca329f8550e1a9a5db1632e0959e9490df3ef6e8f1637f694177a',
    blockId: 'bae22559ec0171f0e848fb9c6513c74137b809ee3a71665490b85dbaf9c84258',
    value: 1100000,
    index: 3,
    globalIndex: 32597290,
    creationHeight: 1090457,
    settlementHeight: 1090463,
    ergoTree:
      '10110400040004040400040204000e2032ee5d947cfe8db5480157ffa566b9b7d9faf41fa145c9d00628c7c1599878f60404040004000400010104000e20b466a5302d87a3e56b36613c1336c1d1643c491652235ad207853654d78034a0040404000400d806d601b2a5730000d6028cb2db6308a773010001d603aeb5b4a57302b1a5d901036391b1db630872037303d9010363aedb63087203d901054d0e938c7205017202d604e4c6a7041ad605b2a5730400d606db6308720595938cb2db63087201730500017306d196830301ef7203938cb2db6308b2a473070073080001b2720473090095ae7206d901074d0e938c720701720296830201938cb27206730a0001720293c27205c2a7730bd801d607c2a7d196830a01938cb27206730c0001720293cbc27205730de6c67205051ae6c67205060e93e4c67205070ecb720793e4c67205041a7204ef720393c27201720793e4c67201041a7204938cb2db6308b2a5730e00730f0001b27204731000',
    ergoTreeConstants:
      '0: 0\n1: 0\n2: 2\n3: 0\n4: 1\n5: 0\n6: Coll(50,-18,93,-108,124,-2,-115,-75,72,1,87,-1,-91,102,-71,-73,-39,-6,-12,31,-95,69,-55,-48,6,40,-57,-63,89,-104,120,-10)\n7: 2\n8: 0\n9: 0\n10: 0\n11: true\n12: 0\n13: Coll(-76,102,-91,48,45,-121,-93,-27,107,54,97,60,19,54,-63,-47,100,60,73,22,82,35,90,-46,7,-123,54,84,-41,-128,52,-96)\n14: 2\n15: 0\n16: 0',
    ergoTreeScript:
      '{\n  val box1 = OUTPUTS(placeholder[Int](0))\n  val coll2 = SELF.tokens(placeholder[Int](1))._1\n  val bool3 = OUTPUTS.slice(placeholder[Int](2), OUTPUTS.size).filter({(box3: Box) => box3.tokens.size > placeholder[Int](3) }).exists(\n    {(box3: Box) => box3.tokens.exists({(tuple5: (Coll[Byte], Long)) => tuple5._1 == coll2 }) }\n  )\n  val coll4 = SELF.R4[Coll[Coll[Byte]]].get\n  val box5 = OUTPUTS(placeholder[Int](4))\n  val coll6 = box5.tokens\n  if (box1.tokens(placeholder[Int](5))._1 == placeholder[Coll[Byte]](6)) {\n    sigmaProp(\n      allOf(\n        Coll[Boolean](\n          !bool3, INPUTS(placeholder[Int](7)).tokens(placeholder[Int](8))._1 == coll4(placeholder[Int](9)), if (coll6.exists(\n            {(tuple7: (Coll[Byte], Long)) => tuple7._1 == coll2 }\n          )) { allOf(Coll[Boolean](coll6(placeholder[Int](10))._1 == coll2, box5.propositionBytes == SELF.propositionBytes)) } else { placeholder[Boolean](11) }\n        )\n      )\n    )\n  } else {(\n    val coll7 = SELF.propositionBytes\n    sigmaProp(\n      allOf(\n        Coll[Boolean](\n          coll6(placeholder[Int](12))._1 == coll2, blake2b256(box5.propositionBytes) == placeholder[Coll[Byte]](13), box5.R5[\n            Coll[Coll[Byte]]\n          ].isDefined, box5.R6[Coll[Byte]].isDefined, box5.R7[Coll[Byte]].get == blake2b256(coll7), box5.R4[\n            Coll[Coll[Byte]]\n          ].get == coll4, !bool3, box1.propositionBytes == coll7, box1.R4[Coll[Coll[Byte]]].get == coll4, OUTPUTS(placeholder[Int](14)).tokens(\n            placeholder[Int](15)\n          )._1 == coll4(placeholder[Int](16))\n        )\n      )\n    )\n  )}\n}',
    address:
      'FxMs5S8B9DA3Ecw7taWSSRefYESRzAmeznhb9sdp7KR2ZCe9NMzHj4PRWLimyFLvAv2nD3QtmPneFoWjVqJsgSMjV5wijdkz14a5WogmvKSbUe4WjVWuW7GLEnSnMaVZ56cdLk53pzZ7exKc5hhiAjeFJDzjjm1Dqt1RoEWgkUJuaW6Mm9FMiJhq9WYJVVEDzpkL6VYhrYWMLG3J5tB1ji7aTwTGmaCapEtRo7RCmMMMYhBssBxY4putUJxHV4RsD6k9pYMuz2jrsSRWZrUbtTLkhiifSpPCEmHNrPJiSFQSVDWr3gfqmPgkJxbxTGyz7vexUCcLqGHxMaBGsPoaSod9GNqo62Gik8eRUjr8zkuYU6tD9hfPUHCzEr6xyGbrGtrmczigHmD8a1HXh1DKu4xt8eMGws5CCgq6cFZpssQEakHtPnD3kTmsKNjM6KpnReWguNxqYERZYLhfGqTZ4vNFEmj88qTJWUzVu65DbpcGu6vzpZ93BfJ7KA7a1v',
    assets: [
      {
        tokenId:
          '3825b2b4acaaaba626440113153246c65ddb2e9df406c4a56418b5842c9f839a',
        index: 0,
        amount: 10000,
        name: 'rptconfErgoRWTV1',
        decimals: 0,
        type: 'EIP-004',
      },
    ],
    additionalRegisters: {
      R4: {
        serializedValue:
          '1a01205589db926e6760d840c919948169a559abcab58ef0d2100126e48f9d2ef12320',
        sigmaType: 'Coll[Coll[SByte]]',
        renderedValue:
          '[5589db926e6760d840c919948169a559abcab58ef0d2100126e48f9d2ef12320]',
      },
    },
    spentTransactionId:
      '3867f78a6d692df1ad2db1b221a1d4db826063bcd8ab357d88eaf8ce9ef99136',
    mainChain: true,
  },
  {
    boxId: '166580caab3923a9533ebf9aa2a04f757a20349f048e9fbc344aa2aae0fbcd8f',
    transactionId:
      '34c7e33ab69ca329f8550e1a9a5db1632e0959e9490df3ef6e8f1637f694177a',
    blockId: 'bae22559ec0171f0e848fb9c6513c74137b809ee3a71665490b85dbaf9c84258',
    value: 1100000,
    index: 2,
    globalIndex: 32597289,
    creationHeight: 1090457,
    settlementHeight: 1090463,
    ergoTree:
      '10110400040004040400040204000e2032ee5d947cfe8db5480157ffa566b9b7d9faf41fa145c9d00628c7c1599878f60404040004000400010104000e20b466a5302d87a3e56b36613c1336c1d1643c491652235ad207853654d78034a0040404000400d806d601b2a5730000d6028cb2db6308a773010001d603aeb5b4a57302b1a5d901036391b1db630872037303d9010363aedb63087203d901054d0e938c7205017202d604e4c6a7041ad605b2a5730400d606db6308720595938cb2db63087201730500017306d196830301ef7203938cb2db6308b2a473070073080001b2720473090095ae7206d901074d0e938c720701720296830201938cb27206730a0001720293c27205c2a7730bd801d607c2a7d196830a01938cb27206730c0001720293cbc27205730de6c67205051ae6c67205060e93e4c67205070ecb720793e4c67205041a7204ef720393c27201720793e4c67201041a7204938cb2db6308b2a5730e00730f0001b27204731000',
    ergoTreeConstants:
      '0: 0\n1: 0\n2: 2\n3: 0\n4: 1\n5: 0\n6: Coll(50,-18,93,-108,124,-2,-115,-75,72,1,87,-1,-91,102,-71,-73,-39,-6,-12,31,-95,69,-55,-48,6,40,-57,-63,89,-104,120,-10)\n7: 2\n8: 0\n9: 0\n10: 0\n11: true\n12: 0\n13: Coll(-76,102,-91,48,45,-121,-93,-27,107,54,97,60,19,54,-63,-47,100,60,73,22,82,35,90,-46,7,-123,54,84,-41,-128,52,-96)\n14: 2\n15: 0\n16: 0',
    ergoTreeScript:
      '{\n  val box1 = OUTPUTS(placeholder[Int](0))\n  val coll2 = SELF.tokens(placeholder[Int](1))._1\n  val bool3 = OUTPUTS.slice(placeholder[Int](2), OUTPUTS.size).filter({(box3: Box) => box3.tokens.size > placeholder[Int](3) }).exists(\n    {(box3: Box) => box3.tokens.exists({(tuple5: (Coll[Byte], Long)) => tuple5._1 == coll2 }) }\n  )\n  val coll4 = SELF.R4[Coll[Coll[Byte]]].get\n  val box5 = OUTPUTS(placeholder[Int](4))\n  val coll6 = box5.tokens\n  if (box1.tokens(placeholder[Int](5))._1 == placeholder[Coll[Byte]](6)) {\n    sigmaProp(\n      allOf(\n        Coll[Boolean](\n          !bool3, INPUTS(placeholder[Int](7)).tokens(placeholder[Int](8))._1 == coll4(placeholder[Int](9)), if (coll6.exists(\n            {(tuple7: (Coll[Byte], Long)) => tuple7._1 == coll2 }\n          )) { allOf(Coll[Boolean](coll6(placeholder[Int](10))._1 == coll2, box5.propositionBytes == SELF.propositionBytes)) } else { placeholder[Boolean](11) }\n        )\n      )\n    )\n  } else {(\n    val coll7 = SELF.propositionBytes\n    sigmaProp(\n      allOf(\n        Coll[Boolean](\n          coll6(placeholder[Int](12))._1 == coll2, blake2b256(box5.propositionBytes) == placeholder[Coll[Byte]](13), box5.R5[\n            Coll[Coll[Byte]]\n          ].isDefined, box5.R6[Coll[Byte]].isDefined, box5.R7[Coll[Byte]].get == blake2b256(coll7), box5.R4[\n            Coll[Coll[Byte]]\n          ].get == coll4, !bool3, box1.propositionBytes == coll7, box1.R4[Coll[Coll[Byte]]].get == coll4, OUTPUTS(placeholder[Int](14)).tokens(\n            placeholder[Int](15)\n          )._1 == coll4(placeholder[Int](16))\n        )\n      )\n    )\n  )}\n}',
    address:
      'FxMs5S8B9DA3Ecw7taWSSRefYESRzAmeznhb9sdp7KR2ZCe9NMzHj4PRWLimyFLvAv2nD3QtmPneFoWjVqJsgSMjV5wijdkz14a5WogmvKSbUe4WjVWuW7GLEnSnMaVZ56cdLk53pzZ7exKc5hhiAjeFJDzjjm1Dqt1RoEWgkUJuaW6Mm9FMiJhq9WYJVVEDzpkL6VYhrYWMLG3J5tB1ji7aTwTGmaCapEtRo7RCmMMMYhBssBxY4putUJxHV4RsD6k9pYMuz2jrsSRWZrUbtTLkhiifSpPCEmHNrPJiSFQSVDWr3gfqmPgkJxbxTGyz7vexUCcLqGHxMaBGsPoaSod9GNqo62Gik8eRUjr8zkuYU6tD9hfPUHCzEr6xyGbrGtrmczigHmD8a1HXh1DKu4xt8eMGws5CCgq6cFZpssQEakHtPnD3kTmsKNjM6KpnReWguNxqYERZYLhfGqTZ4vNFEmj88qTJWUzVu65DbpcGu6vzpZ93BfJ7KA7a1v',
    assets: [
      {
        tokenId:
          '3825b2b4acaaaba626440113153246c65ddb2e9df406c4a56418b5842c9f839a',
        index: 0,
        amount: 10000,
        name: 'rptconfErgoRWTV1',
        decimals: 0,
        type: 'EIP-004',
      },
    ],
    additionalRegisters: {
      R4: {
        serializedValue:
          '1a0120e61a83c5bca59e98c21d925faff5dfc079aa438f21df08702e4c4bf2bada02dc',
        sigmaType: 'Coll[Coll[SByte]]',
        renderedValue:
          '[e61a83c5bca59e98c21d925faff5dfc079aa438f21df08702e4c4bf2bada02dc]',
      },
    },
    spentTransactionId:
      'ec79e445d6b62beba77f51649e7132702d5631a28966bf1f556943d4592dff35',
    mainChain: true,
  },
  {
    boxId: 'c93e23a81c4e65456f4963b1081f9f56b57935571c8024747835e0f80043c6a1',
    transactionId:
      '34c7e33ab69ca329f8550e1a9a5db1632e0959e9490df3ef6e8f1637f694177a',
    blockId: 'bae22559ec0171f0e848fb9c6513c74137b809ee3a71665490b85dbaf9c84258',
    value: 1100000,
    index: 1,
    globalIndex: 32597288,
    creationHeight: 1090457,
    settlementHeight: 1090463,
    ergoTree:
      '10110400040004040400040204000e2032ee5d947cfe8db5480157ffa566b9b7d9faf41fa145c9d00628c7c1599878f60404040004000400010104000e20b466a5302d87a3e56b36613c1336c1d1643c491652235ad207853654d78034a0040404000400d806d601b2a5730000d6028cb2db6308a773010001d603aeb5b4a57302b1a5d901036391b1db630872037303d9010363aedb63087203d901054d0e938c7205017202d604e4c6a7041ad605b2a5730400d606db6308720595938cb2db63087201730500017306d196830301ef7203938cb2db6308b2a473070073080001b2720473090095ae7206d901074d0e938c720701720296830201938cb27206730a0001720293c27205c2a7730bd801d607c2a7d196830a01938cb27206730c0001720293cbc27205730de6c67205051ae6c67205060e93e4c67205070ecb720793e4c67205041a7204ef720393c27201720793e4c67201041a7204938cb2db6308b2a5730e00730f0001b27204731000',
    ergoTreeConstants:
      '0: 0\n1: 0\n2: 2\n3: 0\n4: 1\n5: 0\n6: Coll(50,-18,93,-108,124,-2,-115,-75,72,1,87,-1,-91,102,-71,-73,-39,-6,-12,31,-95,69,-55,-48,6,40,-57,-63,89,-104,120,-10)\n7: 2\n8: 0\n9: 0\n10: 0\n11: true\n12: 0\n13: Coll(-76,102,-91,48,45,-121,-93,-27,107,54,97,60,19,54,-63,-47,100,60,73,22,82,35,90,-46,7,-123,54,84,-41,-128,52,-96)\n14: 2\n15: 0\n16: 0',
    ergoTreeScript:
      '{\n  val box1 = OUTPUTS(placeholder[Int](0))\n  val coll2 = SELF.tokens(placeholder[Int](1))._1\n  val bool3 = OUTPUTS.slice(placeholder[Int](2), OUTPUTS.size).filter({(box3: Box) => box3.tokens.size > placeholder[Int](3) }).exists(\n    {(box3: Box) => box3.tokens.exists({(tuple5: (Coll[Byte], Long)) => tuple5._1 == coll2 }) }\n  )\n  val coll4 = SELF.R4[Coll[Coll[Byte]]].get\n  val box5 = OUTPUTS(placeholder[Int](4))\n  val coll6 = box5.tokens\n  if (box1.tokens(placeholder[Int](5))._1 == placeholder[Coll[Byte]](6)) {\n    sigmaProp(\n      allOf(\n        Coll[Boolean](\n          !bool3, INPUTS(placeholder[Int](7)).tokens(placeholder[Int](8))._1 == coll4(placeholder[Int](9)), if (coll6.exists(\n            {(tuple7: (Coll[Byte], Long)) => tuple7._1 == coll2 }\n          )) { allOf(Coll[Boolean](coll6(placeholder[Int](10))._1 == coll2, box5.propositionBytes == SELF.propositionBytes)) } else { placeholder[Boolean](11) }\n        )\n      )\n    )\n  } else {(\n    val coll7 = SELF.propositionBytes\n    sigmaProp(\n      allOf(\n        Coll[Boolean](\n          coll6(placeholder[Int](12))._1 == coll2, blake2b256(box5.propositionBytes) == placeholder[Coll[Byte]](13), box5.R5[\n            Coll[Coll[Byte]]\n          ].isDefined, box5.R6[Coll[Byte]].isDefined, box5.R7[Coll[Byte]].get == blake2b256(coll7), box5.R4[\n            Coll[Coll[Byte]]\n          ].get == coll4, !bool3, box1.propositionBytes == coll7, box1.R4[Coll[Coll[Byte]]].get == coll4, OUTPUTS(placeholder[Int](14)).tokens(\n            placeholder[Int](15)\n          )._1 == coll4(placeholder[Int](16))\n        )\n      )\n    )\n  )}\n}',
    address:
      'FxMs5S8B9DA3Ecw7taWSSRefYESRzAmeznhb9sdp7KR2ZCe9NMzHj4PRWLimyFLvAv2nD3QtmPneFoWjVqJsgSMjV5wijdkz14a5WogmvKSbUe4WjVWuW7GLEnSnMaVZ56cdLk53pzZ7exKc5hhiAjeFJDzjjm1Dqt1RoEWgkUJuaW6Mm9FMiJhq9WYJVVEDzpkL6VYhrYWMLG3J5tB1ji7aTwTGmaCapEtRo7RCmMMMYhBssBxY4putUJxHV4RsD6k9pYMuz2jrsSRWZrUbtTLkhiifSpPCEmHNrPJiSFQSVDWr3gfqmPgkJxbxTGyz7vexUCcLqGHxMaBGsPoaSod9GNqo62Gik8eRUjr8zkuYU6tD9hfPUHCzEr6xyGbrGtrmczigHmD8a1HXh1DKu4xt8eMGws5CCgq6cFZpssQEakHtPnD3kTmsKNjM6KpnReWguNxqYERZYLhfGqTZ4vNFEmj88qTJWUzVu65DbpcGu6vzpZ93BfJ7KA7a1v',
    assets: [
      {
        tokenId:
          '3825b2b4acaaaba626440113153246c65ddb2e9df406c4a56418b5842c9f839a',
        index: 0,
        amount: 10000,
        name: 'rptconfErgoRWTV1',
        decimals: 0,
        type: 'EIP-004',
      },
    ],
    additionalRegisters: {
      R4: {
        serializedValue:
          '1a0120995ca29a94c2290c7648b56e4a84dafda75765c6e793c5cdcd4fba55ff261e9f',
        sigmaType: 'Coll[Coll[SByte]]',
        renderedValue:
          '[995ca29a94c2290c7648b56e4a84dafda75765c6e793c5cdcd4fba55ff261e9f]',
      },
    },
    spentTransactionId:
      '587ad626d72e4265d848af0c8847b2d50b6a33c5182a780e3136436d3c79b6af',
    mainChain: true,
  },
  {
    boxId: '888e49cbf32f0fccba507728a5ca5ccf39dfc2aaeafb0f0961e693b9f5e9b335',
    transactionId:
      '34c7e33ab69ca329f8550e1a9a5db1632e0959e9490df3ef6e8f1637f694177a',
    blockId: 'bae22559ec0171f0e848fb9c6513c74137b809ee3a71665490b85dbaf9c84258',
    value: 1100000,
    index: 0,
    globalIndex: 32597287,
    creationHeight: 1090457,
    settlementHeight: 1090463,
    ergoTree:
      '10110400040004040400040204000e2032ee5d947cfe8db5480157ffa566b9b7d9faf41fa145c9d00628c7c1599878f60404040004000400010104000e20b466a5302d87a3e56b36613c1336c1d1643c491652235ad207853654d78034a0040404000400d806d601b2a5730000d6028cb2db6308a773010001d603aeb5b4a57302b1a5d901036391b1db630872037303d9010363aedb63087203d901054d0e938c7205017202d604e4c6a7041ad605b2a5730400d606db6308720595938cb2db63087201730500017306d196830301ef7203938cb2db6308b2a473070073080001b2720473090095ae7206d901074d0e938c720701720296830201938cb27206730a0001720293c27205c2a7730bd801d607c2a7d196830a01938cb27206730c0001720293cbc27205730de6c67205051ae6c67205060e93e4c67205070ecb720793e4c67205041a7204ef720393c27201720793e4c67201041a7204938cb2db6308b2a5730e00730f0001b27204731000',
    ergoTreeConstants:
      '0: 0\n1: 0\n2: 2\n3: 0\n4: 1\n5: 0\n6: Coll(50,-18,93,-108,124,-2,-115,-75,72,1,87,-1,-91,102,-71,-73,-39,-6,-12,31,-95,69,-55,-48,6,40,-57,-63,89,-104,120,-10)\n7: 2\n8: 0\n9: 0\n10: 0\n11: true\n12: 0\n13: Coll(-76,102,-91,48,45,-121,-93,-27,107,54,97,60,19,54,-63,-47,100,60,73,22,82,35,90,-46,7,-123,54,84,-41,-128,52,-96)\n14: 2\n15: 0\n16: 0',
    ergoTreeScript:
      '{\n  val box1 = OUTPUTS(placeholder[Int](0))\n  val coll2 = SELF.tokens(placeholder[Int](1))._1\n  val bool3 = OUTPUTS.slice(placeholder[Int](2), OUTPUTS.size).filter({(box3: Box) => box3.tokens.size > placeholder[Int](3) }).exists(\n    {(box3: Box) => box3.tokens.exists({(tuple5: (Coll[Byte], Long)) => tuple5._1 == coll2 }) }\n  )\n  val coll4 = SELF.R4[Coll[Coll[Byte]]].get\n  val box5 = OUTPUTS(placeholder[Int](4))\n  val coll6 = box5.tokens\n  if (box1.tokens(placeholder[Int](5))._1 == placeholder[Coll[Byte]](6)) {\n    sigmaProp(\n      allOf(\n        Coll[Boolean](\n          !bool3, INPUTS(placeholder[Int](7)).tokens(placeholder[Int](8))._1 == coll4(placeholder[Int](9)), if (coll6.exists(\n            {(tuple7: (Coll[Byte], Long)) => tuple7._1 == coll2 }\n          )) { allOf(Coll[Boolean](coll6(placeholder[Int](10))._1 == coll2, box5.propositionBytes == SELF.propositionBytes)) } else { placeholder[Boolean](11) }\n        )\n      )\n    )\n  } else {(\n    val coll7 = SELF.propositionBytes\n    sigmaProp(\n      allOf(\n        Coll[Boolean](\n          coll6(placeholder[Int](12))._1 == coll2, blake2b256(box5.propositionBytes) == placeholder[Coll[Byte]](13), box5.R5[\n            Coll[Coll[Byte]]\n          ].isDefined, box5.R6[Coll[Byte]].isDefined, box5.R7[Coll[Byte]].get == blake2b256(coll7), box5.R4[\n            Coll[Coll[Byte]]\n          ].get == coll4, !bool3, box1.propositionBytes == coll7, box1.R4[Coll[Coll[Byte]]].get == coll4, OUTPUTS(placeholder[Int](14)).tokens(\n            placeholder[Int](15)\n          )._1 == coll4(placeholder[Int](16))\n        )\n      )\n    )\n  )}\n}',
    address:
      'FxMs5S8B9DA3Ecw7taWSSRefYESRzAmeznhb9sdp7KR2ZCe9NMzHj4PRWLimyFLvAv2nD3QtmPneFoWjVqJsgSMjV5wijdkz14a5WogmvKSbUe4WjVWuW7GLEnSnMaVZ56cdLk53pzZ7exKc5hhiAjeFJDzjjm1Dqt1RoEWgkUJuaW6Mm9FMiJhq9WYJVVEDzpkL6VYhrYWMLG3J5tB1ji7aTwTGmaCapEtRo7RCmMMMYhBssBxY4putUJxHV4RsD6k9pYMuz2jrsSRWZrUbtTLkhiifSpPCEmHNrPJiSFQSVDWr3gfqmPgkJxbxTGyz7vexUCcLqGHxMaBGsPoaSod9GNqo62Gik8eRUjr8zkuYU6tD9hfPUHCzEr6xyGbrGtrmczigHmD8a1HXh1DKu4xt8eMGws5CCgq6cFZpssQEakHtPnD3kTmsKNjM6KpnReWguNxqYERZYLhfGqTZ4vNFEmj88qTJWUzVu65DbpcGu6vzpZ93BfJ7KA7a1v',
    assets: [
      {
        tokenId:
          '3825b2b4acaaaba626440113153246c65ddb2e9df406c4a56418b5842c9f839a',
        index: 0,
        amount: 10000,
        name: 'rptconfErgoRWTV1',
        decimals: 0,
        type: 'EIP-004',
      },
    ],
    additionalRegisters: {
      R4: {
        serializedValue:
          '1a01202228e54299db6c13479c6ced3705df36f2ed0e4e815ed7536ba99be14a13179d',
        sigmaType: 'Coll[Coll[SByte]]',
        renderedValue:
          '[2228e54299db6c13479c6ced3705df36f2ed0e4e815ed7536ba99be14a13179d]',
      },
    },
    spentTransactionId:
      '783832c824daa0018feaf962eec31fbc138eb75d4a81a826262762c4e00b4fa7',
    mainChain: true,
  },
  {
    boxId: '4a06fc919376715cc29d584b3f5f51fbc7cba49016baf82471b331f9f4d4332a',
    transactionId:
      'b6ddae662ae785ed1308ec3ddaee1aad4016f65a60e2092f8906801176140552',
    blockId: 'deb1234c7814b3618d72322cd29623ca25f0f2523c1d400c40df90b11a4625a2',
    value: 1100000,
    index: 0,
    globalIndex: 32407085,
    creationHeight: 1085194,
    settlementHeight: 1085196,
    ergoTree:
      '10110400040004040400040204000e2032ee5d947cfe8db5480157ffa566b9b7d9faf41fa145c9d00628c7c1599878f60404040004000400010104000e20b466a5302d87a3e56b36613c1336c1d1643c491652235ad207853654d78034a0040404000400d806d601b2a5730000d6028cb2db6308a773010001d603aeb5b4a57302b1a5d901036391b1db630872037303d9010363aedb63087203d901054d0e938c7205017202d604e4c6a7041ad605b2a5730400d606db6308720595938cb2db63087201730500017306d196830301ef7203938cb2db6308b2a473070073080001b2720473090095ae7206d901074d0e938c720701720296830201938cb27206730a0001720293c27205c2a7730bd801d607c2a7d196830a01938cb27206730c0001720293cbc27205730de6c67205051ae6c67205060e93e4c67205070ecb720793e4c67205041a7204ef720393c27201720793e4c67201041a7204938cb2db6308b2a5730e00730f0001b27204731000',
    ergoTreeConstants:
      '0: 0\n1: 0\n2: 2\n3: 0\n4: 1\n5: 0\n6: Coll(50,-18,93,-108,124,-2,-115,-75,72,1,87,-1,-91,102,-71,-73,-39,-6,-12,31,-95,69,-55,-48,6,40,-57,-63,89,-104,120,-10)\n7: 2\n8: 0\n9: 0\n10: 0\n11: true\n12: 0\n13: Coll(-76,102,-91,48,45,-121,-93,-27,107,54,97,60,19,54,-63,-47,100,60,73,22,82,35,90,-46,7,-123,54,84,-41,-128,52,-96)\n14: 2\n15: 0\n16: 0',
    ergoTreeScript:
      '{\n  val box1 = OUTPUTS(placeholder[Int](0))\n  val coll2 = SELF.tokens(placeholder[Int](1))._1\n  val bool3 = OUTPUTS.slice(placeholder[Int](2), OUTPUTS.size).filter({(box3: Box) => box3.tokens.size > placeholder[Int](3) }).exists(\n    {(box3: Box) => box3.tokens.exists({(tuple5: (Coll[Byte], Long)) => tuple5._1 == coll2 }) }\n  )\n  val coll4 = SELF.R4[Coll[Coll[Byte]]].get\n  val box5 = OUTPUTS(placeholder[Int](4))\n  val coll6 = box5.tokens\n  if (box1.tokens(placeholder[Int](5))._1 == placeholder[Coll[Byte]](6)) {\n    sigmaProp(\n      allOf(\n        Coll[Boolean](\n          !bool3, INPUTS(placeholder[Int](7)).tokens(placeholder[Int](8))._1 == coll4(placeholder[Int](9)), if (coll6.exists(\n            {(tuple7: (Coll[Byte], Long)) => tuple7._1 == coll2 }\n          )) { allOf(Coll[Boolean](coll6(placeholder[Int](10))._1 == coll2, box5.propositionBytes == SELF.propositionBytes)) } else { placeholder[Boolean](11) }\n        )\n      )\n    )\n  } else {(\n    val coll7 = SELF.propositionBytes\n    sigmaProp(\n      allOf(\n        Coll[Boolean](\n          coll6(placeholder[Int](12))._1 == coll2, blake2b256(box5.propositionBytes) == placeholder[Coll[Byte]](13), box5.R5[\n            Coll[Coll[Byte]]\n          ].isDefined, box5.R6[Coll[Byte]].isDefined, box5.R7[Coll[Byte]].get == blake2b256(coll7), box5.R4[\n            Coll[Coll[Byte]]\n          ].get == coll4, !bool3, box1.propositionBytes == coll7, box1.R4[Coll[Coll[Byte]]].get == coll4, OUTPUTS(placeholder[Int](14)).tokens(\n            placeholder[Int](15)\n          )._1 == coll4(placeholder[Int](16))\n        )\n      )\n    )\n  )}\n}',
    address:
      'FxMs5S8B9DA3Ecw7taWSSRefYESRzAmeznhb9sdp7KR2ZCe9NMzHj4PRWLimyFLvAv2nD3QtmPneFoWjVqJsgSMjV5wijdkz14a5WogmvKSbUe4WjVWuW7GLEnSnMaVZ56cdLk53pzZ7exKc5hhiAjeFJDzjjm1Dqt1RoEWgkUJuaW6Mm9FMiJhq9WYJVVEDzpkL6VYhrYWMLG3J5tB1ji7aTwTGmaCapEtRo7RCmMMMYhBssBxY4putUJxHV4RsD6k9pYMuz2jrsSRWZrUbtTLkhiifSpPCEmHNrPJiSFQSVDWr3gfqmPgkJxbxTGyz7vexUCcLqGHxMaBGsPoaSod9GNqo62Gik8eRUjr8zkuYU6tD9hfPUHCzEr6xyGbrGtrmczigHmD8a1HXh1DKu4xt8eMGws5CCgq6cFZpssQEakHtPnD3kTmsKNjM6KpnReWguNxqYERZYLhfGqTZ4vNFEmj88qTJWUzVu65DbpcGu6vzpZ93BfJ7KA7a1v',
    assets: [
      {
        tokenId:
          '3825b2b4acaaaba626440113153246c65ddb2e9df406c4a56418b5842c9f839a',
        index: 0,
        amount: 10000,
        name: 'rptconfErgoRWTV1',
        decimals: 0,
        type: 'EIP-004',
      },
    ],
    additionalRegisters: {
      R4: {
        serializedValue:
          '1a01202228e54299db6c13479c6ced3705df36f2ed0e4e815ed7536ba99be14a13179d',
        sigmaType: 'Coll[Coll[SByte]]',
        renderedValue:
          '[2228e54299db6c13479c6ced3705df36f2ed0e4e815ed7536ba99be14a13179d]',
      },
      R5: {
        serializedValue: '1a010100',
        sigmaType: 'Coll[Coll[SByte]]',
        renderedValue: '[00]',
      },
    },
    spentTransactionId:
      'e534642150c02bf1eb6501972bd61ccd6ba3d05a4a4dd7dcb6c4a49650471507',
    mainChain: true,
  },
  {
    boxId: '84e918fe24d4d3d5b94c54d564b2bd42e2b38c49b75233a25d6faf75b0f87a51',
    transactionId:
      '8654c11854d887dcc0879f1dc4bd501db39f3d9dcaba06de39fad9405aa2ed45',
    blockId: 'a3d1b36453406acca440d9a5b9aa20c41ee06d540d0eeb8b237823e899781d45',
    value: 1100000,
    index: 0,
    globalIndex: 32405281,
    creationHeight: 1085164,
    settlementHeight: 1085166,
    ergoTree:
      '10110400040004040400040204000e2032ee5d947cfe8db5480157ffa566b9b7d9faf41fa145c9d00628c7c1599878f60404040004000400010104000e20b466a5302d87a3e56b36613c1336c1d1643c491652235ad207853654d78034a0040404000400d806d601b2a5730000d6028cb2db6308a773010001d603aeb5b4a57302b1a5d901036391b1db630872037303d9010363aedb63087203d901054d0e938c7205017202d604e4c6a7041ad605b2a5730400d606db6308720595938cb2db63087201730500017306d196830301ef7203938cb2db6308b2a473070073080001b2720473090095ae7206d901074d0e938c720701720296830201938cb27206730a0001720293c27205c2a7730bd801d607c2a7d196830a01938cb27206730c0001720293cbc27205730de6c67205051ae6c67205060e93e4c67205070ecb720793e4c67205041a7204ef720393c27201720793e4c67201041a7204938cb2db6308b2a5730e00730f0001b27204731000',
    ergoTreeConstants:
      '0: 0\n1: 0\n2: 2\n3: 0\n4: 1\n5: 0\n6: Coll(50,-18,93,-108,124,-2,-115,-75,72,1,87,-1,-91,102,-71,-73,-39,-6,-12,31,-95,69,-55,-48,6,40,-57,-63,89,-104,120,-10)\n7: 2\n8: 0\n9: 0\n10: 0\n11: true\n12: 0\n13: Coll(-76,102,-91,48,45,-121,-93,-27,107,54,97,60,19,54,-63,-47,100,60,73,22,82,35,90,-46,7,-123,54,84,-41,-128,52,-96)\n14: 2\n15: 0\n16: 0',
    ergoTreeScript:
      '{\n  val box1 = OUTPUTS(placeholder[Int](0))\n  val coll2 = SELF.tokens(placeholder[Int](1))._1\n  val bool3 = OUTPUTS.slice(placeholder[Int](2), OUTPUTS.size).filter({(box3: Box) => box3.tokens.size > placeholder[Int](3) }).exists(\n    {(box3: Box) => box3.tokens.exists({(tuple5: (Coll[Byte], Long)) => tuple5._1 == coll2 }) }\n  )\n  val coll4 = SELF.R4[Coll[Coll[Byte]]].get\n  val box5 = OUTPUTS(placeholder[Int](4))\n  val coll6 = box5.tokens\n  if (box1.tokens(placeholder[Int](5))._1 == placeholder[Coll[Byte]](6)) {\n    sigmaProp(\n      allOf(\n        Coll[Boolean](\n          !bool3, INPUTS(placeholder[Int](7)).tokens(placeholder[Int](8))._1 == coll4(placeholder[Int](9)), if (coll6.exists(\n            {(tuple7: (Coll[Byte], Long)) => tuple7._1 == coll2 }\n          )) { allOf(Coll[Boolean](coll6(placeholder[Int](10))._1 == coll2, box5.propositionBytes == SELF.propositionBytes)) } else { placeholder[Boolean](11) }\n        )\n      )\n    )\n  } else {(\n    val coll7 = SELF.propositionBytes\n    sigmaProp(\n      allOf(\n        Coll[Boolean](\n          coll6(placeholder[Int](12))._1 == coll2, blake2b256(box5.propositionBytes) == placeholder[Coll[Byte]](13), box5.R5[\n            Coll[Coll[Byte]]\n          ].isDefined, box5.R6[Coll[Byte]].isDefined, box5.R7[Coll[Byte]].get == blake2b256(coll7), box5.R4[\n            Coll[Coll[Byte]]\n          ].get == coll4, !bool3, box1.propositionBytes == coll7, box1.R4[Coll[Coll[Byte]]].get == coll4, OUTPUTS(placeholder[Int](14)).tokens(\n            placeholder[Int](15)\n          )._1 == coll4(placeholder[Int](16))\n        )\n      )\n    )\n  )}\n}',
    address:
      'FxMs5S8B9DA3Ecw7taWSSRefYESRzAmeznhb9sdp7KR2ZCe9NMzHj4PRWLimyFLvAv2nD3QtmPneFoWjVqJsgSMjV5wijdkz14a5WogmvKSbUe4WjVWuW7GLEnSnMaVZ56cdLk53pzZ7exKc5hhiAjeFJDzjjm1Dqt1RoEWgkUJuaW6Mm9FMiJhq9WYJVVEDzpkL6VYhrYWMLG3J5tB1ji7aTwTGmaCapEtRo7RCmMMMYhBssBxY4putUJxHV4RsD6k9pYMuz2jrsSRWZrUbtTLkhiifSpPCEmHNrPJiSFQSVDWr3gfqmPgkJxbxTGyz7vexUCcLqGHxMaBGsPoaSod9GNqo62Gik8eRUjr8zkuYU6tD9hfPUHCzEr6xyGbrGtrmczigHmD8a1HXh1DKu4xt8eMGws5CCgq6cFZpssQEakHtPnD3kTmsKNjM6KpnReWguNxqYERZYLhfGqTZ4vNFEmj88qTJWUzVu65DbpcGu6vzpZ93BfJ7KA7a1v',
    assets: [
      {
        tokenId:
          '3825b2b4acaaaba626440113153246c65ddb2e9df406c4a56418b5842c9f839a',
        index: 0,
        amount: 9890000,
        name: 'rptconfErgoRWTV1',
        decimals: 0,
        type: 'EIP-004',
      },
    ],
    additionalRegisters: {
      R4: {
        serializedValue:
          '1a01202228e54299db6c13479c6ced3705df36f2ed0e4e815ed7536ba99be14a13179d',
        sigmaType: 'Coll[Coll[SByte]]',
        renderedValue:
          '[2228e54299db6c13479c6ced3705df36f2ed0e4e815ed7536ba99be14a13179d]',
      },
      R5: {
        serializedValue: '1a010100',
        sigmaType: 'Coll[Coll[SByte]]',
        renderedValue: '[00]',
      },
    },
    spentTransactionId:
      'e534642150c02bf1eb6501972bd61ccd6ba3d05a4a4dd7dcb6c4a49650471507',
    mainChain: true,
  },
  {
    boxId: 'c142b0a0e4415f6ca86b37a447610b7c4b57adc40bf32548e2fb2f835709876a',
    transactionId:
      '8c494da0242fd04ecb4efd3d9de11813848c79b38592f29d579836dfbc459f96',
    blockId: 'd0504f40bf8b73d03498b28b5a5474b1089a98e88176ef9ecc473b5b9fd7be09',
    value: 1100000,
    index: 1,
    globalIndex: 32285884,
    creationHeight: 1082202,
    settlementHeight: 1082207,
    ergoTree:
      '10110400040004040400040204000e2032ee5d947cfe8db5480157ffa566b9b7d9faf41fa145c9d00628c7c1599878f60404040004000400010104000e20b466a5302d87a3e56b36613c1336c1d1643c491652235ad207853654d78034a0040404000400d806d601b2a5730000d6028cb2db6308a773010001d603aeb5b4a57302b1a5d901036391b1db630872037303d9010363aedb63087203d901054d0e938c7205017202d604e4c6a7041ad605b2a5730400d606db6308720595938cb2db63087201730500017306d196830301ef7203938cb2db6308b2a473070073080001b2720473090095ae7206d901074d0e938c720701720296830201938cb27206730a0001720293c27205c2a7730bd801d607c2a7d196830a01938cb27206730c0001720293cbc27205730de6c67205051ae6c67205060e93e4c67205070ecb720793e4c67205041a7204ef720393c27201720793e4c67201041a7204938cb2db6308b2a5730e00730f0001b27204731000',
    ergoTreeConstants:
      '0: 0\n1: 0\n2: 2\n3: 0\n4: 1\n5: 0\n6: Coll(50,-18,93,-108,124,-2,-115,-75,72,1,87,-1,-91,102,-71,-73,-39,-6,-12,31,-95,69,-55,-48,6,40,-57,-63,89,-104,120,-10)\n7: 2\n8: 0\n9: 0\n10: 0\n11: true\n12: 0\n13: Coll(-76,102,-91,48,45,-121,-93,-27,107,54,97,60,19,54,-63,-47,100,60,73,22,82,35,90,-46,7,-123,54,84,-41,-128,52,-96)\n14: 2\n15: 0\n16: 0',
    ergoTreeScript:
      '{\n  val box1 = OUTPUTS(placeholder[Int](0))\n  val coll2 = SELF.tokens(placeholder[Int](1))._1\n  val bool3 = OUTPUTS.slice(placeholder[Int](2), OUTPUTS.size).filter({(box3: Box) => box3.tokens.size > placeholder[Int](3) }).exists(\n    {(box3: Box) => box3.tokens.exists({(tuple5: (Coll[Byte], Long)) => tuple5._1 == coll2 }) }\n  )\n  val coll4 = SELF.R4[Coll[Coll[Byte]]].get\n  val box5 = OUTPUTS(placeholder[Int](4))\n  val coll6 = box5.tokens\n  if (box1.tokens(placeholder[Int](5))._1 == placeholder[Coll[Byte]](6)) {\n    sigmaProp(\n      allOf(\n        Coll[Boolean](\n          !bool3, INPUTS(placeholder[Int](7)).tokens(placeholder[Int](8))._1 == coll4(placeholder[Int](9)), if (coll6.exists(\n            {(tuple7: (Coll[Byte], Long)) => tuple7._1 == coll2 }\n          )) { allOf(Coll[Boolean](coll6(placeholder[Int](10))._1 == coll2, box5.propositionBytes == SELF.propositionBytes)) } else { placeholder[Boolean](11) }\n        )\n      )\n    )\n  } else {(\n    val coll7 = SELF.propositionBytes\n    sigmaProp(\n      allOf(\n        Coll[Boolean](\n          coll6(placeholder[Int](12))._1 == coll2, blake2b256(box5.propositionBytes) == placeholder[Coll[Byte]](13), box5.R5[\n            Coll[Coll[Byte]]\n          ].isDefined, box5.R6[Coll[Byte]].isDefined, box5.R7[Coll[Byte]].get == blake2b256(coll7), box5.R4[\n            Coll[Coll[Byte]]\n          ].get == coll4, !bool3, box1.propositionBytes == coll7, box1.R4[Coll[Coll[Byte]]].get == coll4, OUTPUTS(placeholder[Int](14)).tokens(\n            placeholder[Int](15)\n          )._1 == coll4(placeholder[Int](16))\n        )\n      )\n    )\n  )}\n}',
    address:
      'FxMs5S8B9DA3Ecw7taWSSRefYESRzAmeznhb9sdp7KR2ZCe9NMzHj4PRWLimyFLvAv2nD3QtmPneFoWjVqJsgSMjV5wijdkz14a5WogmvKSbUe4WjVWuW7GLEnSnMaVZ56cdLk53pzZ7exKc5hhiAjeFJDzjjm1Dqt1RoEWgkUJuaW6Mm9FMiJhq9WYJVVEDzpkL6VYhrYWMLG3J5tB1ji7aTwTGmaCapEtRo7RCmMMMYhBssBxY4putUJxHV4RsD6k9pYMuz2jrsSRWZrUbtTLkhiifSpPCEmHNrPJiSFQSVDWr3gfqmPgkJxbxTGyz7vexUCcLqGHxMaBGsPoaSod9GNqo62Gik8eRUjr8zkuYU6tD9hfPUHCzEr6xyGbrGtrmczigHmD8a1HXh1DKu4xt8eMGws5CCgq6cFZpssQEakHtPnD3kTmsKNjM6KpnReWguNxqYERZYLhfGqTZ4vNFEmj88qTJWUzVu65DbpcGu6vzpZ93BfJ7KA7a1v',
    assets: [
      {
        tokenId:
          '3825b2b4acaaaba626440113153246c65ddb2e9df406c4a56418b5842c9f839a',
        index: 0,
        amount: 10000,
        name: 'rptconfErgoRWTV1',
        decimals: 0,
        type: 'EIP-004',
      },
    ],
    additionalRegisters: {
      R4: {
        serializedValue:
          '1a0120e61a83c5bca59e98c21d925faff5dfc079aa438f21df08702e4c4bf2bada02dc',
        sigmaType: 'Coll[Coll[SByte]]',
        renderedValue:
          '[e61a83c5bca59e98c21d925faff5dfc079aa438f21df08702e4c4bf2bada02dc]',
      },
    },
    spentTransactionId:
      'f161792fd0cfc6c76e6eb5d0d0515b467bb98d2ad25088646b6d1ea34f336613',
    mainChain: true,
  },
  {
    boxId: 'cb6c8aabc7fe26172ee59b57360dcc0abf33ee93a0f74fab4cf0c077ea4adc7e',
    transactionId:
      '8c494da0242fd04ecb4efd3d9de11813848c79b38592f29d579836dfbc459f96',
    blockId: 'd0504f40bf8b73d03498b28b5a5474b1089a98e88176ef9ecc473b5b9fd7be09',
    value: 1100000,
    index: 2,
    globalIndex: 32285885,
    creationHeight: 1082202,
    settlementHeight: 1082207,
    ergoTree:
      '10110400040004040400040204000e2032ee5d947cfe8db5480157ffa566b9b7d9faf41fa145c9d00628c7c1599878f60404040004000400010104000e20b466a5302d87a3e56b36613c1336c1d1643c491652235ad207853654d78034a0040404000400d806d601b2a5730000d6028cb2db6308a773010001d603aeb5b4a57302b1a5d901036391b1db630872037303d9010363aedb63087203d901054d0e938c7205017202d604e4c6a7041ad605b2a5730400d606db6308720595938cb2db63087201730500017306d196830301ef7203938cb2db6308b2a473070073080001b2720473090095ae7206d901074d0e938c720701720296830201938cb27206730a0001720293c27205c2a7730bd801d607c2a7d196830a01938cb27206730c0001720293cbc27205730de6c67205051ae6c67205060e93e4c67205070ecb720793e4c67205041a7204ef720393c27201720793e4c67201041a7204938cb2db6308b2a5730e00730f0001b27204731000',
    ergoTreeConstants:
      '0: 0\n1: 0\n2: 2\n3: 0\n4: 1\n5: 0\n6: Coll(50,-18,93,-108,124,-2,-115,-75,72,1,87,-1,-91,102,-71,-73,-39,-6,-12,31,-95,69,-55,-48,6,40,-57,-63,89,-104,120,-10)\n7: 2\n8: 0\n9: 0\n10: 0\n11: true\n12: 0\n13: Coll(-76,102,-91,48,45,-121,-93,-27,107,54,97,60,19,54,-63,-47,100,60,73,22,82,35,90,-46,7,-123,54,84,-41,-128,52,-96)\n14: 2\n15: 0\n16: 0',
    ergoTreeScript:
      '{\n  val box1 = OUTPUTS(placeholder[Int](0))\n  val coll2 = SELF.tokens(placeholder[Int](1))._1\n  val bool3 = OUTPUTS.slice(placeholder[Int](2), OUTPUTS.size).filter({(box3: Box) => box3.tokens.size > placeholder[Int](3) }).exists(\n    {(box3: Box) => box3.tokens.exists({(tuple5: (Coll[Byte], Long)) => tuple5._1 == coll2 }) }\n  )\n  val coll4 = SELF.R4[Coll[Coll[Byte]]].get\n  val box5 = OUTPUTS(placeholder[Int](4))\n  val coll6 = box5.tokens\n  if (box1.tokens(placeholder[Int](5))._1 == placeholder[Coll[Byte]](6)) {\n    sigmaProp(\n      allOf(\n        Coll[Boolean](\n          !bool3, INPUTS(placeholder[Int](7)).tokens(placeholder[Int](8))._1 == coll4(placeholder[Int](9)), if (coll6.exists(\n            {(tuple7: (Coll[Byte], Long)) => tuple7._1 == coll2 }\n          )) { allOf(Coll[Boolean](coll6(placeholder[Int](10))._1 == coll2, box5.propositionBytes == SELF.propositionBytes)) } else { placeholder[Boolean](11) }\n        )\n      )\n    )\n  } else {(\n    val coll7 = SELF.propositionBytes\n    sigmaProp(\n      allOf(\n        Coll[Boolean](\n          coll6(placeholder[Int](12))._1 == coll2, blake2b256(box5.propositionBytes) == placeholder[Coll[Byte]](13), box5.R5[\n            Coll[Coll[Byte]]\n          ].isDefined, box5.R6[Coll[Byte]].isDefined, box5.R7[Coll[Byte]].get == blake2b256(coll7), box5.R4[\n            Coll[Coll[Byte]]\n          ].get == coll4, !bool3, box1.propositionBytes == coll7, box1.R4[Coll[Coll[Byte]]].get == coll4, OUTPUTS(placeholder[Int](14)).tokens(\n            placeholder[Int](15)\n          )._1 == coll4(placeholder[Int](16))\n        )\n      )\n    )\n  )}\n}',
    address:
      'FxMs5S8B9DA3Ecw7taWSSRefYESRzAmeznhb9sdp7KR2ZCe9NMzHj4PRWLimyFLvAv2nD3QtmPneFoWjVqJsgSMjV5wijdkz14a5WogmvKSbUe4WjVWuW7GLEnSnMaVZ56cdLk53pzZ7exKc5hhiAjeFJDzjjm1Dqt1RoEWgkUJuaW6Mm9FMiJhq9WYJVVEDzpkL6VYhrYWMLG3J5tB1ji7aTwTGmaCapEtRo7RCmMMMYhBssBxY4putUJxHV4RsD6k9pYMuz2jrsSRWZrUbtTLkhiifSpPCEmHNrPJiSFQSVDWr3gfqmPgkJxbxTGyz7vexUCcLqGHxMaBGsPoaSod9GNqo62Gik8eRUjr8zkuYU6tD9hfPUHCzEr6xyGbrGtrmczigHmD8a1HXh1DKu4xt8eMGws5CCgq6cFZpssQEakHtPnD3kTmsKNjM6KpnReWguNxqYERZYLhfGqTZ4vNFEmj88qTJWUzVu65DbpcGu6vzpZ93BfJ7KA7a1v',
    assets: [
      {
        tokenId:
          '3825b2b4acaaaba626440113153246c65ddb2e9df406c4a56418b5842c9f839a',
        index: 0,
        amount: 10000,
        name: 'rptconfErgoRWTV1',
        decimals: 0,
        type: 'EIP-004',
      },
    ],
    additionalRegisters: {
      R4: {
        serializedValue:
          '1a01205589db926e6760d840c919948169a559abcab58ef0d2100126e48f9d2ef12320',
        sigmaType: 'Coll[Coll[SByte]]',
        renderedValue:
          '[5589db926e6760d840c919948169a559abcab58ef0d2100126e48f9d2ef12320]',
      },
    },
    spentTransactionId:
      'd8064226d1e926a2e2abd850eb4ad43669f5096baea1dcaea2510b8bb6cd89da',
    mainChain: true,
  },
  {
    boxId: '2340d8dc7a6566e99535843570b1d796f8b76287681d4f1d020ee5b131d23b98',
    transactionId:
      '8c494da0242fd04ecb4efd3d9de11813848c79b38592f29d579836dfbc459f96',
    blockId: 'd0504f40bf8b73d03498b28b5a5474b1089a98e88176ef9ecc473b5b9fd7be09',
    value: 1100000,
    index: 3,
    globalIndex: 32285886,
    creationHeight: 1082202,
    settlementHeight: 1082207,
    ergoTree:
      '10110400040004040400040204000e2032ee5d947cfe8db5480157ffa566b9b7d9faf41fa145c9d00628c7c1599878f60404040004000400010104000e20b466a5302d87a3e56b36613c1336c1d1643c491652235ad207853654d78034a0040404000400d806d601b2a5730000d6028cb2db6308a773010001d603aeb5b4a57302b1a5d901036391b1db630872037303d9010363aedb63087203d901054d0e938c7205017202d604e4c6a7041ad605b2a5730400d606db6308720595938cb2db63087201730500017306d196830301ef7203938cb2db6308b2a473070073080001b2720473090095ae7206d901074d0e938c720701720296830201938cb27206730a0001720293c27205c2a7730bd801d607c2a7d196830a01938cb27206730c0001720293cbc27205730de6c67205051ae6c67205060e93e4c67205070ecb720793e4c67205041a7204ef720393c27201720793e4c67201041a7204938cb2db6308b2a5730e00730f0001b27204731000',
    ergoTreeConstants:
      '0: 0\n1: 0\n2: 2\n3: 0\n4: 1\n5: 0\n6: Coll(50,-18,93,-108,124,-2,-115,-75,72,1,87,-1,-91,102,-71,-73,-39,-6,-12,31,-95,69,-55,-48,6,40,-57,-63,89,-104,120,-10)\n7: 2\n8: 0\n9: 0\n10: 0\n11: true\n12: 0\n13: Coll(-76,102,-91,48,45,-121,-93,-27,107,54,97,60,19,54,-63,-47,100,60,73,22,82,35,90,-46,7,-123,54,84,-41,-128,52,-96)\n14: 2\n15: 0\n16: 0',
    ergoTreeScript:
      '{\n  val box1 = OUTPUTS(placeholder[Int](0))\n  val coll2 = SELF.tokens(placeholder[Int](1))._1\n  val bool3 = OUTPUTS.slice(placeholder[Int](2), OUTPUTS.size).filter({(box3: Box) => box3.tokens.size > placeholder[Int](3) }).exists(\n    {(box3: Box) => box3.tokens.exists({(tuple5: (Coll[Byte], Long)) => tuple5._1 == coll2 }) }\n  )\n  val coll4 = SELF.R4[Coll[Coll[Byte]]].get\n  val box5 = OUTPUTS(placeholder[Int](4))\n  val coll6 = box5.tokens\n  if (box1.tokens(placeholder[Int](5))._1 == placeholder[Coll[Byte]](6)) {\n    sigmaProp(\n      allOf(\n        Coll[Boolean](\n          !bool3, INPUTS(placeholder[Int](7)).tokens(placeholder[Int](8))._1 == coll4(placeholder[Int](9)), if (coll6.exists(\n            {(tuple7: (Coll[Byte], Long)) => tuple7._1 == coll2 }\n          )) { allOf(Coll[Boolean](coll6(placeholder[Int](10))._1 == coll2, box5.propositionBytes == SELF.propositionBytes)) } else { placeholder[Boolean](11) }\n        )\n      )\n    )\n  } else {(\n    val coll7 = SELF.propositionBytes\n    sigmaProp(\n      allOf(\n        Coll[Boolean](\n          coll6(placeholder[Int](12))._1 == coll2, blake2b256(box5.propositionBytes) == placeholder[Coll[Byte]](13), box5.R5[\n            Coll[Coll[Byte]]\n          ].isDefined, box5.R6[Coll[Byte]].isDefined, box5.R7[Coll[Byte]].get == blake2b256(coll7), box5.R4[\n            Coll[Coll[Byte]]\n          ].get == coll4, !bool3, box1.propositionBytes == coll7, box1.R4[Coll[Coll[Byte]]].get == coll4, OUTPUTS(placeholder[Int](14)).tokens(\n            placeholder[Int](15)\n          )._1 == coll4(placeholder[Int](16))\n        )\n      )\n    )\n  )}\n}',
    address:
      'FxMs5S8B9DA3Ecw7taWSSRefYESRzAmeznhb9sdp7KR2ZCe9NMzHj4PRWLimyFLvAv2nD3QtmPneFoWjVqJsgSMjV5wijdkz14a5WogmvKSbUe4WjVWuW7GLEnSnMaVZ56cdLk53pzZ7exKc5hhiAjeFJDzjjm1Dqt1RoEWgkUJuaW6Mm9FMiJhq9WYJVVEDzpkL6VYhrYWMLG3J5tB1ji7aTwTGmaCapEtRo7RCmMMMYhBssBxY4putUJxHV4RsD6k9pYMuz2jrsSRWZrUbtTLkhiifSpPCEmHNrPJiSFQSVDWr3gfqmPgkJxbxTGyz7vexUCcLqGHxMaBGsPoaSod9GNqo62Gik8eRUjr8zkuYU6tD9hfPUHCzEr6xyGbrGtrmczigHmD8a1HXh1DKu4xt8eMGws5CCgq6cFZpssQEakHtPnD3kTmsKNjM6KpnReWguNxqYERZYLhfGqTZ4vNFEmj88qTJWUzVu65DbpcGu6vzpZ93BfJ7KA7a1v',
    assets: [
      {
        tokenId:
          '3825b2b4acaaaba626440113153246c65ddb2e9df406c4a56418b5842c9f839a',
        index: 0,
        amount: 10000,
        name: 'rptconfErgoRWTV1',
        decimals: 0,
        type: 'EIP-004',
      },
    ],
    additionalRegisters: {
      R4: {
        serializedValue:
          '1a01208abd3c4a0e14dd3632919a758ccfee875cfcf8ea7e0ec85844d4188834fd602d',
        sigmaType: 'Coll[Coll[SByte]]',
        renderedValue:
          '[8abd3c4a0e14dd3632919a758ccfee875cfcf8ea7e0ec85844d4188834fd602d]',
      },
    },
    spentTransactionId:
      'd6500d10cbbb631b9a5e5c6e0df613a0d4c5d5245e3b644bbf1bed9be3149628',
    mainChain: true,
  },
  {
    boxId: '8e25d2b84394dbec0ab265392790866b3398ce7d53eede9f39af946d072bc78a',
    transactionId:
      '8c494da0242fd04ecb4efd3d9de11813848c79b38592f29d579836dfbc459f96',
    blockId: 'd0504f40bf8b73d03498b28b5a5474b1089a98e88176ef9ecc473b5b9fd7be09',
    value: 1100000,
    index: 4,
    globalIndex: 32285887,
    creationHeight: 1082202,
    settlementHeight: 1082207,
    ergoTree:
      '10110400040004040400040204000e2032ee5d947cfe8db5480157ffa566b9b7d9faf41fa145c9d00628c7c1599878f60404040004000400010104000e20b466a5302d87a3e56b36613c1336c1d1643c491652235ad207853654d78034a0040404000400d806d601b2a5730000d6028cb2db6308a773010001d603aeb5b4a57302b1a5d901036391b1db630872037303d9010363aedb63087203d901054d0e938c7205017202d604e4c6a7041ad605b2a5730400d606db6308720595938cb2db63087201730500017306d196830301ef7203938cb2db6308b2a473070073080001b2720473090095ae7206d901074d0e938c720701720296830201938cb27206730a0001720293c27205c2a7730bd801d607c2a7d196830a01938cb27206730c0001720293cbc27205730de6c67205051ae6c67205060e93e4c67205070ecb720793e4c67205041a7204ef720393c27201720793e4c67201041a7204938cb2db6308b2a5730e00730f0001b27204731000',
    ergoTreeConstants:
      '0: 0\n1: 0\n2: 2\n3: 0\n4: 1\n5: 0\n6: Coll(50,-18,93,-108,124,-2,-115,-75,72,1,87,-1,-91,102,-71,-73,-39,-6,-12,31,-95,69,-55,-48,6,40,-57,-63,89,-104,120,-10)\n7: 2\n8: 0\n9: 0\n10: 0\n11: true\n12: 0\n13: Coll(-76,102,-91,48,45,-121,-93,-27,107,54,97,60,19,54,-63,-47,100,60,73,22,82,35,90,-46,7,-123,54,84,-41,-128,52,-96)\n14: 2\n15: 0\n16: 0',
    ergoTreeScript:
      '{\n  val box1 = OUTPUTS(placeholder[Int](0))\n  val coll2 = SELF.tokens(placeholder[Int](1))._1\n  val bool3 = OUTPUTS.slice(placeholder[Int](2), OUTPUTS.size).filter({(box3: Box) => box3.tokens.size > placeholder[Int](3) }).exists(\n    {(box3: Box) => box3.tokens.exists({(tuple5: (Coll[Byte], Long)) => tuple5._1 == coll2 }) }\n  )\n  val coll4 = SELF.R4[Coll[Coll[Byte]]].get\n  val box5 = OUTPUTS(placeholder[Int](4))\n  val coll6 = box5.tokens\n  if (box1.tokens(placeholder[Int](5))._1 == placeholder[Coll[Byte]](6)) {\n    sigmaProp(\n      allOf(\n        Coll[Boolean](\n          !bool3, INPUTS(placeholder[Int](7)).tokens(placeholder[Int](8))._1 == coll4(placeholder[Int](9)), if (coll6.exists(\n            {(tuple7: (Coll[Byte], Long)) => tuple7._1 == coll2 }\n          )) { allOf(Coll[Boolean](coll6(placeholder[Int](10))._1 == coll2, box5.propositionBytes == SELF.propositionBytes)) } else { placeholder[Boolean](11) }\n        )\n      )\n    )\n  } else {(\n    val coll7 = SELF.propositionBytes\n    sigmaProp(\n      allOf(\n        Coll[Boolean](\n          coll6(placeholder[Int](12))._1 == coll2, blake2b256(box5.propositionBytes) == placeholder[Coll[Byte]](13), box5.R5[\n            Coll[Coll[Byte]]\n          ].isDefined, box5.R6[Coll[Byte]].isDefined, box5.R7[Coll[Byte]].get == blake2b256(coll7), box5.R4[\n            Coll[Coll[Byte]]\n          ].get == coll4, !bool3, box1.propositionBytes == coll7, box1.R4[Coll[Coll[Byte]]].get == coll4, OUTPUTS(placeholder[Int](14)).tokens(\n            placeholder[Int](15)\n          )._1 == coll4(placeholder[Int](16))\n        )\n      )\n    )\n  )}\n}',
    address:
      'FxMs5S8B9DA3Ecw7taWSSRefYESRzAmeznhb9sdp7KR2ZCe9NMzHj4PRWLimyFLvAv2nD3QtmPneFoWjVqJsgSMjV5wijdkz14a5WogmvKSbUe4WjVWuW7GLEnSnMaVZ56cdLk53pzZ7exKc5hhiAjeFJDzjjm1Dqt1RoEWgkUJuaW6Mm9FMiJhq9WYJVVEDzpkL6VYhrYWMLG3J5tB1ji7aTwTGmaCapEtRo7RCmMMMYhBssBxY4putUJxHV4RsD6k9pYMuz2jrsSRWZrUbtTLkhiifSpPCEmHNrPJiSFQSVDWr3gfqmPgkJxbxTGyz7vexUCcLqGHxMaBGsPoaSod9GNqo62Gik8eRUjr8zkuYU6tD9hfPUHCzEr6xyGbrGtrmczigHmD8a1HXh1DKu4xt8eMGws5CCgq6cFZpssQEakHtPnD3kTmsKNjM6KpnReWguNxqYERZYLhfGqTZ4vNFEmj88qTJWUzVu65DbpcGu6vzpZ93BfJ7KA7a1v',
    assets: [
      {
        tokenId:
          '3825b2b4acaaaba626440113153246c65ddb2e9df406c4a56418b5842c9f839a',
        index: 0,
        amount: 10000,
        name: 'rptconfErgoRWTV1',
        decimals: 0,
        type: 'EIP-004',
      },
    ],
    additionalRegisters: {
      R4: {
        serializedValue:
          '1a0120995ca29a94c2290c7648b56e4a84dafda75765c6e793c5cdcd4fba55ff261e9f',
        sigmaType: 'Coll[Coll[SByte]]',
        renderedValue:
          '[995ca29a94c2290c7648b56e4a84dafda75765c6e793c5cdcd4fba55ff261e9f]',
      },
    },
    spentTransactionId:
      '300b5c095765093bd8ef8d28730603db7a267852238da5efa286375e90025905',
    mainChain: true,
  },
  {
    boxId: 'a2fc8c4ef2daa518dd5fcab21779a5f9dad76fc7c4f5cd4ffe1ebc14391ba178',
    transactionId:
      '8c494da0242fd04ecb4efd3d9de11813848c79b38592f29d579836dfbc459f96',
    blockId: 'd0504f40bf8b73d03498b28b5a5474b1089a98e88176ef9ecc473b5b9fd7be09',
    value: 1100000,
    index: 5,
    globalIndex: 32285888,
    creationHeight: 1082202,
    settlementHeight: 1082207,
    ergoTree:
      '10110400040004040400040204000e2032ee5d947cfe8db5480157ffa566b9b7d9faf41fa145c9d00628c7c1599878f60404040004000400010104000e20b466a5302d87a3e56b36613c1336c1d1643c491652235ad207853654d78034a0040404000400d806d601b2a5730000d6028cb2db6308a773010001d603aeb5b4a57302b1a5d901036391b1db630872037303d9010363aedb63087203d901054d0e938c7205017202d604e4c6a7041ad605b2a5730400d606db6308720595938cb2db63087201730500017306d196830301ef7203938cb2db6308b2a473070073080001b2720473090095ae7206d901074d0e938c720701720296830201938cb27206730a0001720293c27205c2a7730bd801d607c2a7d196830a01938cb27206730c0001720293cbc27205730de6c67205051ae6c67205060e93e4c67205070ecb720793e4c67205041a7204ef720393c27201720793e4c67201041a7204938cb2db6308b2a5730e00730f0001b27204731000',
    ergoTreeConstants:
      '0: 0\n1: 0\n2: 2\n3: 0\n4: 1\n5: 0\n6: Coll(50,-18,93,-108,124,-2,-115,-75,72,1,87,-1,-91,102,-71,-73,-39,-6,-12,31,-95,69,-55,-48,6,40,-57,-63,89,-104,120,-10)\n7: 2\n8: 0\n9: 0\n10: 0\n11: true\n12: 0\n13: Coll(-76,102,-91,48,45,-121,-93,-27,107,54,97,60,19,54,-63,-47,100,60,73,22,82,35,90,-46,7,-123,54,84,-41,-128,52,-96)\n14: 2\n15: 0\n16: 0',
    ergoTreeScript:
      '{\n  val box1 = OUTPUTS(placeholder[Int](0))\n  val coll2 = SELF.tokens(placeholder[Int](1))._1\n  val bool3 = OUTPUTS.slice(placeholder[Int](2), OUTPUTS.size).filter({(box3: Box) => box3.tokens.size > placeholder[Int](3) }).exists(\n    {(box3: Box) => box3.tokens.exists({(tuple5: (Coll[Byte], Long)) => tuple5._1 == coll2 }) }\n  )\n  val coll4 = SELF.R4[Coll[Coll[Byte]]].get\n  val box5 = OUTPUTS(placeholder[Int](4))\n  val coll6 = box5.tokens\n  if (box1.tokens(placeholder[Int](5))._1 == placeholder[Coll[Byte]](6)) {\n    sigmaProp(\n      allOf(\n        Coll[Boolean](\n          !bool3, INPUTS(placeholder[Int](7)).tokens(placeholder[Int](8))._1 == coll4(placeholder[Int](9)), if (coll6.exists(\n            {(tuple7: (Coll[Byte], Long)) => tuple7._1 == coll2 }\n          )) { allOf(Coll[Boolean](coll6(placeholder[Int](10))._1 == coll2, box5.propositionBytes == SELF.propositionBytes)) } else { placeholder[Boolean](11) }\n        )\n      )\n    )\n  } else {(\n    val coll7 = SELF.propositionBytes\n    sigmaProp(\n      allOf(\n        Coll[Boolean](\n          coll6(placeholder[Int](12))._1 == coll2, blake2b256(box5.propositionBytes) == placeholder[Coll[Byte]](13), box5.R5[\n            Coll[Coll[Byte]]\n          ].isDefined, box5.R6[Coll[Byte]].isDefined, box5.R7[Coll[Byte]].get == blake2b256(coll7), box5.R4[\n            Coll[Coll[Byte]]\n          ].get == coll4, !bool3, box1.propositionBytes == coll7, box1.R4[Coll[Coll[Byte]]].get == coll4, OUTPUTS(placeholder[Int](14)).tokens(\n            placeholder[Int](15)\n          )._1 == coll4(placeholder[Int](16))\n        )\n      )\n    )\n  )}\n}',
    address:
      'FxMs5S8B9DA3Ecw7taWSSRefYESRzAmeznhb9sdp7KR2ZCe9NMzHj4PRWLimyFLvAv2nD3QtmPneFoWjVqJsgSMjV5wijdkz14a5WogmvKSbUe4WjVWuW7GLEnSnMaVZ56cdLk53pzZ7exKc5hhiAjeFJDzjjm1Dqt1RoEWgkUJuaW6Mm9FMiJhq9WYJVVEDzpkL6VYhrYWMLG3J5tB1ji7aTwTGmaCapEtRo7RCmMMMYhBssBxY4putUJxHV4RsD6k9pYMuz2jrsSRWZrUbtTLkhiifSpPCEmHNrPJiSFQSVDWr3gfqmPgkJxbxTGyz7vexUCcLqGHxMaBGsPoaSod9GNqo62Gik8eRUjr8zkuYU6tD9hfPUHCzEr6xyGbrGtrmczigHmD8a1HXh1DKu4xt8eMGws5CCgq6cFZpssQEakHtPnD3kTmsKNjM6KpnReWguNxqYERZYLhfGqTZ4vNFEmj88qTJWUzVu65DbpcGu6vzpZ93BfJ7KA7a1v',
    assets: [
      {
        tokenId:
          '3825b2b4acaaaba626440113153246c65ddb2e9df406c4a56418b5842c9f839a',
        index: 0,
        amount: 10000,
        name: 'rptconfErgoRWTV1',
        decimals: 0,
        type: 'EIP-004',
      },
    ],
    additionalRegisters: {
      R4: {
        serializedValue:
          '1a0120aba9cf9df2a03cc07c1adc7515d4d70346c93bd7a250525536a90008f73d289d',
        sigmaType: 'Coll[Coll[SByte]]',
        renderedValue:
          '[aba9cf9df2a03cc07c1adc7515d4d70346c93bd7a250525536a90008f73d289d]',
      },
    },
    spentTransactionId:
      '163b71aede5b9a38d0517bbef11aa31297fac90bdfd92708055d7980c03a112a',
    mainChain: true,
  },
  {
    boxId: '17fdf2a040e107a44777db9617a00b1283de5b564c962091ce9c39daef2ceb43',
    transactionId:
      '83243ae9a7456b22a76d2946c1ebc2587aebdf69765d17e0a4e77dbea0b59c4d',
    blockId: '87d97620f8ac592b9126e1719d11cc96b38ba111daa7ab3aa661e5f3476a017b',
    value: 1100000,
    index: 0,
    globalIndex: 32139364,
    creationHeight: 1078090,
    settlementHeight: 1078610,
    ergoTree:
      '10110400040004040400040204000e2032ee5d947cfe8db5480157ffa566b9b7d9faf41fa145c9d00628c7c1599878f60404040004000400010104000e20b466a5302d87a3e56b36613c1336c1d1643c491652235ad207853654d78034a0040404000400d806d601b2a5730000d6028cb2db6308a773010001d603aeb5b4a57302b1a5d901036391b1db630872037303d9010363aedb63087203d901054d0e938c7205017202d604e4c6a7041ad605b2a5730400d606db6308720595938cb2db63087201730500017306d196830301ef7203938cb2db6308b2a473070073080001b2720473090095ae7206d901074d0e938c720701720296830201938cb27206730a0001720293c27205c2a7730bd801d607c2a7d196830a01938cb27206730c0001720293cbc27205730de6c67205051ae6c67205060e93e4c67205070ecb720793e4c67205041a7204ef720393c27201720793e4c67201041a7204938cb2db6308b2a5730e00730f0001b27204731000',
    ergoTreeConstants:
      '0: 0\n1: 0\n2: 2\n3: 0\n4: 1\n5: 0\n6: Coll(50,-18,93,-108,124,-2,-115,-75,72,1,87,-1,-91,102,-71,-73,-39,-6,-12,31,-95,69,-55,-48,6,40,-57,-63,89,-104,120,-10)\n7: 2\n8: 0\n9: 0\n10: 0\n11: true\n12: 0\n13: Coll(-76,102,-91,48,45,-121,-93,-27,107,54,97,60,19,54,-63,-47,100,60,73,22,82,35,90,-46,7,-123,54,84,-41,-128,52,-96)\n14: 2\n15: 0\n16: 0',
    ergoTreeScript:
      '{\n  val box1 = OUTPUTS(placeholder[Int](0))\n  val coll2 = SELF.tokens(placeholder[Int](1))._1\n  val bool3 = OUTPUTS.slice(placeholder[Int](2), OUTPUTS.size).filter({(box3: Box) => box3.tokens.size > placeholder[Int](3) }).exists(\n    {(box3: Box) => box3.tokens.exists({(tuple5: (Coll[Byte], Long)) => tuple5._1 == coll2 }) }\n  )\n  val coll4 = SELF.R4[Coll[Coll[Byte]]].get\n  val box5 = OUTPUTS(placeholder[Int](4))\n  val coll6 = box5.tokens\n  if (box1.tokens(placeholder[Int](5))._1 == placeholder[Coll[Byte]](6)) {\n    sigmaProp(\n      allOf(\n        Coll[Boolean](\n          !bool3, INPUTS(placeholder[Int](7)).tokens(placeholder[Int](8))._1 == coll4(placeholder[Int](9)), if (coll6.exists(\n            {(tuple7: (Coll[Byte], Long)) => tuple7._1 == coll2 }\n          )) { allOf(Coll[Boolean](coll6(placeholder[Int](10))._1 == coll2, box5.propositionBytes == SELF.propositionBytes)) } else { placeholder[Boolean](11) }\n        )\n      )\n    )\n  } else {(\n    val coll7 = SELF.propositionBytes\n    sigmaProp(\n      allOf(\n        Coll[Boolean](\n          coll6(placeholder[Int](12))._1 == coll2, blake2b256(box5.propositionBytes) == placeholder[Coll[Byte]](13), box5.R5[\n            Coll[Coll[Byte]]\n          ].isDefined, box5.R6[Coll[Byte]].isDefined, box5.R7[Coll[Byte]].get == blake2b256(coll7), box5.R4[\n            Coll[Coll[Byte]]\n          ].get == coll4, !bool3, box1.propositionBytes == coll7, box1.R4[Coll[Coll[Byte]]].get == coll4, OUTPUTS(placeholder[Int](14)).tokens(\n            placeholder[Int](15)\n          )._1 == coll4(placeholder[Int](16))\n        )\n      )\n    )\n  )}\n}',
    address:
      'FxMs5S8B9DA3Ecw7taWSSRefYESRzAmeznhb9sdp7KR2ZCe9NMzHj4PRWLimyFLvAv2nD3QtmPneFoWjVqJsgSMjV5wijdkz14a5WogmvKSbUe4WjVWuW7GLEnSnMaVZ56cdLk53pzZ7exKc5hhiAjeFJDzjjm1Dqt1RoEWgkUJuaW6Mm9FMiJhq9WYJVVEDzpkL6VYhrYWMLG3J5tB1ji7aTwTGmaCapEtRo7RCmMMMYhBssBxY4putUJxHV4RsD6k9pYMuz2jrsSRWZrUbtTLkhiifSpPCEmHNrPJiSFQSVDWr3gfqmPgkJxbxTGyz7vexUCcLqGHxMaBGsPoaSod9GNqo62Gik8eRUjr8zkuYU6tD9hfPUHCzEr6xyGbrGtrmczigHmD8a1HXh1DKu4xt8eMGws5CCgq6cFZpssQEakHtPnD3kTmsKNjM6KpnReWguNxqYERZYLhfGqTZ4vNFEmj88qTJWUzVu65DbpcGu6vzpZ93BfJ7KA7a1v',
    assets: [
      {
        tokenId:
          '3825b2b4acaaaba626440113153246c65ddb2e9df406c4a56418b5842c9f839a',
        index: 0,
        amount: 9900000,
        name: 'rptconfErgoRWTV1',
        decimals: 0,
        type: 'EIP-004',
      },
    ],
    additionalRegisters: {
      R4: {
        serializedValue:
          '1a01202228e54299db6c13479c6ced3705df36f2ed0e4e815ed7536ba99be14a13179d',
        sigmaType: 'Coll[Coll[SByte]]',
        renderedValue:
          '[2228e54299db6c13479c6ced3705df36f2ed0e4e815ed7536ba99be14a13179d]',
      },
      R5: {
        serializedValue: '1a010100',
        sigmaType: 'Coll[Coll[SByte]]',
        renderedValue: '[00]',
      },
    },
    spentTransactionId:
      '8654c11854d887dcc0879f1dc4bd501db39f3d9dcaba06de39fad9405aa2ed45',
    mainChain: true,
  },
  {
    boxId: '7a505d4df113a6b06f5e0bef6d326387d4cc0649f76bcc83c3fa579daefa7d51',
    transactionId:
      '462160e7ed4878a785b4b779c6e7095458cb8b3602b2e1c08bfab599c0723290',
    blockId: 'b56075693c24c489c2fe03b51f3bb07bba83da0acaef61815cac7c9d3dafe546',
    value: 1100000,
    index: 0,
    globalIndex: 32119046,
    creationHeight: 1078066,
    settlementHeight: 1078070,
    ergoTree:
      '10110400040004040400040204000e2032ee5d947cfe8db5480157ffa566b9b7d9faf41fa145c9d00628c7c1599878f60404040004000400010104000e20b466a5302d87a3e56b36613c1336c1d1643c491652235ad207853654d78034a0040404000400d806d601b2a5730000d6028cb2db6308a773010001d603aeb5b4a57302b1a5d901036391b1db630872037303d9010363aedb63087203d901054d0e938c7205017202d604e4c6a7041ad605b2a5730400d606db6308720595938cb2db63087201730500017306d196830301ef7203938cb2db6308b2a473070073080001b2720473090095ae7206d901074d0e938c720701720296830201938cb27206730a0001720293c27205c2a7730bd801d607c2a7d196830a01938cb27206730c0001720293cbc27205730de6c67205051ae6c67205060e93e4c67205070ecb720793e4c67205041a7204ef720393c27201720793e4c67201041a7204938cb2db6308b2a5730e00730f0001b27204731000',
    ergoTreeConstants:
      '0: 0\n1: 0\n2: 2\n3: 0\n4: 1\n5: 0\n6: Coll(50,-18,93,-108,124,-2,-115,-75,72,1,87,-1,-91,102,-71,-73,-39,-6,-12,31,-95,69,-55,-48,6,40,-57,-63,89,-104,120,-10)\n7: 2\n8: 0\n9: 0\n10: 0\n11: true\n12: 0\n13: Coll(-76,102,-91,48,45,-121,-93,-27,107,54,97,60,19,54,-63,-47,100,60,73,22,82,35,90,-46,7,-123,54,84,-41,-128,52,-96)\n14: 2\n15: 0\n16: 0',
    ergoTreeScript:
      '{\n  val box1 = OUTPUTS(placeholder[Int](0))\n  val coll2 = SELF.tokens(placeholder[Int](1))._1\n  val bool3 = OUTPUTS.slice(placeholder[Int](2), OUTPUTS.size).filter({(box3: Box) => box3.tokens.size > placeholder[Int](3) }).exists(\n    {(box3: Box) => box3.tokens.exists({(tuple5: (Coll[Byte], Long)) => tuple5._1 == coll2 }) }\n  )\n  val coll4 = SELF.R4[Coll[Coll[Byte]]].get\n  val box5 = OUTPUTS(placeholder[Int](4))\n  val coll6 = box5.tokens\n  if (box1.tokens(placeholder[Int](5))._1 == placeholder[Coll[Byte]](6)) {\n    sigmaProp(\n      allOf(\n        Coll[Boolean](\n          !bool3, INPUTS(placeholder[Int](7)).tokens(placeholder[Int](8))._1 == coll4(placeholder[Int](9)), if (coll6.exists(\n            {(tuple7: (Coll[Byte], Long)) => tuple7._1 == coll2 }\n          )) { allOf(Coll[Boolean](coll6(placeholder[Int](10))._1 == coll2, box5.propositionBytes == SELF.propositionBytes)) } else { placeholder[Boolean](11) }\n        )\n      )\n    )\n  } else {(\n    val coll7 = SELF.propositionBytes\n    sigmaProp(\n      allOf(\n        Coll[Boolean](\n          coll6(placeholder[Int](12))._1 == coll2, blake2b256(box5.propositionBytes) == placeholder[Coll[Byte]](13), box5.R5[\n            Coll[Coll[Byte]]\n          ].isDefined, box5.R6[Coll[Byte]].isDefined, box5.R7[Coll[Byte]].get == blake2b256(coll7), box5.R4[\n            Coll[Coll[Byte]]\n          ].get == coll4, !bool3, box1.propositionBytes == coll7, box1.R4[Coll[Coll[Byte]]].get == coll4, OUTPUTS(placeholder[Int](14)).tokens(\n            placeholder[Int](15)\n          )._1 == coll4(placeholder[Int](16))\n        )\n      )\n    )\n  )}\n}',
    address:
      'FxMs5S8B9DA3Ecw7taWSSRefYESRzAmeznhb9sdp7KR2ZCe9NMzHj4PRWLimyFLvAv2nD3QtmPneFoWjVqJsgSMjV5wijdkz14a5WogmvKSbUe4WjVWuW7GLEnSnMaVZ56cdLk53pzZ7exKc5hhiAjeFJDzjjm1Dqt1RoEWgkUJuaW6Mm9FMiJhq9WYJVVEDzpkL6VYhrYWMLG3J5tB1ji7aTwTGmaCapEtRo7RCmMMMYhBssBxY4putUJxHV4RsD6k9pYMuz2jrsSRWZrUbtTLkhiifSpPCEmHNrPJiSFQSVDWr3gfqmPgkJxbxTGyz7vexUCcLqGHxMaBGsPoaSod9GNqo62Gik8eRUjr8zkuYU6tD9hfPUHCzEr6xyGbrGtrmczigHmD8a1HXh1DKu4xt8eMGws5CCgq6cFZpssQEakHtPnD3kTmsKNjM6KpnReWguNxqYERZYLhfGqTZ4vNFEmj88qTJWUzVu65DbpcGu6vzpZ93BfJ7KA7a1v',
    assets: [
      {
        tokenId:
          '3825b2b4acaaaba626440113153246c65ddb2e9df406c4a56418b5842c9f839a',
        index: 0,
        amount: 10000,
        name: 'rptconfErgoRWTV1',
        decimals: 0,
        type: 'EIP-004',
      },
    ],
    additionalRegisters: {
      R4: {
        serializedValue:
          '1a0120e61a83c5bca59e98c21d925faff5dfc079aa438f21df08702e4c4bf2bada02dc',
        sigmaType: 'Coll[Coll[SByte]]',
        renderedValue:
          '[e61a83c5bca59e98c21d925faff5dfc079aa438f21df08702e4c4bf2bada02dc]',
      },
      R5: {
        serializedValue: '1a010100',
        sigmaType: 'Coll[Coll[SByte]]',
        renderedValue: '[00]',
      },
    },
    spentTransactionId:
      '58008c9907b27fdc141df6ad09ebdd1441bdbd2bdc4969dd7d6d9f1273775670',
    mainChain: true,
  },
  {
    boxId: '58b4a21a0ab93f8782aa82050377ff4f058f1f4a9d0ad0957ecc84e9eb48b406',
    transactionId:
      '979b272841a7bcb196064202192673a2049b04d923a420423a0710442341f7aa',
    blockId: 'a95ddedb1099fa9c8160668daa4454f73b44d71b459172ae0f664343702d421e',
    value: 1100000,
    index: 0,
    globalIndex: 32094619,
    creationHeight: 1077282,
    settlementHeight: 1077284,
    ergoTree:
      '10110400040004040400040204000e2032ee5d947cfe8db5480157ffa566b9b7d9faf41fa145c9d00628c7c1599878f60404040004000400010104000e20b466a5302d87a3e56b36613c1336c1d1643c491652235ad207853654d78034a0040404000400d806d601b2a5730000d6028cb2db6308a773010001d603aeb5b4a57302b1a5d901036391b1db630872037303d9010363aedb63087203d901054d0e938c7205017202d604e4c6a7041ad605b2a5730400d606db6308720595938cb2db63087201730500017306d196830301ef7203938cb2db6308b2a473070073080001b2720473090095ae7206d901074d0e938c720701720296830201938cb27206730a0001720293c27205c2a7730bd801d607c2a7d196830a01938cb27206730c0001720293cbc27205730de6c67205051ae6c67205060e93e4c67205070ecb720793e4c67205041a7204ef720393c27201720793e4c67201041a7204938cb2db6308b2a5730e00730f0001b27204731000',
    ergoTreeConstants:
      '0: 0\n1: 0\n2: 2\n3: 0\n4: 1\n5: 0\n6: Coll(50,-18,93,-108,124,-2,-115,-75,72,1,87,-1,-91,102,-71,-73,-39,-6,-12,31,-95,69,-55,-48,6,40,-57,-63,89,-104,120,-10)\n7: 2\n8: 0\n9: 0\n10: 0\n11: true\n12: 0\n13: Coll(-76,102,-91,48,45,-121,-93,-27,107,54,97,60,19,54,-63,-47,100,60,73,22,82,35,90,-46,7,-123,54,84,-41,-128,52,-96)\n14: 2\n15: 0\n16: 0',
    ergoTreeScript:
      '{\n  val box1 = OUTPUTS(placeholder[Int](0))\n  val coll2 = SELF.tokens(placeholder[Int](1))._1\n  val bool3 = OUTPUTS.slice(placeholder[Int](2), OUTPUTS.size).filter({(box3: Box) => box3.tokens.size > placeholder[Int](3) }).exists(\n    {(box3: Box) => box3.tokens.exists({(tuple5: (Coll[Byte], Long)) => tuple5._1 == coll2 }) }\n  )\n  val coll4 = SELF.R4[Coll[Coll[Byte]]].get\n  val box5 = OUTPUTS(placeholder[Int](4))\n  val coll6 = box5.tokens\n  if (box1.tokens(placeholder[Int](5))._1 == placeholder[Coll[Byte]](6)) {\n    sigmaProp(\n      allOf(\n        Coll[Boolean](\n          !bool3, INPUTS(placeholder[Int](7)).tokens(placeholder[Int](8))._1 == coll4(placeholder[Int](9)), if (coll6.exists(\n            {(tuple7: (Coll[Byte], Long)) => tuple7._1 == coll2 }\n          )) { allOf(Coll[Boolean](coll6(placeholder[Int](10))._1 == coll2, box5.propositionBytes == SELF.propositionBytes)) } else { placeholder[Boolean](11) }\n        )\n      )\n    )\n  } else {(\n    val coll7 = SELF.propositionBytes\n    sigmaProp(\n      allOf(\n        Coll[Boolean](\n          coll6(placeholder[Int](12))._1 == coll2, blake2b256(box5.propositionBytes) == placeholder[Coll[Byte]](13), box5.R5[\n            Coll[Coll[Byte]]\n          ].isDefined, box5.R6[Coll[Byte]].isDefined, box5.R7[Coll[Byte]].get == blake2b256(coll7), box5.R4[\n            Coll[Coll[Byte]]\n          ].get == coll4, !bool3, box1.propositionBytes == coll7, box1.R4[Coll[Coll[Byte]]].get == coll4, OUTPUTS(placeholder[Int](14)).tokens(\n            placeholder[Int](15)\n          )._1 == coll4(placeholder[Int](16))\n        )\n      )\n    )\n  )}\n}',
    address:
      'FxMs5S8B9DA3Ecw7taWSSRefYESRzAmeznhb9sdp7KR2ZCe9NMzHj4PRWLimyFLvAv2nD3QtmPneFoWjVqJsgSMjV5wijdkz14a5WogmvKSbUe4WjVWuW7GLEnSnMaVZ56cdLk53pzZ7exKc5hhiAjeFJDzjjm1Dqt1RoEWgkUJuaW6Mm9FMiJhq9WYJVVEDzpkL6VYhrYWMLG3J5tB1ji7aTwTGmaCapEtRo7RCmMMMYhBssBxY4putUJxHV4RsD6k9pYMuz2jrsSRWZrUbtTLkhiifSpPCEmHNrPJiSFQSVDWr3gfqmPgkJxbxTGyz7vexUCcLqGHxMaBGsPoaSod9GNqo62Gik8eRUjr8zkuYU6tD9hfPUHCzEr6xyGbrGtrmczigHmD8a1HXh1DKu4xt8eMGws5CCgq6cFZpssQEakHtPnD3kTmsKNjM6KpnReWguNxqYERZYLhfGqTZ4vNFEmj88qTJWUzVu65DbpcGu6vzpZ93BfJ7KA7a1v',
    assets: [
      {
        tokenId:
          '3825b2b4acaaaba626440113153246c65ddb2e9df406c4a56418b5842c9f839a',
        index: 0,
        amount: 10000,
        name: 'rptconfErgoRWTV1',
        decimals: 0,
        type: 'EIP-004',
      },
    ],
    additionalRegisters: {
      R4: {
        serializedValue:
          '1a01202228e54299db6c13479c6ced3705df36f2ed0e4e815ed7536ba99be14a13179d',
        sigmaType: 'Coll[Coll[SByte]]',
        renderedValue:
          '[2228e54299db6c13479c6ced3705df36f2ed0e4e815ed7536ba99be14a13179d]',
      },
      R5: {
        serializedValue: '1a010100',
        sigmaType: 'Coll[Coll[SByte]]',
        renderedValue: '[00]',
      },
    },
    spentTransactionId:
      '83243ae9a7456b22a76d2946c1ebc2587aebdf69765d17e0a4e77dbea0b59c4d',
    mainChain: true,
  },
  {
    boxId: '67f251747f377695adc6ffb52852166df7ba776b08295d29f429621bb34f0db1',
    transactionId:
      'b840f33cfc596a301ec12a7ad6cc6f8c40dd96d877f55c7d89aae8e3d39ed4d7',
    blockId: '5b0fed71c924fa56b62453b257025cc3f6fb456a5ff3775edbcdb4adbc2f3d5e',
    value: 1100000,
    index: 6,
    globalIndex: 31997753,
    creationHeight: 1074536,
    settlementHeight: 1074543,
    ergoTree:
      '10110400040004040400040204000e2032ee5d947cfe8db5480157ffa566b9b7d9faf41fa145c9d00628c7c1599878f60404040004000400010104000e20b466a5302d87a3e56b36613c1336c1d1643c491652235ad207853654d78034a0040404000400d806d601b2a5730000d6028cb2db6308a773010001d603aeb5b4a57302b1a5d901036391b1db630872037303d9010363aedb63087203d901054d0e938c7205017202d604e4c6a7041ad605b2a5730400d606db6308720595938cb2db63087201730500017306d196830301ef7203938cb2db6308b2a473070073080001b2720473090095ae7206d901074d0e938c720701720296830201938cb27206730a0001720293c27205c2a7730bd801d607c2a7d196830a01938cb27206730c0001720293cbc27205730de6c67205051ae6c67205060e93e4c67205070ecb720793e4c67205041a7204ef720393c27201720793e4c67201041a7204938cb2db6308b2a5730e00730f0001b27204731000',
    ergoTreeConstants:
      '0: 0\n1: 0\n2: 2\n3: 0\n4: 1\n5: 0\n6: Coll(50,-18,93,-108,124,-2,-115,-75,72,1,87,-1,-91,102,-71,-73,-39,-6,-12,31,-95,69,-55,-48,6,40,-57,-63,89,-104,120,-10)\n7: 2\n8: 0\n9: 0\n10: 0\n11: true\n12: 0\n13: Coll(-76,102,-91,48,45,-121,-93,-27,107,54,97,60,19,54,-63,-47,100,60,73,22,82,35,90,-46,7,-123,54,84,-41,-128,52,-96)\n14: 2\n15: 0\n16: 0',
    ergoTreeScript:
      '{\n  val box1 = OUTPUTS(placeholder[Int](0))\n  val coll2 = SELF.tokens(placeholder[Int](1))._1\n  val bool3 = OUTPUTS.slice(placeholder[Int](2), OUTPUTS.size).filter({(box3: Box) => box3.tokens.size > placeholder[Int](3) }).exists(\n    {(box3: Box) => box3.tokens.exists({(tuple5: (Coll[Byte], Long)) => tuple5._1 == coll2 }) }\n  )\n  val coll4 = SELF.R4[Coll[Coll[Byte]]].get\n  val box5 = OUTPUTS(placeholder[Int](4))\n  val coll6 = box5.tokens\n  if (box1.tokens(placeholder[Int](5))._1 == placeholder[Coll[Byte]](6)) {\n    sigmaProp(\n      allOf(\n        Coll[Boolean](\n          !bool3, INPUTS(placeholder[Int](7)).tokens(placeholder[Int](8))._1 == coll4(placeholder[Int](9)), if (coll6.exists(\n            {(tuple7: (Coll[Byte], Long)) => tuple7._1 == coll2 }\n          )) { allOf(Coll[Boolean](coll6(placeholder[Int](10))._1 == coll2, box5.propositionBytes == SELF.propositionBytes)) } else { placeholder[Boolean](11) }\n        )\n      )\n    )\n  } else {(\n    val coll7 = SELF.propositionBytes\n    sigmaProp(\n      allOf(\n        Coll[Boolean](\n          coll6(placeholder[Int](12))._1 == coll2, blake2b256(box5.propositionBytes) == placeholder[Coll[Byte]](13), box5.R5[\n            Coll[Coll[Byte]]\n          ].isDefined, box5.R6[Coll[Byte]].isDefined, box5.R7[Coll[Byte]].get == blake2b256(coll7), box5.R4[\n            Coll[Coll[Byte]]\n          ].get == coll4, !bool3, box1.propositionBytes == coll7, box1.R4[Coll[Coll[Byte]]].get == coll4, OUTPUTS(placeholder[Int](14)).tokens(\n            placeholder[Int](15)\n          )._1 == coll4(placeholder[Int](16))\n        )\n      )\n    )\n  )}\n}',
    address:
      'FxMs5S8B9DA3Ecw7taWSSRefYESRzAmeznhb9sdp7KR2ZCe9NMzHj4PRWLimyFLvAv2nD3QtmPneFoWjVqJsgSMjV5wijdkz14a5WogmvKSbUe4WjVWuW7GLEnSnMaVZ56cdLk53pzZ7exKc5hhiAjeFJDzjjm1Dqt1RoEWgkUJuaW6Mm9FMiJhq9WYJVVEDzpkL6VYhrYWMLG3J5tB1ji7aTwTGmaCapEtRo7RCmMMMYhBssBxY4putUJxHV4RsD6k9pYMuz2jrsSRWZrUbtTLkhiifSpPCEmHNrPJiSFQSVDWr3gfqmPgkJxbxTGyz7vexUCcLqGHxMaBGsPoaSod9GNqo62Gik8eRUjr8zkuYU6tD9hfPUHCzEr6xyGbrGtrmczigHmD8a1HXh1DKu4xt8eMGws5CCgq6cFZpssQEakHtPnD3kTmsKNjM6KpnReWguNxqYERZYLhfGqTZ4vNFEmj88qTJWUzVu65DbpcGu6vzpZ93BfJ7KA7a1v',
    assets: [
      {
        tokenId:
          '3825b2b4acaaaba626440113153246c65ddb2e9df406c4a56418b5842c9f839a',
        index: 0,
        amount: 10000,
        name: 'rptconfErgoRWTV1',
        decimals: 0,
        type: 'EIP-004',
      },
      {
        tokenId:
          'f8fe64d3d94d4eb193ea9d6304646db67bd914ed42cebd3a4f614d9d9de75cf0',
        index: 1,
        amount: 114,
        name: 'rptconfRSNV1',
        decimals: 3,
        type: 'EIP-004',
      },
    ],
    additionalRegisters: {
      R4: {
        serializedValue:
          '1a0120e61a83c5bca59e98c21d925faff5dfc079aa438f21df08702e4c4bf2bada02dc',
        sigmaType: 'Coll[Coll[SByte]]',
        renderedValue:
          '[e61a83c5bca59e98c21d925faff5dfc079aa438f21df08702e4c4bf2bada02dc]',
      },
    },
    spentTransactionId:
      '58008c9907b27fdc141df6ad09ebdd1441bdbd2bdc4969dd7d6d9f1273775670',
    mainChain: true,
  },
  {
    boxId: 'f7f98ff004825f078d3f40304b5ae35d251c82d8ce414bc2b2f6a586c891d3fe',
    transactionId:
      '397345bdf0838ba91ca630b8a21d6004a52d43301c2ccd9e6cfef2010daa4e20',
    blockId: '5b0fed71c924fa56b62453b257025cc3f6fb456a5ff3775edbcdb4adbc2f3d5e',
    value: 1100000,
    index: 0,
    globalIndex: 31997758,
    creationHeight: 1074536,
    settlementHeight: 1074543,
    ergoTree:
      '10110400040004040400040204000e2032ee5d947cfe8db5480157ffa566b9b7d9faf41fa145c9d00628c7c1599878f60404040004000400010104000e20b466a5302d87a3e56b36613c1336c1d1643c491652235ad207853654d78034a0040404000400d806d601b2a5730000d6028cb2db6308a773010001d603aeb5b4a57302b1a5d901036391b1db630872037303d9010363aedb63087203d901054d0e938c7205017202d604e4c6a7041ad605b2a5730400d606db6308720595938cb2db63087201730500017306d196830301ef7203938cb2db6308b2a473070073080001b2720473090095ae7206d901074d0e938c720701720296830201938cb27206730a0001720293c27205c2a7730bd801d607c2a7d196830a01938cb27206730c0001720293cbc27205730de6c67205051ae6c67205060e93e4c67205070ecb720793e4c67205041a7204ef720393c27201720793e4c67201041a7204938cb2db6308b2a5730e00730f0001b27204731000',
    ergoTreeConstants:
      '0: 0\n1: 0\n2: 2\n3: 0\n4: 1\n5: 0\n6: Coll(50,-18,93,-108,124,-2,-115,-75,72,1,87,-1,-91,102,-71,-73,-39,-6,-12,31,-95,69,-55,-48,6,40,-57,-63,89,-104,120,-10)\n7: 2\n8: 0\n9: 0\n10: 0\n11: true\n12: 0\n13: Coll(-76,102,-91,48,45,-121,-93,-27,107,54,97,60,19,54,-63,-47,100,60,73,22,82,35,90,-46,7,-123,54,84,-41,-128,52,-96)\n14: 2\n15: 0\n16: 0',
    ergoTreeScript:
      '{\n  val box1 = OUTPUTS(placeholder[Int](0))\n  val coll2 = SELF.tokens(placeholder[Int](1))._1\n  val bool3 = OUTPUTS.slice(placeholder[Int](2), OUTPUTS.size).filter({(box3: Box) => box3.tokens.size > placeholder[Int](3) }).exists(\n    {(box3: Box) => box3.tokens.exists({(tuple5: (Coll[Byte], Long)) => tuple5._1 == coll2 }) }\n  )\n  val coll4 = SELF.R4[Coll[Coll[Byte]]].get\n  val box5 = OUTPUTS(placeholder[Int](4))\n  val coll6 = box5.tokens\n  if (box1.tokens(placeholder[Int](5))._1 == placeholder[Coll[Byte]](6)) {\n    sigmaProp(\n      allOf(\n        Coll[Boolean](\n          !bool3, INPUTS(placeholder[Int](7)).tokens(placeholder[Int](8))._1 == coll4(placeholder[Int](9)), if (coll6.exists(\n            {(tuple7: (Coll[Byte], Long)) => tuple7._1 == coll2 }\n          )) { allOf(Coll[Boolean](coll6(placeholder[Int](10))._1 == coll2, box5.propositionBytes == SELF.propositionBytes)) } else { placeholder[Boolean](11) }\n        )\n      )\n    )\n  } else {(\n    val coll7 = SELF.propositionBytes\n    sigmaProp(\n      allOf(\n        Coll[Boolean](\n          coll6(placeholder[Int](12))._1 == coll2, blake2b256(box5.propositionBytes) == placeholder[Coll[Byte]](13), box5.R5[\n            Coll[Coll[Byte]]\n          ].isDefined, box5.R6[Coll[Byte]].isDefined, box5.R7[Coll[Byte]].get == blake2b256(coll7), box5.R4[\n            Coll[Coll[Byte]]\n          ].get == coll4, !bool3, box1.propositionBytes == coll7, box1.R4[Coll[Coll[Byte]]].get == coll4, OUTPUTS(placeholder[Int](14)).tokens(\n            placeholder[Int](15)\n          )._1 == coll4(placeholder[Int](16))\n        )\n      )\n    )\n  )}\n}',
    address:
      'FxMs5S8B9DA3Ecw7taWSSRefYESRzAmeznhb9sdp7KR2ZCe9NMzHj4PRWLimyFLvAv2nD3QtmPneFoWjVqJsgSMjV5wijdkz14a5WogmvKSbUe4WjVWuW7GLEnSnMaVZ56cdLk53pzZ7exKc5hhiAjeFJDzjjm1Dqt1RoEWgkUJuaW6Mm9FMiJhq9WYJVVEDzpkL6VYhrYWMLG3J5tB1ji7aTwTGmaCapEtRo7RCmMMMYhBssBxY4putUJxHV4RsD6k9pYMuz2jrsSRWZrUbtTLkhiifSpPCEmHNrPJiSFQSVDWr3gfqmPgkJxbxTGyz7vexUCcLqGHxMaBGsPoaSod9GNqo62Gik8eRUjr8zkuYU6tD9hfPUHCzEr6xyGbrGtrmczigHmD8a1HXh1DKu4xt8eMGws5CCgq6cFZpssQEakHtPnD3kTmsKNjM6KpnReWguNxqYERZYLhfGqTZ4vNFEmj88qTJWUzVu65DbpcGu6vzpZ93BfJ7KA7a1v',
    assets: [
      {
        tokenId:
          '3825b2b4acaaaba626440113153246c65ddb2e9df406c4a56418b5842c9f839a',
        index: 0,
        amount: 10000,
        name: 'rptconfErgoRWTV1',
        decimals: 0,
        type: 'EIP-004',
      },
    ],
    additionalRegisters: {
      R4: {
        serializedValue:
          '1a0120d050d5e741b9e18bedb81be435f893c8c6ae32ecbbf88554480df8cb9cc0d589',
        sigmaType: 'Coll[Coll[SByte]]',
        renderedValue:
          '[d050d5e741b9e18bedb81be435f893c8c6ae32ecbbf88554480df8cb9cc0d589]',
      },
    },
    spentTransactionId:
      'c7ea5a6ce622689097b7a1c633c52f0ab7f62bdb7a67ef7b5ea382207a78fdc2',
    mainChain: true,
  },
  {
    boxId: 'c04506301eda61fdb7f23e43affaf2a92353f341e45618e7eb2f17214bf4e859',
    transactionId:
      '397345bdf0838ba91ca630b8a21d6004a52d43301c2ccd9e6cfef2010daa4e20',
    blockId: '5b0fed71c924fa56b62453b257025cc3f6fb456a5ff3775edbcdb4adbc2f3d5e',
    value: 1100000,
    index: 1,
    globalIndex: 31997759,
    creationHeight: 1074536,
    settlementHeight: 1074543,
    ergoTree:
      '10110400040004040400040204000e2032ee5d947cfe8db5480157ffa566b9b7d9faf41fa145c9d00628c7c1599878f60404040004000400010104000e20b466a5302d87a3e56b36613c1336c1d1643c491652235ad207853654d78034a0040404000400d806d601b2a5730000d6028cb2db6308a773010001d603aeb5b4a57302b1a5d901036391b1db630872037303d9010363aedb63087203d901054d0e938c7205017202d604e4c6a7041ad605b2a5730400d606db6308720595938cb2db63087201730500017306d196830301ef7203938cb2db6308b2a473070073080001b2720473090095ae7206d901074d0e938c720701720296830201938cb27206730a0001720293c27205c2a7730bd801d607c2a7d196830a01938cb27206730c0001720293cbc27205730de6c67205051ae6c67205060e93e4c67205070ecb720793e4c67205041a7204ef720393c27201720793e4c67201041a7204938cb2db6308b2a5730e00730f0001b27204731000',
    ergoTreeConstants:
      '0: 0\n1: 0\n2: 2\n3: 0\n4: 1\n5: 0\n6: Coll(50,-18,93,-108,124,-2,-115,-75,72,1,87,-1,-91,102,-71,-73,-39,-6,-12,31,-95,69,-55,-48,6,40,-57,-63,89,-104,120,-10)\n7: 2\n8: 0\n9: 0\n10: 0\n11: true\n12: 0\n13: Coll(-76,102,-91,48,45,-121,-93,-27,107,54,97,60,19,54,-63,-47,100,60,73,22,82,35,90,-46,7,-123,54,84,-41,-128,52,-96)\n14: 2\n15: 0\n16: 0',
    ergoTreeScript:
      '{\n  val box1 = OUTPUTS(placeholder[Int](0))\n  val coll2 = SELF.tokens(placeholder[Int](1))._1\n  val bool3 = OUTPUTS.slice(placeholder[Int](2), OUTPUTS.size).filter({(box3: Box) => box3.tokens.size > placeholder[Int](3) }).exists(\n    {(box3: Box) => box3.tokens.exists({(tuple5: (Coll[Byte], Long)) => tuple5._1 == coll2 }) }\n  )\n  val coll4 = SELF.R4[Coll[Coll[Byte]]].get\n  val box5 = OUTPUTS(placeholder[Int](4))\n  val coll6 = box5.tokens\n  if (box1.tokens(placeholder[Int](5))._1 == placeholder[Coll[Byte]](6)) {\n    sigmaProp(\n      allOf(\n        Coll[Boolean](\n          !bool3, INPUTS(placeholder[Int](7)).tokens(placeholder[Int](8))._1 == coll4(placeholder[Int](9)), if (coll6.exists(\n            {(tuple7: (Coll[Byte], Long)) => tuple7._1 == coll2 }\n          )) { allOf(Coll[Boolean](coll6(placeholder[Int](10))._1 == coll2, box5.propositionBytes == SELF.propositionBytes)) } else { placeholder[Boolean](11) }\n        )\n      )\n    )\n  } else {(\n    val coll7 = SELF.propositionBytes\n    sigmaProp(\n      allOf(\n        Coll[Boolean](\n          coll6(placeholder[Int](12))._1 == coll2, blake2b256(box5.propositionBytes) == placeholder[Coll[Byte]](13), box5.R5[\n            Coll[Coll[Byte]]\n          ].isDefined, box5.R6[Coll[Byte]].isDefined, box5.R7[Coll[Byte]].get == blake2b256(coll7), box5.R4[\n            Coll[Coll[Byte]]\n          ].get == coll4, !bool3, box1.propositionBytes == coll7, box1.R4[Coll[Coll[Byte]]].get == coll4, OUTPUTS(placeholder[Int](14)).tokens(\n            placeholder[Int](15)\n          )._1 == coll4(placeholder[Int](16))\n        )\n      )\n    )\n  )}\n}',
    address:
      'FxMs5S8B9DA3Ecw7taWSSRefYESRzAmeznhb9sdp7KR2ZCe9NMzHj4PRWLimyFLvAv2nD3QtmPneFoWjVqJsgSMjV5wijdkz14a5WogmvKSbUe4WjVWuW7GLEnSnMaVZ56cdLk53pzZ7exKc5hhiAjeFJDzjjm1Dqt1RoEWgkUJuaW6Mm9FMiJhq9WYJVVEDzpkL6VYhrYWMLG3J5tB1ji7aTwTGmaCapEtRo7RCmMMMYhBssBxY4putUJxHV4RsD6k9pYMuz2jrsSRWZrUbtTLkhiifSpPCEmHNrPJiSFQSVDWr3gfqmPgkJxbxTGyz7vexUCcLqGHxMaBGsPoaSod9GNqo62Gik8eRUjr8zkuYU6tD9hfPUHCzEr6xyGbrGtrmczigHmD8a1HXh1DKu4xt8eMGws5CCgq6cFZpssQEakHtPnD3kTmsKNjM6KpnReWguNxqYERZYLhfGqTZ4vNFEmj88qTJWUzVu65DbpcGu6vzpZ93BfJ7KA7a1v',
    assets: [
      {
        tokenId:
          '3825b2b4acaaaba626440113153246c65ddb2e9df406c4a56418b5842c9f839a',
        index: 0,
        amount: 10000,
        name: 'rptconfErgoRWTV1',
        decimals: 0,
        type: 'EIP-004',
      },
    ],
    additionalRegisters: {
      R4: {
        serializedValue:
          '1a0120e61a83c5bca59e98c21d925faff5dfc079aa438f21df08702e4c4bf2bada02dc',
        sigmaType: 'Coll[Coll[SByte]]',
        renderedValue:
          '[e61a83c5bca59e98c21d925faff5dfc079aa438f21df08702e4c4bf2bada02dc]',
      },
    },
    spentTransactionId:
      '58008c9907b27fdc141df6ad09ebdd1441bdbd2bdc4969dd7d6d9f1273775670',
    mainChain: true,
  },
  {
    boxId: 'b29ec188bdd003641319a65a1f1bbc8968c0b4aa1d7cf72299f05c2b32e1cd51',
    transactionId:
      '397345bdf0838ba91ca630b8a21d6004a52d43301c2ccd9e6cfef2010daa4e20',
    blockId: '5b0fed71c924fa56b62453b257025cc3f6fb456a5ff3775edbcdb4adbc2f3d5e',
    value: 1100000,
    index: 2,
    globalIndex: 31997760,
    creationHeight: 1074536,
    settlementHeight: 1074543,
    ergoTree:
      '10110400040004040400040204000e2032ee5d947cfe8db5480157ffa566b9b7d9faf41fa145c9d00628c7c1599878f60404040004000400010104000e20b466a5302d87a3e56b36613c1336c1d1643c491652235ad207853654d78034a0040404000400d806d601b2a5730000d6028cb2db6308a773010001d603aeb5b4a57302b1a5d901036391b1db630872037303d9010363aedb63087203d901054d0e938c7205017202d604e4c6a7041ad605b2a5730400d606db6308720595938cb2db63087201730500017306d196830301ef7203938cb2db6308b2a473070073080001b2720473090095ae7206d901074d0e938c720701720296830201938cb27206730a0001720293c27205c2a7730bd801d607c2a7d196830a01938cb27206730c0001720293cbc27205730de6c67205051ae6c67205060e93e4c67205070ecb720793e4c67205041a7204ef720393c27201720793e4c67201041a7204938cb2db6308b2a5730e00730f0001b27204731000',
    ergoTreeConstants:
      '0: 0\n1: 0\n2: 2\n3: 0\n4: 1\n5: 0\n6: Coll(50,-18,93,-108,124,-2,-115,-75,72,1,87,-1,-91,102,-71,-73,-39,-6,-12,31,-95,69,-55,-48,6,40,-57,-63,89,-104,120,-10)\n7: 2\n8: 0\n9: 0\n10: 0\n11: true\n12: 0\n13: Coll(-76,102,-91,48,45,-121,-93,-27,107,54,97,60,19,54,-63,-47,100,60,73,22,82,35,90,-46,7,-123,54,84,-41,-128,52,-96)\n14: 2\n15: 0\n16: 0',
    ergoTreeScript:
      '{\n  val box1 = OUTPUTS(placeholder[Int](0))\n  val coll2 = SELF.tokens(placeholder[Int](1))._1\n  val bool3 = OUTPUTS.slice(placeholder[Int](2), OUTPUTS.size).filter({(box3: Box) => box3.tokens.size > placeholder[Int](3) }).exists(\n    {(box3: Box) => box3.tokens.exists({(tuple5: (Coll[Byte], Long)) => tuple5._1 == coll2 }) }\n  )\n  val coll4 = SELF.R4[Coll[Coll[Byte]]].get\n  val box5 = OUTPUTS(placeholder[Int](4))\n  val coll6 = box5.tokens\n  if (box1.tokens(placeholder[Int](5))._1 == placeholder[Coll[Byte]](6)) {\n    sigmaProp(\n      allOf(\n        Coll[Boolean](\n          !bool3, INPUTS(placeholder[Int](7)).tokens(placeholder[Int](8))._1 == coll4(placeholder[Int](9)), if (coll6.exists(\n            {(tuple7: (Coll[Byte], Long)) => tuple7._1 == coll2 }\n          )) { allOf(Coll[Boolean](coll6(placeholder[Int](10))._1 == coll2, box5.propositionBytes == SELF.propositionBytes)) } else { placeholder[Boolean](11) }\n        )\n      )\n    )\n  } else {(\n    val coll7 = SELF.propositionBytes\n    sigmaProp(\n      allOf(\n        Coll[Boolean](\n          coll6(placeholder[Int](12))._1 == coll2, blake2b256(box5.propositionBytes) == placeholder[Coll[Byte]](13), box5.R5[\n            Coll[Coll[Byte]]\n          ].isDefined, box5.R6[Coll[Byte]].isDefined, box5.R7[Coll[Byte]].get == blake2b256(coll7), box5.R4[\n            Coll[Coll[Byte]]\n          ].get == coll4, !bool3, box1.propositionBytes == coll7, box1.R4[Coll[Coll[Byte]]].get == coll4, OUTPUTS(placeholder[Int](14)).tokens(\n            placeholder[Int](15)\n          )._1 == coll4(placeholder[Int](16))\n        )\n      )\n    )\n  )}\n}',
    address:
      'FxMs5S8B9DA3Ecw7taWSSRefYESRzAmeznhb9sdp7KR2ZCe9NMzHj4PRWLimyFLvAv2nD3QtmPneFoWjVqJsgSMjV5wijdkz14a5WogmvKSbUe4WjVWuW7GLEnSnMaVZ56cdLk53pzZ7exKc5hhiAjeFJDzjjm1Dqt1RoEWgkUJuaW6Mm9FMiJhq9WYJVVEDzpkL6VYhrYWMLG3J5tB1ji7aTwTGmaCapEtRo7RCmMMMYhBssBxY4putUJxHV4RsD6k9pYMuz2jrsSRWZrUbtTLkhiifSpPCEmHNrPJiSFQSVDWr3gfqmPgkJxbxTGyz7vexUCcLqGHxMaBGsPoaSod9GNqo62Gik8eRUjr8zkuYU6tD9hfPUHCzEr6xyGbrGtrmczigHmD8a1HXh1DKu4xt8eMGws5CCgq6cFZpssQEakHtPnD3kTmsKNjM6KpnReWguNxqYERZYLhfGqTZ4vNFEmj88qTJWUzVu65DbpcGu6vzpZ93BfJ7KA7a1v',
    assets: [
      {
        tokenId:
          '3825b2b4acaaaba626440113153246c65ddb2e9df406c4a56418b5842c9f839a',
        index: 0,
        amount: 10000,
        name: 'rptconfErgoRWTV1',
        decimals: 0,
        type: 'EIP-004',
      },
    ],
    additionalRegisters: {
      R4: {
        serializedValue:
          '1a01203d36709eb83dc46cc60298ab183a1e4ab1d85363337b951b9494dc1ab1418eb1',
        sigmaType: 'Coll[Coll[SByte]]',
        renderedValue:
          '[3d36709eb83dc46cc60298ab183a1e4ab1d85363337b951b9494dc1ab1418eb1]',
      },
    },
    spentTransactionId:
      '4b1680ace66c5682d47769233b596b1ea7ac113a0f64149497329649a81727cd',
    mainChain: true,
  },
  {
    boxId: 'ec04dde324cb1e3b914270e5589454c001968757c53db1e1ab0aa65c82b72bb8',
    transactionId:
      '397345bdf0838ba91ca630b8a21d6004a52d43301c2ccd9e6cfef2010daa4e20',
    blockId: '5b0fed71c924fa56b62453b257025cc3f6fb456a5ff3775edbcdb4adbc2f3d5e',
    value: 1100000,
    index: 3,
    globalIndex: 31997761,
    creationHeight: 1074536,
    settlementHeight: 1074543,
    ergoTree:
      '10110400040004040400040204000e2032ee5d947cfe8db5480157ffa566b9b7d9faf41fa145c9d00628c7c1599878f60404040004000400010104000e20b466a5302d87a3e56b36613c1336c1d1643c491652235ad207853654d78034a0040404000400d806d601b2a5730000d6028cb2db6308a773010001d603aeb5b4a57302b1a5d901036391b1db630872037303d9010363aedb63087203d901054d0e938c7205017202d604e4c6a7041ad605b2a5730400d606db6308720595938cb2db63087201730500017306d196830301ef7203938cb2db6308b2a473070073080001b2720473090095ae7206d901074d0e938c720701720296830201938cb27206730a0001720293c27205c2a7730bd801d607c2a7d196830a01938cb27206730c0001720293cbc27205730de6c67205051ae6c67205060e93e4c67205070ecb720793e4c67205041a7204ef720393c27201720793e4c67201041a7204938cb2db6308b2a5730e00730f0001b27204731000',
    ergoTreeConstants:
      '0: 0\n1: 0\n2: 2\n3: 0\n4: 1\n5: 0\n6: Coll(50,-18,93,-108,124,-2,-115,-75,72,1,87,-1,-91,102,-71,-73,-39,-6,-12,31,-95,69,-55,-48,6,40,-57,-63,89,-104,120,-10)\n7: 2\n8: 0\n9: 0\n10: 0\n11: true\n12: 0\n13: Coll(-76,102,-91,48,45,-121,-93,-27,107,54,97,60,19,54,-63,-47,100,60,73,22,82,35,90,-46,7,-123,54,84,-41,-128,52,-96)\n14: 2\n15: 0\n16: 0',
    ergoTreeScript:
      '{\n  val box1 = OUTPUTS(placeholder[Int](0))\n  val coll2 = SELF.tokens(placeholder[Int](1))._1\n  val bool3 = OUTPUTS.slice(placeholder[Int](2), OUTPUTS.size).filter({(box3: Box) => box3.tokens.size > placeholder[Int](3) }).exists(\n    {(box3: Box) => box3.tokens.exists({(tuple5: (Coll[Byte], Long)) => tuple5._1 == coll2 }) }\n  )\n  val coll4 = SELF.R4[Coll[Coll[Byte]]].get\n  val box5 = OUTPUTS(placeholder[Int](4))\n  val coll6 = box5.tokens\n  if (box1.tokens(placeholder[Int](5))._1 == placeholder[Coll[Byte]](6)) {\n    sigmaProp(\n      allOf(\n        Coll[Boolean](\n          !bool3, INPUTS(placeholder[Int](7)).tokens(placeholder[Int](8))._1 == coll4(placeholder[Int](9)), if (coll6.exists(\n            {(tuple7: (Coll[Byte], Long)) => tuple7._1 == coll2 }\n          )) { allOf(Coll[Boolean](coll6(placeholder[Int](10))._1 == coll2, box5.propositionBytes == SELF.propositionBytes)) } else { placeholder[Boolean](11) }\n        )\n      )\n    )\n  } else {(\n    val coll7 = SELF.propositionBytes\n    sigmaProp(\n      allOf(\n        Coll[Boolean](\n          coll6(placeholder[Int](12))._1 == coll2, blake2b256(box5.propositionBytes) == placeholder[Coll[Byte]](13), box5.R5[\n            Coll[Coll[Byte]]\n          ].isDefined, box5.R6[Coll[Byte]].isDefined, box5.R7[Coll[Byte]].get == blake2b256(coll7), box5.R4[\n            Coll[Coll[Byte]]\n          ].get == coll4, !bool3, box1.propositionBytes == coll7, box1.R4[Coll[Coll[Byte]]].get == coll4, OUTPUTS(placeholder[Int](14)).tokens(\n            placeholder[Int](15)\n          )._1 == coll4(placeholder[Int](16))\n        )\n      )\n    )\n  )}\n}',
    address:
      'FxMs5S8B9DA3Ecw7taWSSRefYESRzAmeznhb9sdp7KR2ZCe9NMzHj4PRWLimyFLvAv2nD3QtmPneFoWjVqJsgSMjV5wijdkz14a5WogmvKSbUe4WjVWuW7GLEnSnMaVZ56cdLk53pzZ7exKc5hhiAjeFJDzjjm1Dqt1RoEWgkUJuaW6Mm9FMiJhq9WYJVVEDzpkL6VYhrYWMLG3J5tB1ji7aTwTGmaCapEtRo7RCmMMMYhBssBxY4putUJxHV4RsD6k9pYMuz2jrsSRWZrUbtTLkhiifSpPCEmHNrPJiSFQSVDWr3gfqmPgkJxbxTGyz7vexUCcLqGHxMaBGsPoaSod9GNqo62Gik8eRUjr8zkuYU6tD9hfPUHCzEr6xyGbrGtrmczigHmD8a1HXh1DKu4xt8eMGws5CCgq6cFZpssQEakHtPnD3kTmsKNjM6KpnReWguNxqYERZYLhfGqTZ4vNFEmj88qTJWUzVu65DbpcGu6vzpZ93BfJ7KA7a1v',
    assets: [
      {
        tokenId:
          '3825b2b4acaaaba626440113153246c65ddb2e9df406c4a56418b5842c9f839a',
        index: 0,
        amount: 10000,
        name: 'rptconfErgoRWTV1',
        decimals: 0,
        type: 'EIP-004',
      },
    ],
    additionalRegisters: {
      R4: {
        serializedValue:
          '1a0120995ca29a94c2290c7648b56e4a84dafda75765c6e793c5cdcd4fba55ff261e9f',
        sigmaType: 'Coll[Coll[SByte]]',
        renderedValue:
          '[995ca29a94c2290c7648b56e4a84dafda75765c6e793c5cdcd4fba55ff261e9f]',
      },
    },
    spentTransactionId:
      '8ad09df7cd40058d2b5e1cce84a51f11456fa41ea2b021fca0bbbe67fb34bcbc',
    mainChain: true,
  },
  {
    boxId: '92a2667022f3f71e7590f19235fd05c0af0855a469eacce6c70c162f96ef85e5',
    transactionId:
      '397345bdf0838ba91ca630b8a21d6004a52d43301c2ccd9e6cfef2010daa4e20',
    blockId: '5b0fed71c924fa56b62453b257025cc3f6fb456a5ff3775edbcdb4adbc2f3d5e',
    value: 1100000,
    index: 4,
    globalIndex: 31997762,
    creationHeight: 1074536,
    settlementHeight: 1074543,
    ergoTree:
      '10110400040004040400040204000e2032ee5d947cfe8db5480157ffa566b9b7d9faf41fa145c9d00628c7c1599878f60404040004000400010104000e20b466a5302d87a3e56b36613c1336c1d1643c491652235ad207853654d78034a0040404000400d806d601b2a5730000d6028cb2db6308a773010001d603aeb5b4a57302b1a5d901036391b1db630872037303d9010363aedb63087203d901054d0e938c7205017202d604e4c6a7041ad605b2a5730400d606db6308720595938cb2db63087201730500017306d196830301ef7203938cb2db6308b2a473070073080001b2720473090095ae7206d901074d0e938c720701720296830201938cb27206730a0001720293c27205c2a7730bd801d607c2a7d196830a01938cb27206730c0001720293cbc27205730de6c67205051ae6c67205060e93e4c67205070ecb720793e4c67205041a7204ef720393c27201720793e4c67201041a7204938cb2db6308b2a5730e00730f0001b27204731000',
    ergoTreeConstants:
      '0: 0\n1: 0\n2: 2\n3: 0\n4: 1\n5: 0\n6: Coll(50,-18,93,-108,124,-2,-115,-75,72,1,87,-1,-91,102,-71,-73,-39,-6,-12,31,-95,69,-55,-48,6,40,-57,-63,89,-104,120,-10)\n7: 2\n8: 0\n9: 0\n10: 0\n11: true\n12: 0\n13: Coll(-76,102,-91,48,45,-121,-93,-27,107,54,97,60,19,54,-63,-47,100,60,73,22,82,35,90,-46,7,-123,54,84,-41,-128,52,-96)\n14: 2\n15: 0\n16: 0',
    ergoTreeScript:
      '{\n  val box1 = OUTPUTS(placeholder[Int](0))\n  val coll2 = SELF.tokens(placeholder[Int](1))._1\n  val bool3 = OUTPUTS.slice(placeholder[Int](2), OUTPUTS.size).filter({(box3: Box) => box3.tokens.size > placeholder[Int](3) }).exists(\n    {(box3: Box) => box3.tokens.exists({(tuple5: (Coll[Byte], Long)) => tuple5._1 == coll2 }) }\n  )\n  val coll4 = SELF.R4[Coll[Coll[Byte]]].get\n  val box5 = OUTPUTS(placeholder[Int](4))\n  val coll6 = box5.tokens\n  if (box1.tokens(placeholder[Int](5))._1 == placeholder[Coll[Byte]](6)) {\n    sigmaProp(\n      allOf(\n        Coll[Boolean](\n          !bool3, INPUTS(placeholder[Int](7)).tokens(placeholder[Int](8))._1 == coll4(placeholder[Int](9)), if (coll6.exists(\n            {(tuple7: (Coll[Byte], Long)) => tuple7._1 == coll2 }\n          )) { allOf(Coll[Boolean](coll6(placeholder[Int](10))._1 == coll2, box5.propositionBytes == SELF.propositionBytes)) } else { placeholder[Boolean](11) }\n        )\n      )\n    )\n  } else {(\n    val coll7 = SELF.propositionBytes\n    sigmaProp(\n      allOf(\n        Coll[Boolean](\n          coll6(placeholder[Int](12))._1 == coll2, blake2b256(box5.propositionBytes) == placeholder[Coll[Byte]](13), box5.R5[\n            Coll[Coll[Byte]]\n          ].isDefined, box5.R6[Coll[Byte]].isDefined, box5.R7[Coll[Byte]].get == blake2b256(coll7), box5.R4[\n            Coll[Coll[Byte]]\n          ].get == coll4, !bool3, box1.propositionBytes == coll7, box1.R4[Coll[Coll[Byte]]].get == coll4, OUTPUTS(placeholder[Int](14)).tokens(\n            placeholder[Int](15)\n          )._1 == coll4(placeholder[Int](16))\n        )\n      )\n    )\n  )}\n}',
    address:
      'FxMs5S8B9DA3Ecw7taWSSRefYESRzAmeznhb9sdp7KR2ZCe9NMzHj4PRWLimyFLvAv2nD3QtmPneFoWjVqJsgSMjV5wijdkz14a5WogmvKSbUe4WjVWuW7GLEnSnMaVZ56cdLk53pzZ7exKc5hhiAjeFJDzjjm1Dqt1RoEWgkUJuaW6Mm9FMiJhq9WYJVVEDzpkL6VYhrYWMLG3J5tB1ji7aTwTGmaCapEtRo7RCmMMMYhBssBxY4putUJxHV4RsD6k9pYMuz2jrsSRWZrUbtTLkhiifSpPCEmHNrPJiSFQSVDWr3gfqmPgkJxbxTGyz7vexUCcLqGHxMaBGsPoaSod9GNqo62Gik8eRUjr8zkuYU6tD9hfPUHCzEr6xyGbrGtrmczigHmD8a1HXh1DKu4xt8eMGws5CCgq6cFZpssQEakHtPnD3kTmsKNjM6KpnReWguNxqYERZYLhfGqTZ4vNFEmj88qTJWUzVu65DbpcGu6vzpZ93BfJ7KA7a1v',
    assets: [
      {
        tokenId:
          '3825b2b4acaaaba626440113153246c65ddb2e9df406c4a56418b5842c9f839a',
        index: 0,
        amount: 10000,
        name: 'rptconfErgoRWTV1',
        decimals: 0,
        type: 'EIP-004',
      },
    ],
    additionalRegisters: {
      R4: {
        serializedValue:
          '1a01205589db926e6760d840c919948169a559abcab58ef0d2100126e48f9d2ef12320',
        sigmaType: 'Coll[Coll[SByte]]',
        renderedValue:
          '[5589db926e6760d840c919948169a559abcab58ef0d2100126e48f9d2ef12320]',
      },
    },
    spentTransactionId:
      '8374880ecfd058ac272fea68549cb7c672de23e59c61442d09eea263693b533d',
    mainChain: true,
  },
];
