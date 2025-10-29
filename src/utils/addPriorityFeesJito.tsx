
import {
  Connection, PublicKey, SystemProgram, Transaction, Commitment,
  ComputeBudgetProgram, TransactionMessage, VersionedTransaction,
  TransactionInstruction,
  LAMPORTS_PER_SOL
} from '@solana/web3.js';
import { BANANATOOLS_ADDRESS } from '@/config'

export const DEFAULT_COMMITMENT: Commitment = "finalized";

const addPriorityFeesJito = (
  connection: Connection,
  tx: Transaction,
  payerKey: PublicKey,
  jitoTipAccount: PublicKey,
  jito_Fee: number,
  isMain: boolean
) => {
  return new Promise(async (resolve: (value: VersionedTransaction) => void, reject) => {
    try {
      const memoProgramId = new PublicKey(
        "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"
      );
      const priorityFees = {
        unitLimit: 250000,
        unitPrice: 200_000,
      }
      if (priorityFees) {
        const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
          units: priorityFees.unitLimit,
        });

        const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({
          microLamports: priorityFees.unitPrice,
        });
        tx.add(modifyComputeUnits);
        tx.add(addPriorityFee);
      }
      if (isMain) {
        tx.add(
          SystemProgram.transfer({
            fromPubkey: payerKey,
            toPubkey: jitoTipAccount,
            lamports: jito_Fee,
          })
        );
        // const jito = SystemProgram.transfer({
        //   fromPubkey: payerKey,
        //   toPubkey: new PublicKey(BANANATOOLS_ADDRESS),
        //   lamports: 0.001 * LAMPORTS_PER_SOL,
        // })
        // tx.add(jito)
      }
      // Add memo instruction
      // const memoInstruction = new TransactionInstruction({
      //   keys: [],
      //   programId: memoProgramId,
      //   data: Buffer.from("Hello, Jito!"),
      // });
      // tx.add(memoInstruction);
      const blockHash = (await connection.getLatestBlockhash(DEFAULT_COMMITMENT))
        .blockhash;
      let messageV0 = new TransactionMessage({
        payerKey: payerKey,
        recentBlockhash: blockHash,
        instructions: tx.instructions,
      }).compileToV0Message();

      let versionedTx = new VersionedTransaction(messageV0);
      resolve(versionedTx)
    } catch (error) {
      reject(error)
    }
  })
}

export default addPriorityFeesJito