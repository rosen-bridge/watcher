export const RwtRepoScript = `
{
  // ----------------- REGISTERS
  // R4: Coll[Coll[Byte]] = [Chain id, WID_0, WID_1, ...] (Stores Chain id and related watcher ids)
  // R5: Coll[Long] = [0, X-RWT_0, X-RWT_1, ...] (The first element is zero and the rest indicates X-RWT count for watcher i)
  // R6: Coll[Long] = [RSN/X-RWT factor, Watcher quorum percentage, minimum needed approval, maximum needed approval]
  // (Minimum number of commitments needed for an event is: min(R6[3], R6[1] * (len(R4) - 1) / 100 + R6[2]) )
  // R7: Int = Watcher index (only used in returning permits phase)
  // ----------------- TOKENSe
  // 0: X-RWT Repo NFT
  // 1: X-RWT
  // 2: RSN

  val GuardNFT = fromBase64("GUARD_NFT");
  if(INPUTS(1).tokens(0)._1 == GuardNFT){
    // RWT Repo Update transaction
    sigmaProp(true)
  } else {
    val permitScriptHash = fromBase64("PERMIT_SCRIPT_HASH");
    val repoOut = OUTPUTS(0)
    val repo = SELF
    val widListSize = repo.R5[Coll[Long]].get.size
    val widOutListSize = repoOut.R5[Coll[Long]].get.size
    val repoReplication = allOf(
      Coll(
        repoOut.propositionBytes == repo.propositionBytes,
        repoOut.R6[Coll[Long]].get == repo.R6[Coll[Long]].get,
        repoOut.tokens(0)._1 == repo.tokens(0)._1,
        repoOut.tokens(1)._1 == repo.tokens(1)._1,
        repoOut.tokens(2)._1 == repo.tokens(2)._1,
      )
    )
    if(repo.tokens(1)._2 > repoOut.tokens(1)._2){
      // Getting Watcher Permit
      // [Repo, UserInputs] => [Repo, watcherPermit, WIDToken]
      val permit = OUTPUTS(1)
      val WID = OUTPUTS(2)
      val RWTOut = repo.tokens(1)._2 - repoOut.tokens(1)._2
      sigmaProp(
        allOf(
          Coll(
            repoReplication,
            repoOut.R4[Coll[Coll[Byte]]].get.size == widListSize + 1,
            repoOut.R4[Coll[Coll[Byte]]].get.slice(0, widOutListSize - 1) == repo.R4[Coll[Coll[Byte]]].get,
            repoOut.R4[Coll[Coll[Byte]]].get(widOutListSize - 1) == repo.id,
            repoOut.R5[Coll[Long]].get.size == widListSize + 1,
            repoOut.R5[Coll[Long]].get.slice(0, widOutListSize - 1) == repo.R5[Coll[Long]].get,
            repoOut.R5[Coll[Long]].get(widOutListSize - 1) == RWTOut,
            RWTOut * repo.R6[Coll[Long]].get(0) == repoOut.tokens(2)._2 - repo.tokens(2)._2,
            permit.tokens(0)._2 == RWTOut,
            blake2b256(permit.propositionBytes) == permitScriptHash,
            permit.R4[Coll[Coll[Byte]]].get == Coll(repo.id),
            WID.tokens(0)._1 == repo.id
          )
        )
      )
    }else{
      // Returning Watcher Permit
      // [repo, Permit, WIDToken] => [repo, Permit(Optional), WIDToken(+userChange)]
      val permit = INPUTS(1)
      val RWTIn = repoOut.tokens(1)._2 - repo.tokens(1)._2
      val WIDIndex = repoOut.R7[Int].get
      val watcherCount = repo.R5[Coll[Long]].get.size
      val WIDCheckInRepo = if(repo.R5[Coll[Long]].get(WIDIndex) > RWTIn) {
        // Returning some RWTs
        allOf(
          Coll(
            repo.R5[Coll[Long]].get(WIDIndex) == repoOut.R5[Coll[Long]].get(WIDIndex) + RWTIn,
            repo.R4[Coll[Coll[Byte]]].get == repoOut.R4[Coll[Coll[Byte]]].get
          )
        )
      }else{
        // Returning the permit
        allOf(
          Coll(
            repo.R5[Coll[Long]].get(WIDIndex) == RWTIn,
            repo.R4[Coll[Coll[Byte]]].get.slice(0, WIDIndex) == repoOut.R4[Coll[Coll[Byte]]].get.slice(0, WIDIndex),
            repo.R4[Coll[Coll[Byte]]].get.slice(WIDIndex + 1, watcherCount) == repoOut.R4[Coll[Coll[Byte]]].get.slice(WIDIndex, watcherCount - 1),
            repo.R5[Coll[Long]].get.slice(0, WIDIndex) == repoOut.R5[Coll[Long]].get.slice(0, WIDIndex),
            repo.R5[Coll[Long]].get.slice(WIDIndex + 1, watcherCount) == repoOut.R5[Coll[Long]].get.slice(WIDIndex, watcherCount - 1)
          )
        )
      }
      val WID = repo.R4[Coll[Coll[Byte]]].get(WIDIndex)
      sigmaProp(
        allOf(
          Coll(
            repoReplication,
            Coll(WID) == permit.R4[Coll[Coll[Byte]]].get,
            RWTIn * repo.R6[Coll[Long]].get(0) == repo.tokens(2)._2 - repoOut.tokens(2)._2,
            WIDCheckInRepo
          )
        )
      )
    }
  }
}`;

export const WatcherPermitScript = `
      {
         // ----------------- REGISTERS
         // R4: Coll[Coll[Byte]] = [WID]
         // ----------------- TOKENS
         // 0: X-RWT
         
         val repoNFT = fromBase64("REPO_NFT");
         val commitmentScriptHash = fromBase64("COMMITMENT_SCRIPT_HASH");
         val WID = SELF.R4[Coll[Coll[Byte]]].get
         val outputWithToken = OUTPUTS.slice(2, OUTPUTS.size).filter { (box: Box) => box.tokens.size > 0 }
         val outputWithRWT = outputWithToken.exists { (box: Box) => box.tokens.exists { (token: (Coll[Byte], Long)) => token._1 == SELF.tokens(0)._1 } }
         val secondBoxHasRWT = OUTPUTS(1).tokens.exists { (token: (Coll[Byte], Long)) => token._1 == SELF.tokens(0)._1 }
         if(OUTPUTS(0).tokens(0)._1 == repoNFT){
           // Updating Permit (Return or receive more tokens)
           // [Repo, Permit(SELF), WID] => [Repo, Permit(optional), WID(+userChange)]
           val outputPermitCheck = if(secondBoxHasRWT){
             allOf(
               Coll(
                 OUTPUTS(1).tokens(0)._1 == SELF.tokens(0)._1,
                 OUTPUTS(1).propositionBytes == SELF.propositionBytes,
               )
             )
           }else{
             true
           }
           sigmaProp(
             allOf(
               Coll(
                 outputWithRWT == false,
                 INPUTS(2).tokens(0)._1 == WID(0),
                 outputPermitCheck,
               )
             )
           )
         }else{
           // Event Commitment Creation
           // [Permit, WID] => [Permit(Optional), Commitment, WID]
           val outputCommitmentCheck = if(secondBoxHasRWT){
             allOf(
               Coll(
                 OUTPUTS(1).tokens(0)._1 == SELF.tokens(0)._1,
                 blake2b256(OUTPUTS(1).propositionBytes) == commitmentScriptHash,
                 OUTPUTS(1).R5[Coll[Coll[Byte]]].isDefined,
                 OUTPUTS(1).R6[Coll[Byte]].isDefined,
                 OUTPUTS(1).R7[Coll[Byte]].get == blake2b256(SELF.propositionBytes),
                 OUTPUTS(1).R4[Coll[Coll[Byte]]].get == WID,
                 OUTPUTS(1).tokens(0)._2 == 1,
               )
             )
           }else{
             true
           }
           sigmaProp(
             allOf(
               Coll(
                 outputWithRWT == false,
                 OUTPUTS(0).propositionBytes == SELF.propositionBytes,
                 OUTPUTS(0).R4[Coll[Coll[Byte]]].get == WID,
                 INPUTS(1).tokens(0)._1 == WID(0),
                 outputCommitmentCheck,
               )
             )
           )
         }
       }
`;

export const CommitmentScript =
    `{
      // ----------------- REGISTERS
      // R4: Coll[Coll[Byte]] = [WID]
      // R5: Coll[Coll[Byte]] = [Request ID (Hash(TxId))]
      // R6: Coll[Byte] = Event Data Digest
      // R7: Coll[Byte] = Permit Script Digest
      // ----------------- TOKENS
      // 0: X-RWT
      
      val eventTriggerHash = fromBase64("EVENT_TRIGGER_SCRIPT_HASH");
      val event = if (blake2b256(INPUTS(0).propositionBytes) == eventTriggerHash) INPUTS(0) else OUTPUTS(0)
      val myWID = SELF.R4[Coll[Coll[Byte]]].get
      val WIDs = event.R4[Coll[Coll[Byte]]].get
      val paddedData = if(event.R5[Coll[Coll[Byte]]].isDefined) {
        event.R5[Coll[Coll[Byte]]].get.fold(Coll(0.toByte), { (a: Coll[Byte], b: Coll[Byte]) => a ++ b } )
      }else{
        Coll(0.toByte)
      }
      val eventData = paddedData.slice(1, paddedData.size)
      if(blake2b256(INPUTS(0).propositionBytes) == eventTriggerHash){
        // Reward Distribution (for missed commitments)
        // [EventTrigger, Commitments[], BridgeWallet] => [WatcherPermits[], BridgeWallet]
        val permitBox = OUTPUTS.filter {(box:Box) => 
          if(box.R4[Coll[Coll[Byte]]].isDefined)
            box.R4[Coll[Coll[Byte]]].get == myWID
          else false
        }(0)
        val WIDExists =  WIDs.exists {(WID: Coll[Byte]) => myWID == Coll(WID)}
        sigmaProp(
          allOf(
            Coll(
              blake2b256(permitBox.propositionBytes) == SELF.R7[Coll[Byte]].get,
              permitBox.tokens(0)._1 == SELF.tokens(0)._1,
              // check for duplicates
              WIDExists == false,
              // validate commitment
              blake2b256(eventData ++ myWID(0)) == SELF.R6[Coll[Byte]].get
            )
          )
        )
    
      } else if (blake2b256(OUTPUTS(0).propositionBytes) == eventTriggerHash){
        // Event Trigger Creation
        // [Commitments[], WID] + [Repo(DataInput)] => [EventTrigger, WID]
        val commitmentBoxes = INPUTS.filter { (box: Box) => SELF.propositionBytes == box.propositionBytes }
        val myWIDCommitments = commitmentBoxes.filter{ (box: Box) => box.R4[Coll[Coll[Byte]]].get == myWID }
        val myWIDExists = WIDs.exists{ (WID: Coll[Byte]) => Coll(WID) == myWID }
        val repo = CONTEXT.dataInputs(0)
        val requestId = if(event.R5[Coll[Coll[Byte]]].isDefined) {
          blake2b256(event.R5[Coll[Coll[Byte]]].get(0))
        } else {
          Coll(0.toByte)
        }
        val repoR6 = repo.R6[Coll[Long]].get
        val maxCommitment = repoR6(3)
        val requiredCommitmentFromFormula: Long = repoR6(2) + repoR6(1) * (repo.R4[Coll[Coll[Byte]]].get.size - 1L) / 100L
        val requiredCommitment = if(maxCommitment < requiredCommitmentFromFormula) {
          maxCommitment
        } else {
          requiredCommitmentFromFormula
        }
        sigmaProp(
          allOf(
            Coll(
              myWIDCommitments.size == 1,
              myWIDExists,
              event.R6[Coll[Byte]].get == SELF.R7[Coll[Byte]].get,
              WIDs.size == commitmentBoxes.size,
              // TODO verify commitment to be correct
              blake2b256(eventData ++ myWID(0)) == SELF.R6[Coll[Byte]].get,
              // check event id
              SELF.R5[Coll[Coll[Byte]]].get == Coll(requestId),
              // check commitment count
              commitmentBoxes.size > requiredCommitment,
            )
          )
        )
      } else {
        // Commitment Redeem
        // [Commitment, WID] => [Permit, WID]
        sigmaProp(
          allOf(
            Coll(
              SELF.id == INPUTS(0).id,
              OUTPUTS(0).tokens(0)._1 == SELF.tokens(0)._1,
              // check WID copied
              OUTPUTS(0).R4[Coll[Coll[Byte]]].get == myWID,
              // check user WID
              INPUTS(1).tokens(0)._1 == myWID(0),
              // check permit contract address
              blake2b256(OUTPUTS(0).propositionBytes) == SELF.R7[Coll[Byte]].get
            )
          )
        )
      }
    }
`;

export const EventTrigerScript =
    `{
          // ----------------- REGISTERS
          // R4: Coll[Coll[Byte]] [WID[]]
          // R5: Coll[Coll[Byte]] Event data
          // R6: Coll[Byte] Permit contract script digest
          // ----------------- TOKENS
          // 0: RWT
        
          // [TriggerEvent, CleanupToken(if fraud)] => [Fraud1, Fraud2, ...]
          val cleanupNFT = fromBase64("CLEANUP_NFT");
          val guardNFT = fromBase64("GUARD_NFT");
          val cleanupConfirmation = CLEANUP_CONFIRMATION;
          val FraudScriptHash = fromBase64("FRAUD_SCRIPT_HASH");
          val fraudScriptCheck = if(blake2b256(OUTPUTS(0).propositionBytes) == FraudScriptHash) {
            allOf(
              Coll(
                INPUTS(1).tokens(0)._1 == cleanupNFT,
                HEIGHT - cleanupConfirmation >= SELF.creationInfo._1
              )
            )
          } else {
            allOf(
              Coll(
                INPUTS(1).tokens(0)._1 == guardNFT,
                blake2b256(OUTPUTS(0).propositionBytes) == SELF.R6[Coll[Byte]].get
              )
            )
          }
          val WIDs: Coll[Coll[Byte]] = SELF.R4[Coll[Coll[Byte]]].get
          val mergeBoxes = OUTPUTS.slice(0, WIDs.size)
          val checkAllWIDs = WIDs.zip(mergeBoxes).forall {
            (data: (Coll[Byte], Box)) => {
              Coll(data._1) == data._2.R4[Coll[Coll[Byte]]].get && data._2.propositionBytes == OUTPUTS(0).propositionBytes
            }
          }
          sigmaProp(
            allOf(
              Coll(
                WIDs.size == mergeBoxes.size,
                checkAllWIDs,
                fraudScriptCheck,
              )
            )
          )
        }
`;

export const FraudScript =
    `{
        // ----------------- REGISTERS
        // R4: Coll[Coll[Byte]] = [WID]
        // ----------------- TOKENS
        // 0: RWT

        val repoNFT = fromBase64("REPO_NFT");
        val cleanupNFT = fromBase64("CLEANUP_NFT");
        val outputWithToken = OUTPUTS.slice(1, OUTPUTS.size).filter { (box: Box) => box.tokens.size > 0 }
        val outputWithRWT = outputWithToken.exists { (box: Box) => box.tokens.exists { (token: (Coll[Byte], Long)) => token._1 == SELF.tokens(0)._1 } }
        // RSN Slash
        // [Repo, Fraud, Cleanup] => [Repo, Cleanup, Slashed]
        sigmaProp(
            allOf(
                Coll(
                    outputWithRWT == false,
                    INPUTS(0).tokens(0)._1 == repoNFT,
                    INPUTS(2).tokens(0)._1 == cleanupNFT,
                )
            )
        )
      }
`;

