import { Commitment } from "../../src/utils/interfaces";
import { CommitmentEntity, EventTriggerEntity, PermitEntity } from "@rosen-bridge/watcher-data-extractor";
import { BoxEntity } from "@rosen-bridge/address-extractor";
import { Config } from "../../src/config/config";
import { ObservationEntity } from "@rosen-bridge/observation-extractor";
import { ObservationStatusEntity, TxStatus } from "../../src/database/entities/ObservationStatusEntity";
import { BlockEntity } from "@rosen-bridge/scanner";
import { PROCEED } from "@rosen-bridge/scanner/dist/entities/blockEntity";

const config = Config.getConfig()

export const ergoBlockEntity = new BlockEntity()
ergoBlockEntity.scanner = "ergo-node"
ergoBlockEntity.id = 1
ergoBlockEntity.hash = "blockHash"
ergoBlockEntity.height = 1111
ergoBlockEntity.parentHash = "parentHash"
ergoBlockEntity.status = PROCEED

export const cardanoBlockEntity = new BlockEntity()
cardanoBlockEntity.scanner = "cardano-koios"
cardanoBlockEntity.id = 2
cardanoBlockEntity.hash = "blockHash2"
cardanoBlockEntity.height = 2222
cardanoBlockEntity.parentHash = "parentHash2"
cardanoBlockEntity.status = PROCEED

export const firstCommitment: Commitment = {
    WID: "f875d3b916e56056968d02018133d1c122764d5c70538e70e56199f431e95e9b",
    commitment: "c0666e24aa83e38b3955aae906140bda7f2e1974aca897c28962e7eaebd84026",
    eventId: "ab59962c20f57d9d59e95f5170ccb3472df4279ad4967e51ba8be9ba75144c7b",
    boxId: "1ab9da11fc216660e974842cc3b7705e62ebb9e0bf5ff78e53f9cd40abadd117"
};
export const secondCommitment: Commitment = {
    WID: "ecbde212e49df0e8f65dbaba5f59a6760a8f4c58a3d3451bad68b72ee3588703",
    commitment: "45891bf7173066ada6f83dc1bfcf2bf0c53ad90f5e4a5778781c82ad68f822e1",
    eventId: "2f4a12a39d3c925c0776131eded109e8430d958cd3cd0fcff13c73f49c57085f",
    boxId: "43d0ead059054f29ca9c831c93613e1ca98e8fbbc8b166c4fa24120a9d489824"
};
export const thirdCommitment: Commitment = {
    WID: "ecbde212e49df0e8f65dbaba5f59a6760a8f4c58a3d3451bad68b72ee3588703",
    commitment: "f0fc04ceea089b372c6e312f974be9be0ec8a9fa3568a0a6c155cb7d535186c7",
    eventId: "ab59962c20f57d9d59e95f5170ccb3472df4279ad4967e51ba8be9ba75144c7b",
    boxId: "a18dc1f812aa156037c47db5bd7fc9ef85646c97a1abb76b30045b8e5f7e31e2"
}
export const commitmentEntity = new CommitmentEntity()
commitmentEntity.commitment = "commitment"
commitmentEntity.boxId = "boxId"
commitmentEntity.WID = "WID"
commitmentEntity.eventId = "eventId"
commitmentEntity.block = "block"
commitmentEntity.extractor = "extractor"
commitmentEntity.height = 105
commitmentEntity.boxSerialized = "222"

export const spentCommitmentEntity = new CommitmentEntity()
spentCommitmentEntity.commitment = "commitment"
spentCommitmentEntity.boxId = "boxId2"
spentCommitmentEntity.WID = "WID2"
spentCommitmentEntity.eventId = "eventId"
spentCommitmentEntity.spendBlock = "spendBlockHash"
spentCommitmentEntity.block = "block2"
spentCommitmentEntity.extractor = "extractor"
spentCommitmentEntity.height = 100
spentCommitmentEntity.spendHeight = 110
spentCommitmentEntity.boxSerialized = "222"

export const permitEntity = new PermitEntity()
permitEntity.WID = "WID"
permitEntity.block = "blockID"
permitEntity.height = 100
permitEntity.extractor = "extractor"
permitEntity.boxId = "boxId"
permitEntity.boxSerialized = "box"

export const spentPermitEntity = new PermitEntity()
spentPermitEntity.WID = "WID"
spentPermitEntity.block = "blockID2"
spentPermitEntity.height = 100
spentPermitEntity.extractor = "extractor"
spentPermitEntity.boxId = "boxId2"
spentPermitEntity.boxSerialized = "box2"
spentPermitEntity.spendBlock = "blockHash2"
spentPermitEntity.spendHeight = 110

export const plainBox = new BoxEntity()
plainBox.address = "address"
plainBox.createBlock = "blockID"
plainBox.creationHeight = 100
plainBox.extractor = config.plainExtractorName
plainBox.boxId = "boxId"
plainBox.serialized = "box"

export const spentPlainBox = new BoxEntity()
spentPlainBox.address = "address"
spentPlainBox.createBlock = "blockID"
spentPlainBox.creationHeight = 100
spentPlainBox.extractor = config.plainExtractorName
spentPlainBox.boxId = "boxId2"
spentPlainBox.serialized = "box2"
spentPlainBox.spendBlock = "blockHash"


export const eventTriggerEntity = new EventTriggerEntity()
eventTriggerEntity.sourceTxId = "txId"
eventTriggerEntity.block = "blockID"
eventTriggerEntity.height = 100
eventTriggerEntity.extractor = "extractor"
eventTriggerEntity.boxId = "boxId"
eventTriggerEntity.boxSerialized = "box"
eventTriggerEntity.amount = "100"
eventTriggerEntity.networkFee = "1000"
eventTriggerEntity.bridgeFee = "200"
eventTriggerEntity.fromAddress = "fromAddress"
eventTriggerEntity.toAddress = "toAddress"
eventTriggerEntity.fromChain = "fromChain"
eventTriggerEntity.toChain = "toChain"
eventTriggerEntity.sourceChainTokenId = "tokenId"
eventTriggerEntity.targetChainTokenId = "targetTokenId"
eventTriggerEntity.WIDs = "1,2,3"
eventTriggerEntity.sourceBlockId = "block"


export const newEventTriggerEntity = new EventTriggerEntity()
newEventTriggerEntity.sourceTxId = "txId2"
newEventTriggerEntity.block = "blockID2"
newEventTriggerEntity.height = 100
newEventTriggerEntity.extractor = "extractor"
newEventTriggerEntity.boxId = "boxId2"
newEventTriggerEntity.boxSerialized = "box2"
newEventTriggerEntity.amount = "100"
newEventTriggerEntity.networkFee = "1000"
newEventTriggerEntity.bridgeFee = "200"
newEventTriggerEntity.fromAddress = "fromAddress"
newEventTriggerEntity.toAddress = "toAddress"
newEventTriggerEntity.fromChain = "fromChain"
newEventTriggerEntity.toChain = "toChain"
newEventTriggerEntity.sourceChainTokenId = "tokenId"
newEventTriggerEntity.targetChainTokenId = "targetTokenId"
newEventTriggerEntity.WIDs = "1,2,3"
newEventTriggerEntity.sourceBlockId = "block"


export const observationEntity1 = new ObservationEntity()
observationEntity1.height = 1;
observationEntity1.amount = "10";
observationEntity1.extractor = "observation-extractor";
observationEntity1.bridgeFee = "100";
observationEntity1.fromAddress = "fromAddress";
observationEntity1.block = "blockHash";
observationEntity1.fromChain = "ergo";
observationEntity1.networkFee = "1000";
observationEntity1.sourceBlockId = "block";
observationEntity1.sourceTxId = "txId";
observationEntity1.sourceChainTokenId = "sourceToken";
observationEntity1.toAddress = "addr1";
observationEntity1.targetChainTokenId = "targetToken";
observationEntity1.toChain = "cardano";
observationEntity1.requestId = "reqId2";


export const observationEntity2 = new ObservationEntity()
observationEntity2.height = 1;
observationEntity2.amount = "10";
observationEntity2.extractor = "observation-extractor";
observationEntity2.bridgeFee = "100";
observationEntity2.fromAddress = "fromAddress";
observationEntity2.block = "hash";
observationEntity2.fromChain = "ergo";
observationEntity2.networkFee = "1000";
observationEntity2.sourceBlockId = "block";
observationEntity2.sourceTxId = "txId";
observationEntity2.sourceChainTokenId = "sourceToken";
observationEntity2.toAddress = "addr1";
observationEntity2.targetChainTokenId = "targetToken";
observationEntity2.toChain = "cardano";
observationEntity2.requestId = "reqId1";

export const observationStatusTimedOut = new ObservationStatusEntity()
observationStatusTimedOut.status = TxStatus.TIMED_OUT
export const observationStatusNotCommitted = new ObservationStatusEntity()
observationStatusNotCommitted.status = TxStatus.NOT_COMMITTED
export const observationStatusCommitted = new ObservationStatusEntity()
observationStatusCommitted.status = TxStatus.COMMITTED
export const observationStatusRevealed = new ObservationStatusEntity()
observationStatusRevealed.status = TxStatus.REVEALED

export const unspentCommitment = new CommitmentEntity()
export const unspentCommitment2 = new CommitmentEntity()
export const redeemedCommitment = new CommitmentEntity()
redeemedCommitment.spendBlock = "hash"

const eventTrigger = new EventTriggerEntity()
eventTrigger.id = 1
eventTrigger.height = 111


