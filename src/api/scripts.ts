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