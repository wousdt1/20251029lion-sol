import { useMemo, useState } from 'react'
import { Input, Button, notification } from 'antd'
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import {
  PublicKey, SystemProgram, LAMPORTS_PER_SOL, Transaction,
  ComputeBudgetProgram, VersionedTransaction, Keypair
} from '@solana/web3.js'
import { BigNumber, ethers } from 'ethers';
import BN from 'bn.js'
import DLMM, {
  deriveCustomizablePermissionlessLbPair, LBCLMM_PROGRAM_IDS, StrategyType,
  autoFillYByStrategy
} from "@meteora-ag/dlmm"
import { Input_Style, Button_Style, MeteOra_Fee, BANANATOOLS_ADDRESS } from '@/config'
import { useConfig, useIsVip } from '@/hooks';
import { SOL, PUMP } from '@/config/Token'
import type { Token_Type } from '@/type'
import { SelectToken, Result, Hint } from '@/components'
import { CreatePool } from '../style'

export enum ActivationTypeConfig {
  Slot = "slot",
  Timestamp = "timestamp"
}

export enum PriceRoundingConfig {
  Up = "up",
  Down = "down"
}

export function isPriceRoundingUp(
  priceRoundingConfig: string
): boolean {
  return priceRoundingConfig == PriceRoundingConfig.Up
}


function CreateLiquidity() {
  const [api, contextHolder1] = notification.useNotification();
  const { connection } = useConnection();
  const { _isMainnet } = useConfig()
  const { publicKey, sendTransaction, signAllTransactions } = useWallet();
  const wallet = useWallet()
  const vipConfig = useIsVip()
  const [baseToken, setBaseToken] = useState<Token_Type>(PUMP)
  const [token, setToken] = useState<Token_Type>(SOL)
  const [isOptions, setIsOptions] = useState(false)
  const [isCreate, setIsCreate] = useState(false)
  const [signature, setSignature] = useState("");
  const [error, setError] = useState('');
  const [poolAddr, setPoolAddr] = useState('')

  const [config, setConfig] = useState({
    baseAmount: '',
    quoteAmount: '',
    baseFee: '0.1',
    // BinStep: '1',

    priceRounding: 'up',
    computeUnitPriceMicroLamports: 100000
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

  const modifyComputeUnitPriceIx = (
    tx: VersionedTransaction | Transaction,
    newPriorityFee: number
  ): boolean => {
    if ("version" in tx) {
      for (let ix of tx.message.compiledInstructions) {
        let programId = tx.message.staticAccountKeys[ix.programIdIndex]
        if (programId && ComputeBudgetProgram.programId.equals(programId)) {
          // need check for data index
          if (ix.data[0] === 3) {
            ix.data = Uint8Array.from(
              ComputeBudgetProgram.setComputeUnitPrice({
                microLamports: newPriorityFee
              }).data
            )
            return true
          }
        }
      }
      // could not inject for VT
    } else {
      for (let ix of tx.instructions) {
        if (ComputeBudgetProgram.programId.equals(ix.programId)) {
          // need check for data index
          if (ix.data[0] === 3) {
            ix.data = ComputeBudgetProgram.setComputeUnitPrice({
              microLamports: newPriorityFee
            }).data
            return true
          }
        }
      }

      // inject if none
      tx.add(
        ComputeBudgetProgram.setComputeUnitPrice({
          microLamports: newPriorityFee
        })
      )
      return true
    }

    return false
  }


  const createClick = async () => {
    try {
      if (!token) return api.error({ message: "请选择代币" })
      if (!config.baseAmount) return api.error({ message: "请填写目标代币数量" })
      if (!config.quoteAmount) return api.error({ message: "请填写价值代币数量" })

      setIsCreate(true)

      const baseMint = new PublicKey(baseToken.address)
      const quoteMint = new PublicKey(token.address)

      const binStep = Number(config.baseFee) * 100
      const feeBps = Number(config.baseFee) * 100
      const hasAlphaVault = false
      const activationPoint = null
      const activationType = ActivationTypeConfig.Timestamp
      const creatorPoolOnOffControl = false

      const baseDecimals = baseToken.decimals
      const quoteDecimals = token.decimals

      const initPrice = DLMM.getPricePerLamport(
        baseDecimals,
        quoteDecimals,
        Number(getInitialPrice)
      )

      const activateBinId = DLMM.getBinIdFromPrice(
        initPrice,
        binStep,
        !isPriceRoundingUp(config.priceRounding)
      )

      const cluster = "mainnet-beta"
      const dlmmProgramId = new PublicKey(LBCLMM_PROGRAM_IDS[cluster])

      const initPoolTx = await DLMM.createCustomizablePermissionlessLbPair2(
        // @ts-expect-error: Connection version difference
        connection,
        new BN(binStep),
        baseMint,
        quoteMint,
        new BN(activateBinId.toString()),
        new BN(feeBps),
        activationType,
        hasAlphaVault,
        wallet.publicKey,
        activationPoint,
        creatorPoolOnOffControl,
        {
          cluster,
          programId: dlmmProgramId
        }
      )

      // @ts-expect-error: Transaction version difference
      modifyComputeUnitPriceIx(initPoolTx, config.computeUnitPriceMicroLamports)

      let poolKey: PublicKey
        ;[poolKey] = deriveCustomizablePermissionlessLbPair(
          baseMint,
          quoteMint,
          dlmmProgramId
        )

      console.log(`\n> Pool address: ${poolKey}`)
      const poolAddress = new PublicKey(poolKey.toString());

      let isdlmmPool = false
      try {
        // @ts-expect-error: Connection version difference
        const dlmmPool = await DLMM.create(connection, poolAddress);
        isdlmmPool = true
      } catch (error) {

      }

      if (!isdlmmPool) {
        const fee = SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(BANANATOOLS_ADDRESS),
          lamports: MeteOra_Fee * LAMPORTS_PER_SOL,
        })
        initPoolTx.add(fee)

        const _signature = await wallet.sendTransaction(initPoolTx as any, connection, { signers: [] })
        const confirmed = await connection.confirmTransaction(
          _signature,
          "processed"
        );
        console.log(confirmed, 'confirmed')
      }

      // @ts-expect-error: Connection version difference
      const dlmmPool = await DLMM.create(connection, poolAddress);
      console.log(dlmmPool, 'dlmmPool')
      const XAmount = Number(config.baseAmount);
      const XDecimals = baseToken.decimals;
      const totalRangeInterval = 10; // 10 bins on each StrategyType of the active bin
      const strategyType = StrategyType.Spot;


      // Get active bin information
      const activeBin = await dlmmPool.getActiveBin();
      // Calculate bin range
      const minBinId = activeBin.binId - totalRangeInterval;
      const maxBinId = activeBin.binId + totalRangeInterval;
      const totalYAmount = autoFillYByStrategy(
        activeBin.binId,
        dlmmPool.lbPair.binStep,
        new BN(XAmount * 10 ** XDecimals),
        activeBin.xAmount,
        activeBin.yAmount,
        minBinId,
        maxBinId,
        strategyType
      );
      console.log('Total Y amount:', totalYAmount.toString());
      // Create new position keypair
      const newBalancePosition = new Keypair();
      console.log('Created new position keypair:', newBalancePosition.publicKey.toBase58());
      // Create position
      const createPositionTx = await dlmmPool.initializePositionAndAddLiquidityByStrategy({
        positionPubKey: newBalancePosition.publicKey,
        user: wallet.publicKey,
        totalXAmount: new BN(XAmount * 10 ** XDecimals),
        totalYAmount,
        strategy: {
          maxBinId,
          minBinId,
          strategyType: strategyType,
        },
      });
      const _signature1 = await wallet.sendTransaction(createPositionTx as any,
        connection, { signers: [newBalancePosition] })
      const confirmed1 = await connection.confirmTransaction(_signature1, "processed");
      console.log(confirmed1, 'confirmed')
      setSignature(_signature1)
      setIsCreate(false);
      setPoolAddr(poolKey.toString())
      api.success({ message: '创建流动性成功' })
    } catch (error) {
      console.log(error)
      api.error({ message: error.toString() })
      setIsCreate(false);
    }
  }



  const getInitialPrice = useMemo(() => {
    let text = '0'
    if (config.baseAmount && config.quoteAmount) {
      const q = ethers.utils.parseEther(config.quoteAmount)
      const b = BigNumber.from(config.baseAmount)
      text = ethers.utils.formatEther(q.div(b))
    }
    return text
  }, [config])

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

        <div className='mt-2'>
          初始价格：{getInitialPrice} {token.symbol} / {baseToken.symbol}
        </div>

        <div className='token mt-5'>
          <div className='tokenItem'>
            <div className='mb-1 start'>基本费用(%)</div>
            <Input className={Input_Style} type='number' value={config.baseFee} onChange={configChange} name='baseFee' />
          </div>
        </div>


        <Hint title='钱包会弹出两次，第一次创建池子，第二次添加池子，为确保操作成功，请确保账户中预留至少0.4 SOL，以避免因余额不足导致添加流动性失败。' showClose />

        <div className='btn'>
          <div className='buttonSwapper mt-4'>
            <Button className={Button_Style} onClick={createClick} loading={isCreate}>创建</Button>
          </div>
          <div className='fee'>全网最低服务费: {vipConfig.isVip ? 0 : MeteOra_Fee} SOL</div>
        </div>

        <Result tokenAddress={poolAddr} signature={signature} error={error} />
      </CreatePool>

    </>
  )
}

export default CreateLiquidity