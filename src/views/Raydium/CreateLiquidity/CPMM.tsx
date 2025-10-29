import { useState } from 'react'
import { Input, Switch, DatePicker, Button, notification, Space, Segmented } from 'antd'
import type { DatePickerProps } from 'antd';
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL, Transaction, TransactionInstruction } from '@solana/web3.js'
import {
  DEVNET_PROGRAM_ID,
  getCpmmPdaAmmConfigId,
  CREATE_CPMM_POOL_PROGRAM,
  CREATE_CPMM_POOL_FEE_ACC
} from '@raydium-io/raydium-sdk-v2'
import { useIsVip } from '@/hooks';
import BN from 'bn.js'
import { initSdk, txVersion } from '@/Dex/Raydium'
import { getTxLink, addPriorityFees } from '@/utils'
import { Input_Style, Button_Style, CREATE_POOL_FEE, BANANATOOLS_ADDRESS } from '@/config'
import { useConfig } from '@/hooks';
import { SOL, PUMP } from '@/config/Token'
import type { Token_Type } from '@/type'
import { Header, SelectToken, Result, Hint } from '@/components'
import { CreatePool } from './style'


function CreateLiquidity() {
  const [api, contextHolder1] = notification.useNotification();
  const { connection } = useConnection();
  const { _isMainnet } = useConfig()
  const { publicKey, sendTransaction, signAllTransactions } = useWallet();
  const vipConfig = useIsVip()
  const [baseToken, setBaseToken] = useState<Token_Type>(PUMP)
  const [token, setToken] = useState<Token_Type>(SOL)
  const [isOptions, setIsOptions] = useState(false)
  const [isCreate, setIsCreate] = useState(false)
  const [signature, setSignature] = useState("");
  const [error, setError] = useState('');
  const [poolAddr, setPoolAddr] = useState('')

  const [config, setConfig] = useState({
    marketId: '',
    baseAmount: '',
    quoteAmount: '',
    startTime: ''
  })
  const configChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfig({ ...config, [e.target.name]: e.target.value })
  }
  const baseChange = (_token: Token_Type) => {
    setBaseToken(_token)
  }
  const backClick = (_token: Token_Type) => {
    setToken(_token)
  }
  const timeOnChange: DatePickerProps['onChange'] = (date, dateString) => {
    const time = Date.parse(dateString as string) / 1000
    setConfig({ ...config, startTime: time.toString() })
  };


  const createClick = async () => {
    try {
      if (!token) return api.error({ message: "请选择代币" })
      if (!config.baseAmount) return api.error({ message: "请填写价值代币数量" })
      if (!config.quoteAmount) return api.error({ message: "请填写报价代币数量" })

      setIsCreate(true)
      let startTime = new BN(0)
      if (isOptions && config.startTime) {
        startTime = new BN(config.startTime)
      }
      const raydium = await initSdk({
        owner: publicKey,
        connection: connection,
      });

      // RAY
      const mintA = await raydium.token.getTokenInfo(baseToken.address)
      // USDC
      const mintB = await raydium.token.getTokenInfo(token.address)
      const feeConfigs = await raydium.api.getCpmmConfigs()

      if (!_isMainnet) {
        feeConfigs.forEach((config) => {
          config.id = getCpmmPdaAmmConfigId(DEVNET_PROGRAM_ID.CREATE_CPMM_POOL_PROGRAM, config.index).publicKey.toBase58()
        })
      }

      const baseAmount = new BN(Number(config.baseAmount) * (10 ** baseToken.decimals))
      const quoteAmount = new BN(Number(config.quoteAmount) * (10 ** token.decimals))

      const execute = await raydium.cpmm.createPool({
        // poolId: // your custom publicKey, default sdk will automatically calculate pda pool id
        programId: _isMainnet ? CREATE_CPMM_POOL_PROGRAM : DEVNET_PROGRAM_ID.CREATE_CPMM_POOL_PROGRAM, // devnet: DEVNET_PROGRAM_ID.CREATE_CPMM_POOL_PROGRAM
        poolFeeAccount: _isMainnet ? CREATE_CPMM_POOL_FEE_ACC : DEVNET_PROGRAM_ID.CREATE_CPMM_POOL_FEE_ACC, // devnet:  DEVNET_PROGRAM_ID.CREATE_CPMM_POOL_FEE_ACC
        mintA,
        mintB,
        mintAAmount: baseAmount,
        mintBAmount: quoteAmount,
        startTime,
        feeConfig: feeConfigs[0],
        associatedOnly: false,
        ownerInfo: {
          useSOLBalance: true,
        },
        txVersion,
        // optional: set up priority fee here
        // computeBudgetConfig: {
        //   units: 600000,
        //   microLamports: 46591500,
        // },
      })
      const poolId = execute.extInfo.address.poolId.toBase58()
      const _transaction = execute.transaction;
      const Tx = new Transaction();
      const instructions = _transaction.message.compiledInstructions.map((instruction: any) => {
        return new TransactionInstruction({
          keys: instruction.accountKeyIndexes.map((index: any) => ({
            pubkey: _transaction.message.staticAccountKeys[index],
            isSigner: _transaction.message.isAccountSigner(index),
            isWritable: _transaction.message.isAccountWritable(index),
          })),
          programId: _transaction.message.staticAccountKeys[instruction.programIdIndex],
          data: Buffer.from(instruction.data),
        });
      });
      instructions.forEach((instruction: any) => Tx.add(instruction));
      if (!vipConfig.isVip) {
        const fee = SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(BANANATOOLS_ADDRESS),
          lamports: CREATE_POOL_FEE * LAMPORTS_PER_SOL,
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
      setPoolAddr(poolId)
      console.log("confirmation", signature);
      setIsCreate(false);
      api.success({ message: 'create pool success' })
    } catch (error) {
      console.log(error)
      api.error({ message: error.toString() })
      setIsCreate(false);
    }
  }

  return (
    <>
      {contextHolder1}

      <CreatePool>
        <div className='token'>
          <div className='tokenItem  mr-5'>
            <div className='mb-1 start'>价值代币</div>
            <SelectToken selecToken={token} callBack={backClick} />
          </div>
          <div className='tokenItem'>
            <div className='mb-1 start'>目标代币</div>
            <SelectToken selecToken={baseToken} callBack={baseChange} />
          </div>
        </div>

        <div className='token mt-5'>
          <div className='tokenItem mr-5'>
            <div className='mb-1 start'>价值代币数量</div>
            <Input className={Input_Style} type='number' value={config.quoteAmount} onChange={configChange} name='quoteAmount' />
          </div>
          <div className='tokenItem'>
            <div className='mb-1 start'>目标代币数量</div>
            <Input className={Input_Style} type='number' value={config.baseAmount} onChange={configChange} name='baseAmount' />
          </div>
        </div>


        <div className='flex items-center mt-5 options'>
          <div className='mr-3 mb-2'>开盘时间</div>
          <Switch checked={isOptions} onChange={(e) => setIsOptions(e)} />
        </div>
        {isOptions &&
          <>
            <Space direction="vertical" size={12}>
              <DatePicker showTime onChange={timeOnChange} size='large' />
            </Space>
          </>
        }

        <Hint title='当创建流动性至Raydium时，Raydium官方将收取0.2 SOL的手续费。为确保操作成功，请确保账户中预留至少0.3 SOL，以避免因余额不足导致添加流动性失败。' showClose />

        <div className='btn'>
          <div className='buttonSwapper mt-4'>
            <Button className={Button_Style} onClick={createClick} loading={isCreate}>创建</Button>
          </div>
          <div className='fee'>全网最低服务费: {vipConfig.isVip ? 0 : CREATE_POOL_FEE} SOL</div>
        </div>

        <Result tokenAddress={poolAddr} signature={signature} error={error} />
      </CreatePool>

    </>
  )
}

export default CreateLiquidity