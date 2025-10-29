import { useEffect, useState } from 'react'
import { Input, Button, notification } from 'antd'
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from '@solana/web3.js'
import { ethers } from 'ethers';
import BN from 'bn.js'
import DLMM, {
  deriveCustomizablePermissionlessLbPair, LBCLMM_PROGRAM_IDS
} from "@meteora-ag/dlmm"
import { Input_Style, Button_Style } from '@/config'
import { SOL, PUMP } from '@/config/Token'
import type { Token_Type } from '@/type'
import { SelectToken, Result } from '@/components'
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


function RemovePool() {
  const [api, contextHolder1] = notification.useNotification();
  const { connection } = useConnection();
  const wallet = useWallet()
  const [baseToken, setBaseToken] = useState<Token_Type>(PUMP)
  const [token, setToken] = useState<Token_Type>(SOL)
  const [isCreate, setIsCreate] = useState(false)
  const [signature, setSignature] = useState("");
  const [error, setError] = useState('');
  const [poolAddr, setPoolAddr] = useState('')

  const [removePre, setRemovePre] = useState('100')

  const [config, setConfig] = useState({
    tokenAmount: "",
    baseTokenAmount: ""
  })

  useEffect(() => {
    getPoolInfo()
  }, [token, baseToken])

  const baseChange = (_token: Token_Type) => {
    setBaseToken(_token)
  }
  const backClick = (_token: Token_Type) => {
    setToken(_token)
  }

  const getPoolInfo = async () => {
    try {
      if (!token) return api.error({ message: "请选择代币" })

      const baseMint = new PublicKey(baseToken.address)
      const quoteMint = new PublicKey(token.address)

      const cluster = "mainnet-beta"
      const dlmmProgramId = new PublicKey(LBCLMM_PROGRAM_IDS[cluster])

      let poolKey: PublicKey
        ;[poolKey] = deriveCustomizablePermissionlessLbPair(
          baseMint,
          quoteMint,
          dlmmProgramId
        )

      console.log(`\n> Pool address: ${poolKey}`)
      const poolAddress = new PublicKey(poolKey.toString());
      // @ts-expect-error: Connection version difference
      const dlmmPool = await DLMM.create(connection, poolAddress);

      console.log(dlmmPool, 'dlmmPool')

      const tokenX_Amount = dlmmPool.tokenX.amount
      const tokenY_Amount = dlmmPool.tokenY.amount

      const tokenX_Address = dlmmPool.tokenX.mint.address.toBase58()
      const tokenY_Address = dlmmPool.tokenY.mint.address.toBase58()

      let baseTokenAmount = tokenX_Amount
      let decimals = baseToken.decimals

      let tokenAmount = tokenY_Amount
      let decimals1 = token.decimals

      if (tokenY_Address === baseToken.address) {
        baseTokenAmount = tokenY_Amount
        tokenAmount = tokenX_Amount

        decimals = token.decimals
        decimals1 = baseToken.decimals
      }

      const base = ethers.utils.formatUnits(baseTokenAmount, decimals)
      const tamount = ethers.utils.formatUnits(tokenAmount, decimals1)

      setConfig({
        baseTokenAmount: base,
        tokenAmount: tamount
      })
      console.log({
        baseTokenAmount: base,
        tokenAmount: tamount
      })

    } catch (error) {

    }
  }


  const removePoolClick = async () => {
    try {
      setIsCreate(true)
      setSignature('')
      const baseMint = new PublicKey(baseToken.address)
      const quoteMint = new PublicKey(token.address)
      const cluster = "mainnet-beta"
      const dlmmProgramId = new PublicKey(LBCLMM_PROGRAM_IDS[cluster])
      let poolKey: PublicKey
        ;[poolKey] = deriveCustomizablePermissionlessLbPair(
          baseMint,
          quoteMint,
          dlmmProgramId
        )
      console.log(`\n> Pool address: ${poolKey}`)
      const poolAddress = new PublicKey(poolKey.toString());
      // @ts-expect-error: Connection version difference
      const dlmmPool = await DLMM.create(connection, poolAddress);
      console.log(dlmmPool, 'dlmmPool')
      const tokenX_Amount = dlmmPool.tokenX.amount.toString()
      const tokenX_Addr = dlmmPool.tokenX.publicKey.toString()
      const tokenY_Amount = dlmmPool.tokenY.amount.toString()
      const tokenY_Addr = dlmmPool.tokenY.publicKey.toString()

      const userPositions = await dlmmPool.getPositionsByUserAndLbPair(wallet.publicKey);


      let positionAddress: PublicKey
      let fromBinId = 0
      let toBinId = 0

      userPositions.userPositions.forEach((item) => {
        console.log(item, 'item')
        if (item.positionData.totalXAmount == tokenX_Amount &&
          item.positionData.totalYAmount == tokenY_Amount
        ) {
          positionAddress = item.publicKey;
          fromBinId = item.positionData.lowerBinId
          toBinId = item.positionData.upperBinId
        }
      });
      console.log(positionAddress.toString(), 'positionAddress')

      const removeLiquidityTx = await dlmmPool.removeLiquidity({
        position: positionAddress,
        user: wallet.publicKey,
        fromBinId: fromBinId,
        toBinId: toBinId,
        bps: new BN(Number(removePre) * 100), // 100% (range from 0 to 10000)
        shouldClaimAndClose: true, // should claim swap fee and close position together
      });

      const _signature1 = await wallet.sendTransaction(removeLiquidityTx as any,
        connection, { signers: [] })
      const confirmed1 = await connection.confirmTransaction(_signature1, "processed");
      console.log(confirmed1, 'confirmed')

      setIsCreate(false);
      setSignature(_signature1)
      setPoolAddr(poolKey.toString())
      api.success({ message: '移除流动性成功' })
      getPoolInfo()
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
          <div>持仓流动性</div>
          <div>当前余额</div>
          <div>
            <div className='flex mb-3 mt-3'>
              <img src={baseToken.image} width={26} height={26} />
              <div className='ml-2'>{config.baseTokenAmount}</div>
              <div>{baseToken.symbol}</div>
            </div>
            <div className='flex'>
              <img src={token.image} width={26} height={26} />
              <div className='ml-2'>{config.tokenAmount}</div>
              <div>{token.symbol}</div>
            </div>

          </div>
        </div>


        <div className='token mt-5'>
          <div className='tokenItem mr-5'>
            <div className='mb-1 start'>移除百分比（%）</div>
            <Input className={Input_Style} type='number'
              value={removePre} onChange={(e) => setRemovePre(e.target.value)} />
          </div>
        </div>


        <div className='btn'>
          <div className='buttonSwapper mt-4'>
            <Button className={Button_Style} onClick={removePoolClick} loading={isCreate}>移除流动性</Button>
          </div>
          <div className='fee'>全网最低服务费: 0 SOL</div>
        </div>

        <Result tokenAddress={''} signature={signature} error={error} />
      </CreatePool>

    </>
  )
}

export default RemovePool