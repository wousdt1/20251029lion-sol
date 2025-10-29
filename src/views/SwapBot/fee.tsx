import {
  Connection, PublicKey, Transaction, Keypair, SystemProgram, LAMPORTS_PER_SOL, VersionedTransaction,
  sendAndConfirmTransaction
} from "@solana/web3.js";
import { BANANATOOLS_ADDRESS, SWAP_BOT_FEE } from '@/config'

export const vipFee = (connection: Connection, account: Keypair): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    try {
      let Tx = new Transaction();
      const fee = SystemProgram.transfer({
        fromPubkey: account.publicKey,
        toPubkey: new PublicKey(BANANATOOLS_ADDRESS),
        lamports: SWAP_BOT_FEE * LAMPORTS_PER_SOL,
      })
      Tx.add(fee)
      const { blockhash } = await connection.getLatestBlockhash("processed");
      Tx.recentBlockhash = blockhash

      const signerTrue = await sendAndConfirmTransaction(connection, Tx, [account], { commitment: "confirmed" })

      // const transaction = VersionedTransaction.deserialize(Buffer.from(Tx, 'base64'));
      // transaction.sign([account]);
      // const transactionBinary = transaction.serialize();
      // const signature = await connection.sendRawTransaction(transactionBinary, {
      //   maxRetries: 2,
      //   skipPreflight: true
      // });
      resolve(signerTrue)
    } catch (error) {
      reject(error)
    }
  })
}