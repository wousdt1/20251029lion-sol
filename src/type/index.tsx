import { PublicKey, } from "@solana/web3.js";


export interface TOKEN_TYPE {
  name: string
  symbol: string
  decimals: string
  supply: string
  description: string
  website: string
  telegram: string
  twitter: string
  discord: string

  freeze_authority?: string
  mint_authority?: string
  mutable?: boolean
  owner?: string
  metadataUrl?: string
  image?: string
}

export interface TOKEN_TYPE_2022 {
  name: string
  symbol: string
  decimals: string
  supply: string
  description: string
  website: string
  telegram: string
  twitter: string
  discord: string

  fee: string
  maxFee: string
  authAdrr: string
  fundAddr: string
  proxyAuthority: string
  interestRate: string

  freeze_authority?: string
  mint_authority?: string
  mutable?: boolean
  owner?: string
  metadataUrl?: string
  image?: string
}



export interface Token_Type {
  name: string
  symbol: string
  address: string
  decimals: number
  image: string
  balance: string
  associatedAccount?: string
  isSelect?: boolean
}

export interface WalletConfigType {
  privateKey: string,
  walletAddr: string,
  balance: string,
  buySol: string,
}

export interface CollocetionType {
  isCheck: boolean
  privateKey: string,
  walletAddr: string,
  balance: number,
  tokenBalance: number,
  assiciaAccount: PublicKey,
  state: number // 0 未执行，1 执行成功，2 执行失败
  baseTBalace: number
  baseAssiciaAccount: PublicKey,
}

export interface SwapBotConfigType {
  isCheck: boolean
  privateKey: string,
  walletAddr: string,
  balance: number,
  tokenABalance: number,
  assiciaAccountA: PublicKey,
  state: number // 0 未执行，1 执行成功，2 执行失败
  tokenBBalace: number
  assiciaAccountB: PublicKey,
}


export interface SwapConfigType {
  modeType: number, //模式 1拉盘 2砸盘 3刷量
  buyType: number, //1固定金额 2随机金额 3固定百分比 4随机百分比
  sellType: number,//1固定金额 2随机金额 3固定百分比 4随机百分比
  buyChance: string, //买入概率
  minBuy: string,
  maxBuy: string,
  minSell: string,
  maxSell: string,
  minTime: string,
  maxTime: string,
  slippage: string, //滑点

  targetPrice: string, //目标价格
  rpc: string
}