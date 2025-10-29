import { useState, useEffect } from 'react'
import { Input, Switch, DatePicker, Button, notification, Segmented } from 'antd'
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { Page } from '@/styles'
import { SOL, PUMP } from '@/config/Token'
import type { Token_Type } from '@/type'
import { Header, SelectToken, Result, Hint } from '@/components'
import AddPool from './AddPool'
import RemovePool from './RemovePool'

const SGECONFIG = [
  { label: '创建流动性 DLMM', value: 1 },
  { label: '移除流动性', value: 2 },
]


function CreateLiquidity() {
  const [api, contextHolder1] = notification.useNotification();
  const [pooltype, setPoolType] = useState(1)


  const pooltypeChange = (e) => {
    setPoolType(e)
  }


  return (
    <Page>
      {contextHolder1}
      <Header title='Meteora创建流动性池' hint='轻松创建任何 Solana 代币的流动资金池。您的代币将可在 Meteora、Birdeye 和 DexScreener 上进行交易。' />
      <div className='mb-5'>
        <Segmented options={SGECONFIG} size='large' value={pooltype} onChange={pooltypeChange} />
      </div>

      {pooltype === 1 && <AddPool />}
      {pooltype === 2 && <RemovePool />}

    </Page>
  )
}

export default CreateLiquidity