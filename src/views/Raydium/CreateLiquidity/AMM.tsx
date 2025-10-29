import { useState } from 'react'
import { Input, Switch, DatePicker, Button, notification, Space, Segmented } from 'antd'
import type { DatePickerProps } from 'antd';
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL, Transaction, TransactionInstruction } from '@solana/web3.js'
import {
  MARKET_STATE_LAYOUT_V3,
  AMM_V4,
  OPEN_BOOK_PROGRAM,
  FEE_DESTINATION_ID,
  DEVNET_PROGRAM_ID,
  TxVersion,
  getLiquidityAssociatedId,
} from '@raydium-io/raydium-sdk-v2'
import base58 from "bs58";
import * as BufferLayout from 'buffer-layout';
import BN from 'bn.js'
import { initSdk } from '@/Dex/Raydium'
import { getTxLink, addPriorityFees } from '@/utils'
import { Input_Style, Button_Style, CREATE_POOL_FEE, BANANATOOLS_ADDRESS } from '@/config'
import { useIsVip } from '@/hooks';
import { useConfig } from '@/hooks';
import { SOL, PUMP } from '@/config/Token'
import type { Token_Type } from '@/type'
import { JitoFee, SelectToken, Result, Hint } from '@/components'
import { CreatePool } from './style'

interface PropsType {
  isAndBuy?: boolean
}
declare type AssociatedName = "amm_associated_seed" | "lp_mint_associated_seed" | "coin_vault_associated_seed" | "pc_vault_associated_seed" | "lp_mint_associated_seed" | "temp_lp_token_associated_seed" | "open_order_associated_seed" | "target_associated_seed" | "withdraw_associated_seed";

function CreateLiquidity(props: PropsType) {
  const { isAndBuy } = props
  const { _isMainnet, OPENBOOK_PROGRAM_ID } = useConfig()
  const [api, contextHolder1] = notification.useNotification();
  const { connection } = useConnection();
  const { publicKey, sendTransaction, signTransaction } = useWallet();
  const vipConfig = useIsVip()
  const [baseToken, setBaseToken] = useState<Token_Type>(PUMP)
  const [token, setToken] = useState<Token_Type>(SOL)
  const [isOptions, setIsOptions] = useState(false)
  const [isCreate, setIsCreate] = useState(false)
  const [signature, setSignature] = useState("");
  const [error, setError] = useState('');
  const [poolAddr, setPoolAddr] = useState('')
  const [isSearchId, setIsSearchId] = useState(false)
  const [jitoOpen, setJitoOpen] = useState(false)
  const [jitoFee, setJitoFee] = useState<number>(0)
  const [jitoRpc, setJitoRpc] = useState('')

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
  const jitoCallBack = (jitoFee_: number, jitoRpc_: string) => {
    setJitoFee(jitoFee_)
    setJitoRpc(jitoRpc_)
  }

  const ACCOUNT_LAYOUT = BufferLayout.struct([
    BufferLayout.blob(53, 'mint'),
    BufferLayout.blob(32, 'owner'),
    BufferLayout.blob(85, 'base'),
    BufferLayout.nu64('amount'),
    BufferLayout.blob(93),
  ]);
  const findMarketId = async () => {
    try {
      setIsSearchId(true)
      const result = await connection.getProgramAccounts(new PublicKey(OPENBOOK_PROGRAM_ID), {
        filters: [
          {
            memcmp: {
              offset: ACCOUNT_LAYOUT.offsetOf('owner'),
              bytes: baseToken.address,
            },
          },
          {
            memcmp: {
              offset: ACCOUNT_LAYOUT.offsetOf('base'),
              bytes: token.address,
            },
          },
        ]
      });
      if (result.length > 0) {
        const marketId = result[0].pubkey.toBase58()
        setConfig({ ...config, marketId })
        api.success({ message: "查找成功" })
      } else {
        api.success({ message: "没有查找到ID" })
      }
      setIsSearchId(false)
    } catch (error) {
      console.log(error)
      api.error({ message: error.toString() })
      setIsSearchId(false)
    }
  }

  const createClick = async () => {
    try {
      if (!token) return api.error({ message: "请选择代币" })
      if (!config.marketId) return api.error({ message: "请填写市场ID" })
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

      const marketId = new PublicKey(config.marketId)
      // if you are confirmed your market info, don't have to get market info from rpc below
      const marketBufferInfo = await raydium.connection.getAccountInfo(new PublicKey(marketId))
      const marketData = MARKET_STATE_LAYOUT_V3.decode(marketBufferInfo!.data)
      const { baseMint, quoteMint } = MARKET_STATE_LAYOUT_V3.decode(marketBufferInfo!.data)
      const txVersion = TxVersion.V0 // or TxVersion.LEGACY
      const baseAmount = new BN(Number(config.baseAmount) * (10 ** baseToken.decimals))
      const quoteAmount = new BN(Number(config.quoteAmount) * (10 ** token.decimals))

      const execute = await raydium.liquidity.createPoolV4({
        programId: _isMainnet ? AMM_V4 : DEVNET_PROGRAM_ID.AmmV4,
        marketInfo: {
          marketId,
          programId: _isMainnet ? OPEN_BOOK_PROGRAM : DEVNET_PROGRAM_ID.OPENBOOK_MARKET,
        },
        baseMintInfo: {
          mint: baseMint,
          decimals: baseToken.decimals, // if you know mint decimals here, can pass number directly
        },
        quoteMintInfo: {
          mint: quoteMint,
          decimals: token.decimals, // if you know mint decimals here, can pass number directly
        },
        baseAmount, // if devent pool with sol/wsol, better use amount >= 4*10**9
        quoteAmount, // if devent pool with sol/wsol, better use amount >= 4*10**9
        startTime, // unit in seconds
        ownerInfo: {
          feePayer: publicKey,
          useSOLBalance: true,
        },
        associatedOnly: false,
        txVersion,
        checkCreateATAOwner: true,
        feeDestinationId: _isMainnet ? FEE_DESTINATION_ID : DEVNET_PROGRAM_ID.FEE_DESTINATION_ID, // devnet
        // optional: set up priority fee here
        // computeBudgetConfig: {
        //   units: 600000,
        //   microLamports: 4659150,
        // },
      })
      const poolId = execute.extInfo.address.ammId.toBase58()
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

      if (!isAndBuy) {
        //增加费用，减少失败
        const versionedTx = await addPriorityFees(connection, Tx, publicKey)
        const signature = await sendTransaction(versionedTx, connection);
        const confirmed = await connection.confirmTransaction(
          signature,
          "processed"
        );
        setSignature(signature)
      } else { //捆绑


        // Get recent blockhash
        const { blockhash } = await connection.getLatestBlockhash("processed");
        Tx.recentBlockhash = blockhash;
        Tx.feePayer = publicKey;

        const transactions: string[] = [];
        // Sign the transaction
        const finalTxId = await signTransaction(Tx);
        const txId = await connection.sendRawTransaction(finalTxId.serialize()!);
        console.log(`${getTxLink(txId)}`);

      }

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

        <div className='mt-5'>
          <div className='flex mb-1 justify-between'>
            <div>OpenBook市场 ID(没有？去创建)</div>
            <Button type='primary' onClick={findMarketId} loading={isSearchId}>查找Market ID</Button>
          </div>
          <div>
            <Input className={Input_Style} value={config.marketId} onChange={configChange} name='marketId' />
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


        {isAndBuy ?
          <div className='flex items-center mt-5 options'>
            <div className='mr-3 mb-2'>高级选项</div>
            <Switch checked={jitoOpen} onChange={(e) => setJitoOpen(e)} />
          </div> :
          <div className='flex items-center mt-5 options'>
            <div className='mr-3 mb-2'>开盘时间</div>
            <Switch checked={isOptions} onChange={(e) => setIsOptions(e)} />
          </div>
        }
        {jitoOpen && isAndBuy && <JitoFee callBack={jitoCallBack} />}


        {isOptions && !isAndBuy &&
          <>
            <Space direction="vertical" size={12}>
              <DatePicker showTime onChange={timeOnChange} size='large' />
            </Space>
          </>
        }

        <Hint title='当创建流动性至Raydium时，Raydium官方将收取0.4 SOL的手续费。为确保操作成功，请确保账户中预留至少0.5 SOL，以避免因余额不足导致添加流动性失败。' showClose />

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