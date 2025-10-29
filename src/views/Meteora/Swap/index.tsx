import { useEffect, useState } from 'react'
import { Input, Button, notification, Segmented } from 'antd'
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'
import BN from 'bn.js'
import DLMM, {
  deriveCustomizablePermissionlessLbPair, LBCLMM_PROGRAM_IDS
} from "@meteora-ag/dlmm"
import { Input_Style, Button_Style, BANANATOOLS_ADDRESS, SWAP_BOT_FEE } from '@/config'
import { SOL, PUMP } from '@/config/Token'
import { Page } from '@/styles'
import type { Token_Type } from '@/type'
import { Header, SelectToken, Result } from '@/components'
import { CreatePool } from '../style'
import Test from '../Test1'

const SGECONFIG = [
  { label: '买入', value: 1 },
  { label: '卖出', value: 2 },
]


function RemovePool() {
  const [api, contextHolder1] = notification.useNotification();
  const { connection } = useConnection();
  const wallet = useWallet()
  const [baseToken, setBaseToken] = useState<Token_Type>(PUMP)
  const [token, setToken] = useState<Token_Type>(SOL)
  const [isCreate, setIsCreate] = useState(false)
  const [signature, setSignature] = useState("");
  const [error, setError] = useState('');

  const [amount, setAmount] = useState('')
  const [isBuy, setIsBuy] = useState(1)
  const [price, setPrice] = useState('')

  useEffect(() => {
    getTokenPrice()
  }, [token.address, baseToken.address])

  const isBuyChange = (e) => {
    setIsBuy(e)
  }

  const baseChange = (_token: Token_Type) => {
    setBaseToken(_token)
  }
  const backClick = (_token: Token_Type) => {
    setToken(_token)
  }

  const getTokenPrice = async () => {
    try {
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

      // Get active bin information
      const activeBin = await dlmmPool.getActiveBin();

      console.log(activeBin, 'activeBin')

      setPrice(activeBin.price)
    } catch (error) {

    }
  }


  const buyTokenlClick = async () => {
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

      const swapAmount = new BN(Number(amount) * 10 ** token.decimals);
      // Swap quote
      const swapYtoX = false;
      const binArrays = await dlmmPool.getBinArrayForSwap(swapYtoX);

      const swapQuote = await dlmmPool.swapQuote(
        swapAmount,
        swapYtoX,
        new BN(100),
        binArrays
      );

      // Swap
      const swapTx = await dlmmPool.swap({
        inToken: dlmmPool.tokenY.publicKey,
        binArraysPubkey: swapQuote.binArraysPubkey,
        inAmount: swapAmount,
        lbPair: dlmmPool.pubkey,
        user: wallet.publicKey,
        minOutAmount: swapQuote.minOutAmount,
        outToken: dlmmPool.tokenX.publicKey,
      });

      const fee = SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: new PublicKey(BANANATOOLS_ADDRESS),
        lamports: SWAP_BOT_FEE * LAMPORTS_PER_SOL,
      })

      swapTx.add(fee)

      const _signature1 = await wallet.sendTransaction(swapTx as any,
        connection, { signers: [] })
      const confirmed1 = await connection.confirmTransaction(_signature1, "processed");
      console.log(confirmed1, 'confirmed')

      setIsCreate(false);
      setSignature(_signature1)
      api.success({ message: '交易成功' })
      getTokenPrice()
    } catch (error) {
      console.log(error)
      api.error({ message: error.toString() })
      setIsCreate(false);
    }
  }

  const sellTokenlClick = async () => {
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

      const swapAmount = new BN(Number(amount) * 10 ** baseToken.decimals);
      // Swap quote
      const swapYtoX = true;
      const binArrays = await dlmmPool.getBinArrayForSwap(swapYtoX);

      const swapQuote = await dlmmPool.swapQuote(
        swapAmount,
        swapYtoX,
        new BN(10000),
        binArrays
      );

      // Swap
      const swapTx = await dlmmPool.swap({
        inToken: dlmmPool.tokenX.publicKey,
        binArraysPubkey: swapQuote.binArraysPubkey,
        inAmount: swapAmount,
        lbPair: dlmmPool.pubkey,
        user: wallet.publicKey,
        minOutAmount: swapQuote.minOutAmount,
        outToken: dlmmPool.tokenY.publicKey,
      });

      const fee = SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: new PublicKey(BANANATOOLS_ADDRESS),
        lamports: SWAP_BOT_FEE * LAMPORTS_PER_SOL,
      })

      swapTx.add(fee)

      const _signature1 = await wallet.sendTransaction(swapTx as any,
        connection, { signers: [] })
      const confirmed1 = await connection.confirmTransaction(_signature1, "processed");
      console.log(confirmed1, 'confirmed')

      setIsCreate(false);
      setSignature(_signature1)
      api.success({ message: '交易成功' })
      getTokenPrice()
    } catch (error) {
      console.log(error)
      api.error({ message: error.toString() })
      setIsCreate(false);
    }
  }

  return (
    <Page>
      {contextHolder1}
      <Header title='Meteora交易' hint='您的代币将可在 Meteora上进行交易。' />
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

        <div className='mt-4'>当前价格：{price}</div>

        <div className='mb-5 mt-5'>
          <Segmented options={SGECONFIG} size='large' value={isBuy} onChange={isBuyChange} />
        </div>

        <div className='token mt-5'>
          <div className='tokenItem mr-5'>
            <div className='mb-1 start'>数量{isBuy === 1 ? token.symbol : baseToken.symbol}</div>
            <Input className={Input_Style} type='number'
              value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
        </div>


        <div className='btn'>
          {isBuy === 1 ?
            <div className='buttonSwapper mt-4'>
              <Button className={Button_Style} onClick={buyTokenlClick} loading={isCreate}>买入</Button>
            </div> :
            <div className='buttonSwapper mt-4'>
              <Button className={Button_Style} onClick={sellTokenlClick} loading={isCreate}>卖出</Button>
            </div>
          }

          <div className='fee'>全网最低服务费: 0 SOL</div>
        </div>

        <Result tokenAddress={''} signature={signature} error={error} />
      </CreatePool>

    </Page>
  )
}

export default RemovePool