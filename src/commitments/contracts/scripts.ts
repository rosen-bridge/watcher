
export class scripts {
    static fraudScript = `{
       |  // ----------------- REGISTERS
       |  // R4: Coll[Coll[Byte]] = [WID]
       |  // ----------------- TOKENS
       |  // 0: RWT
       |
       |  val repoNFT = fromBase64("REPO_NFT");
       |  val cleanupNFT = fromBase64("CLEANUP_NFT");
       |  val outputWithToken = OUTPUTS.slice(1, OUTPUTS.size).filter { (box: Box) => box.tokens.size > 0 }
       |  val outputWithRWT = outputWithToken.exists { (box: Box) => box.tokens.exists { (token: (Coll[Byte], Long)) => token._1 == SELF.tokens(0)._1 } }
       |  // RSN Slash
       |  // [Repo, Fraud, Cleanup] => [Repo, Cleanup, Slashed]
       |  sigmaProp(
       |    allOf(
       |      Coll(
       |        outputWithRWT == false,
       |        INPUTS(0).tokens(0)._1 == repoNFT,
       |        INPUTS(2).tokens(0)._1 == cleanupNFT,
       |      )
       |    )
       |  )
       |}`

    static eventTriggerScript = `{
       |  // ----------------- REGISTERS
       |  // R4: Coll[Coll[Byte]] [WID[]]
       |  // R5: Coll[Coll[Byte]] Event data
       |  // R6: Coll[Byte] Permit contract script digest
       |  // ----------------- TOKENS
       |  // 0: RWT
       |
       |  // [TriggerEvent, CleanupToken(if fraud)] => [Fraud1, Fraud2, ...]
       |  val cleanupNFT = fromBase64("CLEANUP_NFT");
       |  val guardNFT = fromBase64("GUARD_NFT");
       |  val cleanupConfirmation = CLEANUP_CONFIRMATION;
       |  val FraudScriptHash = fromBase64("FRAUD_SCRIPT_HASH");
       |  val fraudScriptCheck = if(blake2b256(OUTPUTS(0).propositionBytes) == FraudScriptHash) {
       |    allOf(
       |      Coll(
       |        INPUTS(1).tokens(0)._1 == cleanupNFT,
       |        HEIGHT - cleanupConfirmation >= SELF.creationInfo._1
       |      )
       |    )
       |  } else {
       |    allOf(
       |      Coll(
       |        INPUTS(1).tokens(0)._1 == guardNFT,
       |        blake2b256(OUTPUTS(0).propositionBytes) == SELF.R6[Coll[Byte]].get
       |      )
       |    )
       |  }
       |  val WIDs: Coll[Coll[Byte]] = SELF.R4[Coll[Coll[Byte]]].get
       |  val mergeBoxes = OUTPUTS.slice(0, WIDs.size)
       |  val checkAllWIDs = WIDs.zip(mergeBoxes).forall {
       |    (data: (Coll[Byte], Box)) => {
       |      Coll(data._1) == data._2.R4[Coll[Coll[Byte]]].get && data._2.propositionBytes == OUTPUTS(0).propositionBytes
       |    }
       |  }
       |  sigmaProp(
       |    allOf(
       |      Coll(
       |        WIDs.size == mergeBoxes.size,
       |        checkAllWIDs,
       |        fraudScriptCheck,
       |      )
       |    )
       |  )
       |}`

    static commitmentScript = `{
       |  // ----------------- REGISTERS
       |  // R4: Coll[Coll[Byte]] = [WID]
       |  // R5: Coll[Coll[Byte]] = [Request ID (Hash(TxId))]
       |  // R6: Coll[Byte] = Event Data Digest
       |  // R7: Coll[Byte] = Permit Script Digest
       |  // ----------------- TOKENS
       |  // 0: X-RWT
       |  
       |  val eventTriggerHash = fromBase64("EVENT_TRIGGER_SCRIPT_HASH");
       |  val event = if (blake2b256(INPUTS(0).propositionBytes) == eventTriggerHash) INPUTS(0) else OUTPUTS(0)
       |  val myWID = SELF.R4[Coll[Coll[Byte]]].get
       |  val WIDs = event.R4[Coll[Coll[Byte]]].get
       |  val paddedData = if(event.R5[Coll[Coll[Byte]]].isDefined) {
       |    event.R5[Coll[Coll[Byte]]].get.fold(Coll(0.toByte), { (a: Coll[Byte], b: Coll[Byte]) => a ++ b } )
       |  }else{
       |    Coll(0.toByte)
       |  }
       |  val eventData = paddedData.slice(1, paddedData.size)
       |  if(blake2b256(INPUTS(0).propositionBytes) == eventTriggerHash){
       |    // Reward Distribution (for missed commitments)
       |    // [EventTrigger, Commitments[], BridgeWallet] => [WatcherPermits[], BridgeWallet]
       |    val permitBox = OUTPUTS.filter {(box:Box) => 
       |      if(box.R4[Coll[Coll[Byte]]].isDefined)
       |        box.R4[Coll[Coll[Byte]]].get == myWID
       |      else false
       |    }(0)
       |    val WIDExists =  WIDs.exists {(WID: Coll[Byte]) => myWID == Coll(WID)}
       |    sigmaProp(
       |      allOf(
       |        Coll(
       |          blake2b256(permitBox.propositionBytes) == SELF.R7[Coll[Byte]].get,
       |          permitBox.tokens(0)._1 == SELF.tokens(0)._1,
       |          // check for duplicates
       |          WIDExists == false,
       |          // validate commitment
       |          blake2b256(eventData ++ myWID(0)) == SELF.R6[Coll[Byte]].get
       |        )
       |      )
       |    )
       |
       |  } else if (blake2b256(OUTPUTS(0).propositionBytes) == eventTriggerHash){
       |    // Event Trigger Creation
       |    // [Commitments[], WID] + [Repo(DataInput)] => [EventTrigger, WID]
       |    val commitmentBoxes = INPUTS.filter { (box: Box) => SELF.propositionBytes == box.propositionBytes }
       |    val myWIDCommitments = commitmentBoxes.filter{ (box: Box) => box.R4[Coll[Coll[Byte]]].get == myWID }
       |    val myWIDExists = WIDs.exists{ (WID: Coll[Byte]) => Coll(WID) == myWID }
       |    val repo = CONTEXT.dataInputs(0)
       |    val requestId = if(event.R5[Coll[Coll[Byte]]].isDefined) {
       |      blake2b256(event.R5[Coll[Coll[Byte]]].get(0))
       |    } else {
       |      Coll(0.toByte)
       |    }
       |    val repoR6 = repo.R6[Coll[Long]].get
       |    val maxCommitment = repoR6(3)
       |    val requiredCommitmentFromFormula: Long = repoR6(2) + repoR6(1) * (repo.R4[Coll[Coll[Byte]]].get.size - 1L) / 100L
       |    val requiredCommitment = if(maxCommitment < requiredCommitmentFromFormula) {
       |      maxCommitment
       |    } else {
       |      requiredCommitmentFromFormula
       |    }
       |    sigmaProp(
       |      allOf(
       |        Coll(
       |          myWIDCommitments.size == 1,
       |          myWIDExists,
       |          event.R6[Coll[Byte]].get == SELF.R7[Coll[Byte]].get,
       |          WIDs.size == commitmentBoxes.size,
       |          // TODO verify commitment to be correct
       |          blake2b256(eventData ++ myWID(0)) == SELF.R6[Coll[Byte]].get,
       |          // check event id
       |          SELF.R5[Coll[Coll[Byte]]].get == Coll(requestId),
       |          // check commitment count
       |          commitmentBoxes.size > requiredCommitment,
       |        )
       |      )
       |    )
       |  } else {
       |    // Commitment Redeem
       |    // [Commitment, WID] => [Permit, WID]
       |    sigmaProp(
       |      allOf(
       |        Coll(
       |          SELF.id == INPUTS(0).id,
       |          OUTPUTS(0).tokens(0)._1 == SELF.tokens(0)._1,
       |          // check WID copied
       |          OUTPUTS(0).R4[Coll[Coll[Byte]]].get == myWID,
       |          // check user WID
       |          INPUTS(1).tokens(0)._1 == myWID(0),
       |          // check permit contract address
       |          blake2b256(OUTPUTS(0).propositionBytes) == SELF.R7[Coll[Byte]].get
       |        )
       |      )
       |    )
       |  }
       |}`
}
