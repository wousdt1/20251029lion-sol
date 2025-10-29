import React, { useEffect, useRef } from 'react'
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { Connection, PublicKey } from '@solana/web3.js';
import { Button } from 'antd';



function Test() {
  const { connection } = useConnection();
  const wallet = useWallet()
  // 要监听的代币账户地址（Token Account）
  const tokenAccount = new PublicKey('Axk3Y3gCrKMA3gsf43e1myRaQJ3zGtStByBASRPptGuZ');
  const timerRfe = useRef(null)

  // useEffect(() => {
  //   console.log('1111111')
  //   const TOKEN_PROGRAM_ID = new PublicKey('');
  //   // 订阅程序日志
  //   timerRfe.current = connection.onLogs(
  //     TOKEN_PROGRAM_ID,
  //     (logs, ctx) => {
  //       if (logs.err) return; // 忽略失败交易
  //       console.log(logs, 'logs')
  //       connection.getParsedTransaction(
  //         logs.signature,
  //         { commitment: 'confirmed' }
  //       ).then(tx => {
  //         console.log(tx, 'tx')

  //         // const swaoInstruction = tx.transaction.message.instructions.forEach(ix => {
  //         //   if (ix.programId) {
  //         //     console.log(ix.programId.toBase58())
  //         //   }
  //         // })
  //         // parseTokenTransfer(tx);
  //       });
  //       // 检查是否包含转账指令
  //       // if (logs.logs.some(log =>
  //       //   log.includes('Instruction: Transfer') ||
  //       //   log.includes('Instruction: TransferChecked')
  //       // )) {

  //       // }
  //     },
  //     'confirmed'
  //   );

  //   return () => {
  //     // 取消订阅
  //     if (timerRfe.current) connection.removeOnLogsListener(timerRfe.current);
  //   }
  // }, [])

  const test = async () => {
    try {
      console.log('first')
      const txHash = '3gGp3BZDa2Dx3Xw1kRXHEZF3UD6NSp295cqEda5bZYxgrpdEGtnrHJSwqP4cEBoCGHbH16mEMJHp8UyF7ScWFskV'
      // 1. 获取交易详情
      const tx = await connection.getParsedTransaction(txHash, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 1
      });
      console.log(tx)
    } catch (error) {
      console.log(error,'ssssss')
    }
  }

  function parseTokenTransfer(parsedTx) {
    try {
      if (!parsedTx) return;

      // 提取代币转账指令
      const transferInstruction = parsedTx.transaction.message.instructions.find(
        ix =>
          // ix.programId.equals(TOKEN_PROGRAM_ID) &&
          (ix.parsed.type === 'transfer' || ix.parsed.type === 'transferChecked')
      );

      if (!transferInstruction) return;

      const { parsed } = transferInstruction;
      console.log(`
  🚀 代币转账检测到:
  - 代币: ${parsed.info.mint || '未知'}
  - 发送方: ${parsed.info.source}
  - 接收方: ${parsed.info.destination}
  - 数量: ${parsed.info.amount}
  - 交易ID: ${parsedTx.transaction.signatures[0]}
  `);
    } catch (error) {
      console.log(error)
    }
  }
  return (
    <div>

      <Button onClick={test}>test</Button>
    </div>
  )
}

export default Test