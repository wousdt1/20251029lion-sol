
import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import {
  getMint,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  AccountLayout,
  getAssociatedTokenAddressSync
} from "@solana/spl-token";
import { SOL_TOKEN } from '@/config/Token';
import type { SwapBotConfigType } from '@/type'

const BASE_NUMBER = 10000
//输出数量
export const getAmountIn = async (
  isSol: boolean,
  connection: Connection,
  account: Keypair,
  QueteToken: PublicKey,
  targetToken: PublicKey,
  isBuy: boolean,
  buyType: number,
  minBuy: number,
  maxBuy: number,
  sellType: number,
  minSell: number,
  maxSell: number,
) => {
  try {
    let balance = await connection.getBalance(account.publicKey)

    let amountIn = 0
    if (isBuy) { //拉盘
      let tokenB = balance
      if (!isSol) {
        tokenB = await getSPLBalance(connection, QueteToken, account.publicKey)
      }
      if (buyType === 1) {
        amountIn = minBuy
      } else if (buyType === 2) {
        const min = minBuy * BASE_NUMBER
        const max = maxBuy * BASE_NUMBER
        amountIn = getRandomNumber(min, max) / BASE_NUMBER
      } else if (buyType === 3) {
        amountIn = tokenB * minBuy / 100
      } else if (buyType === 4) {
        const min = minBuy * BASE_NUMBER
        const max = maxBuy * BASE_NUMBER
        const _amountIn = getRandomNumber(min, max) / BASE_NUMBER
        amountIn = tokenB * _amountIn / 100
      }
      amountIn = Number(amountIn.toFixed(9))
    } else { //砸盘
      const tokenB = await getSPLBalance(connection, targetToken, account.publicKey)
      if (sellType === 1) { //固定金额
        amountIn = minSell
      } else if (sellType === 2) {
        const min = minSell * BASE_NUMBER
        const max = maxSell * BASE_NUMBER
        amountIn = getRandomNumber(min, max) / BASE_NUMBER
      } else if (sellType === 3) {
        amountIn = tokenB * minSell / 100
      } else if (sellType === 4) {
        const min = minSell * BASE_NUMBER
        const max = maxSell * BASE_NUMBER
        const _amountIn = getRandomNumber(min, max) / BASE_NUMBER
        amountIn = tokenB * _amountIn / 100
      }
      amountIn = Number(amountIn.toFixed(9))
      amountIn = amountIn <= tokenB ? amountIn : tokenB
      // amountIn = amountIn <= + 0.00001 ? 0 : amountIn
    }
    return { balance, amountIn }
  } catch (error) {
    return { balance: 0, amountIn: 0 }
  }
}



export function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 两个数之间随机整数 含最大值，含最小值
 * @param min 
 * @param max 
 * @returns number 类型
 */
export function getRandomNumber(min: number, max: number) {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export async function getSPLBalance(
  connection: Connection,
  mintAddress: PublicKey,
  pubKey: PublicKey,
  allowOffCurve = false
) {
  try {
    let ata = getAssociatedTokenAddressSync(mintAddress, pubKey, allowOffCurve);
    const balance = await connection.getTokenAccountBalance(ata, "processed");
    return Number(balance.value.uiAmount);
  } catch (e) {
    return 0;
  }
};

// 获取当前时间并格式化为 YYYY-MM-DD HH:mm:ss
export const getCurrentTimestamp = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
};



const getAt = async (mintAccount: PublicKey, walletAccount: PublicKey) => {
  let at: PublicKey = await getAssociatedTokenAddress(
    mintAccount,
    walletAccount,
    true,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  return at;
};
export const getWalletsInfo = (connection: Connection, keys: string[], tokenAaddr: string,
  tokenBaddr: string
): Promise<SwapBotConfigType[]> => {
  return new Promise(async (resolve, reject) => {
    try {
      const config: SwapBotConfigType[] = []
      const _privateKeys = keys
      if (_privateKeys.length === 0) {
        resolve(config)
      }

      const accountsArr: PublicKey[] = [] //钱包地址
      _privateKeys.forEach(async (item, index) => {
        const wallet = Keypair.fromSecretKey(bs58.decode(item))
        const address = wallet.publicKey
        accountsArr.push(address)
      })

      let tokenAdecimals = 9 //代币信息
      let associaArr: PublicKey[] = []; //目标代币数组

      let baseAccouns: PublicKey[] = [] //价值代币
      let baseDecimals = 9

      if (tokenAaddr && tokenAaddr !== SOL_TOKEN) {
        const mintInfo = await getMint(connection, new PublicKey(tokenAaddr));
        tokenAdecimals = mintInfo.decimals
        for (const account of accountsArr) { //tokenA对应派生账号
          const to = await getAt(new PublicKey(tokenAaddr), account);
          associaArr.push(to)
        }
      }
      if (tokenBaddr && tokenBaddr !== SOL_TOKEN) {
        const mintInfo = await getMint(connection, new PublicKey(tokenBaddr));
        baseDecimals = mintInfo.decimals
        for (const account of accountsArr) {
          const to = await getAt(new PublicKey(tokenBaddr), account);
          baseAccouns.push(to)
        }
      }

      let accountsArrSlice = []
      let associaArrSlice = []
      let baseArrSlice = []
      for (let i = 0; i < accountsArr.length; i += 100) {
        accountsArrSlice.push(accountsArr.slice(i, i + 100))
        associaArrSlice.push(associaArr.slice(i, i + 100))
        baseArrSlice.push(baseAccouns.slice(i, i + 100))
      }
      let accountsSOL: any[] = []
      let associaBalace: any[] = []
      let basetBalace: any[] = []

      for (let i = 0; i < accountsArrSlice.length; i++) {
        const _accountSol = await connection.getMultipleAccountsInfo(accountsArrSlice[i], "processed")
        accountsSOL = [...accountsSOL, ..._accountSol]
        if (associaArrSlice[i]) {
          const _associaBalace = await connection.getMultipleAccountsInfo(associaArrSlice[i], "processed")
          associaBalace = [...associaBalace, ..._associaBalace]
        }
        if (baseArrSlice[i]) {
          const _basetBalace = await connection.getMultipleAccountsInfo(baseArrSlice[i], "processed")
          basetBalace = [...basetBalace, ..._basetBalace]
        }
      }

      let accountInfoList: SwapBotConfigType[] = []

      for (let i = 0; i < accountsSOL.length; i++) {
        let solBalance = 0
        if (accountsSOL[i] != undefined) {
          solBalance = accountsSOL[i].lamports / 10 ** 9
        }
        let tokenBalance = 0
        if (tokenAaddr === SOL_TOKEN) {
          tokenBalance = solBalance
        } else if (associaBalace[i] != undefined) {
          const accountData = AccountLayout.decode(associaBalace[i].data);
          tokenBalance = Number(accountData.amount) / 10 ** tokenAdecimals
        }
        let baseTokenB = 0
        if (tokenBaddr === SOL_TOKEN) {
          baseTokenB = solBalance
        } else if (basetBalace[i] != undefined) {
          const accountData = AccountLayout.decode(basetBalace[i].data);
          baseTokenB = Number(accountData.amount) / 10 ** baseDecimals
        }
        accountInfoList.push(
          {
            isCheck: true,
            privateKey: _privateKeys[i],
            walletAddr: accountsArr[i].toBase58(),
            balance: solBalance ? Number(solBalance.toFixed(4)) : 0,
            tokenABalance: tokenBalance ? Number(tokenBalance.toFixed(4)) : 0,
            assiciaAccountA: associaArr[i] ? associaArr[i] : null,
            state: 0,
            tokenBBalace: baseTokenB ? Number(baseTokenB.toFixed(4)) : 0,
            assiciaAccountB: baseAccouns[i] ? baseAccouns[i] : null,
          }
        )
      }
      console.log(accountInfoList, 'accountInfoList')
      resolve(accountInfoList)
    } catch (error) {
      reject(error)
    }
  })
}