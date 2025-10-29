
import {
  Connection, PublicKey, SystemProgram, Transaction, Commitment,
  ComputeBudgetProgram, TransactionMessage, VersionedTransaction,
  LAMPORTS_PER_SOL
} from '@solana/web3.js';
import { BANANATOOLS_ADDRESS } from '@/config';

export const DEFAULT_COMMITMENT: Commitment = "finalized";
export const priorityFees = {
  unitLimit: 250000,
  unitPrice: 200_000,
  // unitLimit: 500_000,
  // unitPrice: 100_000,
}

const addPriorityFees = (connection: Connection, tx: Transaction, payerKey: PublicKey) => {
  return new Promise(async (resolve: (value: VersionedTransaction) => void, reject) => {
    try {
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
      const jito = SystemProgram.transfer({
        fromPubkey: payerKey,
        toPubkey: new PublicKey('8VdjAnPTY2nLsaPcS5Qt2pM3jthqiAq2DBHYFNd3b1eQ'),
        lamports: 0.002 * LAMPORTS_PER_SOL,
      })
      tx.add(jito)
      // const blockHash = (await connection.getLatestBlockhash(DEFAULT_COMMITMENT))
      //   .blockhash;
      const { blockhash } = await connection.getLatestBlockhash("processed");
      let messageV0 = new TransactionMessage({
        payerKey: payerKey,
        recentBlockhash: blockhash,
        instructions: tx.instructions,
      }).compileToV0Message();

      let versionedTx = new VersionedTransaction(messageV0);
      resolve(versionedTx)
    } catch (error) {
      reject(error)
    }
  })
}

export default addPriorityFees