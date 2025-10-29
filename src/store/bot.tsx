import { createSlice } from '@reduxjs/toolkit'
import type { RootState } from '@/store'
import { SOL, PUMP, USDT } from '@/config/Token'
import { SwapConfigType, Token_Type } from '@/type'

const initialState = {
  isMainnet: true,
  rpcUrl: 'https://mainnet.helius-rpc.com/?api-key=d5ef7520-8431-4dc4-b832-b1fe3cf1b242',
  // rpcUrl: 'https://helius-rpc.slerf.tools/'
  // rpcUrl: 'https://mainnet.helius-rpc.com/?api-key=812db19f-55d0-417a-8e7e-0ade8df22075',
  // rpcUrl: 'https://mainnet.helius-rpc.com/?api-key=1ebd5af0-f37c-4aaa-861e-2d8f5e656516'
  // isMainnet: false,
  // rpcUrl: 'https://devnet.helius-rpc.com/?api-key=3cd5c6c7-a026-49c1-9fd5-ef93dffec390',
  tokenA: SOL,
  tokenB: PUMP,
  dexCount: 1, // 1raydium 2pump
  rayPoolType: 1, // 1 AMM 2 cpmm 3 clmm
  swapConfig: {
    modeType: 1, //模式 1拉盘 2砸盘 3刷量
    buyType: 1,//1固定金额 2随机金额 3固定百分比 4随机百分比
    sellType: 1,//1固定金额 2随机金额 3固定百分比 4随机百分比
    buyChance: '80', //买入概率
    minBuy: '0.01',
    maxBuy: '0.01',
    minSell: '',
    maxSell: '',
    minTime: '3',
    maxTime: '3',
    slippage: '5', //滑点

    targetPrice: '1', //目标价格
    rpc: ''
  },
  privateKeys: []
}

export const counterSlice = createSlice({
  name: 'counter',
  initialState,
  reducers: {
    isMainnetChange: (state, action) => {
      state.isMainnet = action.payload
    },
    rpcUrlChange: (state, action) => {
      state.rpcUrl = action.payload
    },
    tokenAChange(state, action) {
      state.tokenA = action.payload
    },
    tokenBChange(state, action) {
      state.tokenB = action.payload
    },
    dexCountChange(state, action) {
      state.dexCount = action.payload
    },
    swapConfigChange(state, action) {
      state.swapConfig = action.payload
    },
    privateKeysChange(state, action) {
      state.privateKeys = action.payload
    },
    rayPoolTypeChange(state, action) {
      state.rayPoolType = action.payload
    }
  },
})

export const {
  isMainnetChange,
  rpcUrlChange,
  tokenAChange,
  tokenBChange,
  dexCountChange,
  swapConfigChange,
  privateKeysChange,
  rayPoolTypeChange
} = counterSlice.actions

// Other code such as selectors can use the imported `RootState` type
export const isMainnet = (state: { isMainnet: boolean }) => state.isMainnet
export const rpcUrl = (state: { rpcUrl: string }) => state.rpcUrl
export const _tokenA = (state: { tokenA: Token_Type }) => state.tokenA
export const _tokenB = (state: { tokenB: Token_Type }) => state.tokenB
export const _dexCount = (state: { dexCount: number }) => state.dexCount
export const _swpConfig = (state: { swapConfig: SwapConfigType }) => state.swapConfig
export const _privateKeys = (state: { privateKeys: string[] }) => state.privateKeys
export const _rayPoolType = (state: { rayPoolType: number }) => state.rayPoolType




export default counterSlice.reducer
