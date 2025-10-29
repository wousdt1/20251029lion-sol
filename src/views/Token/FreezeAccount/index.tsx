import { useEffect, useState } from 'react'
import { Button, notification, Input, message } from 'antd'
import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useTranslation } from "react-i18next";
import {
  createFreezeAccountInstruction
} from "@solana/spl-token";
import axios from 'axios';
import type { Token_Type } from '@/type'
import { useIsVip } from '@/hooks';
import { Input_Style, Button_Style, BANANATOOLS_ADDRESS, FREE_TOKEN_FEE } from '@/config'
import { getTxLink, addPriorityFees } from '@/utils'
import { getAta } from '@/utils/getAta'
import { Page } from '@/styles';
import { Header, SelectToken, Result } from '@/components'
import { BurnPage } from './style'

function BrunToken() {
  const { t } = useTranslation()
  const [api, contextHolder1] = notification.useNotification();
  const [messageApi, contextHolder] = message.useMessage();
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [token, setToken] = useState<Token_Type>(null)
  const [freezeAccount, setFreezeAccount] = useState('')
  const vipConfig = useIsVip()

  const [isBurning, setIsBurning] = useState<boolean>(false);
  const [signature, setSignature] = useState("");
  const [error, setError] = useState('');

  useEffect(() => {
    if (token && token.address && freezeAccount && connection) {
      setState('')
      getState()
    }
  }, [token, freezeAccount, connection])

  const freezeAccountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFreezeAccount(e.target.value)
  }
  const backClick = (_token: Token_Type) => {
    setToken(_token)
  }
  const [state, setState] = useState('')
  const getState = async () => {

    try {
      const _token = new PublicKey(token.address)
      const account = new PublicKey(freezeAccount)
      //派生账户
      let ata: PublicKey = null
      try {
        ata = await getAta(connection, _token, account)
        console.log(ata, 'ata')
      } catch (error) {
        console.log(error)
        ata = null
      }
      if (!ata) {
        setState('当前账户中没有该代币，不需要冻结')
        return
      }

      const requestBody = {
        jsonrpc: "2.0",
        id: "131c3f19-709d-4711-bdd6-b56e173e3685",
        method: "getAccountInfo",
        params: [
          ata, // 目标账户地址
          {
            encoding: "jsonParsed", // 数据格式
          }
        ]
      };

      const response = await axios.post(connection.rpcEndpoint, requestBody, {
        headers: {
          "Content-Type": "application/json"
        }
      })
      const state = response.data.result.value.data.parsed.info.state
      if (state == 'frozen') {
        setState('当前账户中已被冻结')
      }

    } catch (error) {
      setState('')
    }
  }

  const freezeAccountClick = async () => {
    try {
      setIsBurning(true);
      setSignature('')
      setError('')
      setState('')
      const _token = new PublicKey(token.address)
      const account = new PublicKey(freezeAccount)
      //派生账户
      let ata: PublicKey = null
      try {
        ata = await getAta(connection, _token, account)
      } catch (error) {
        ata = null
      }
      if (!ata) {
        setIsBurning(false)
        messageApi.error('当前账户中没有该代币，不需要冻结')
        return
      }

      let Tx = new Transaction().add(
        createFreezeAccountInstruction(
          ata,
          _token,
          publicKey,
        )
      )
      if (!vipConfig.isVip) {
        const fee = SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(BANANATOOLS_ADDRESS),
          lamports: FREE_TOKEN_FEE * LAMPORTS_PER_SOL,
        })
        Tx.add(fee)
      }

      //增加费用，减少失败
      const versionedTx = await addPriorityFees(connection, Tx, publicKey)

      const signature = await sendTransaction(versionedTx, connection);
      const confirmed = await connection.confirmTransaction(
        signature,
        "processed"
      );
      setSignature(signature)
      setIsBurning(false);
      api.success({ message: 'freezeAccount success' })
    } catch (error) {
      console.log(error)
      setIsBurning(false);
      api.error({ message: error.toString() })
      const err = (error as any)?.message;
      if (
        err.includes(
          "Cannot read properties of undefined (reading 'public_keys')"
        )
      ) {
        setError("It is not a valid Backpack username");
      } else {
        setError(err);
      }
    }
  }


  return (
    <Page>
      {contextHolder}
      {contextHolder1}
      <Header title={t('冻结账户')}
        hint='“黑名单”功能，禁止某些帐户执行如发送交易特定操作，有助于防止恶意机器人行为对资产造成损害，并为用户提供更多的控制权以制定更有效的市场策略。' />

      <BurnPage>
        <div >
          <div className='title'>请选择代币</div>
          <SelectToken callBack={backClick} selecToken={token} />
        </div>
        <div className='mt-5 '>
          <div className='title'>冻结地址</div>
          <Input className={Input_Style} status={state && 'error'} placeholder={t('请输入需要冻结的钱包地址')}
            value={freezeAccount} onChange={freezeAccountChange} />
          <div className='state'>{state}</div>
        </div>

        <div className='btn'>
          <div className='buttonSwapper mt-4'>
            <Button className={Button_Style} onClick={freezeAccountClick} loading={isBurning}>确认冻结</Button>
          </div>
          <div className='fee'>全网最低服务费: {vipConfig.isVip ? 0 : FREE_TOKEN_FEE} SOL</div>
        </div>

        <Result signature={signature} error={error} />
      </BurnPage>
    </Page>
  )
}

export default BrunToken