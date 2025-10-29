import { useState, useEffect, useRef } from 'react'
import { IoMdSwap } from "react-icons/io";
import { Radio, Input, Button, notification } from 'antd'
import type { RadioChangeEvent } from 'antd';
import { Keypair, PublicKey, VersionedTransaction } from '@solana/web3.js';
import bs58 from "bs58";
import { useNavigate } from 'react-router-dom';
import copy from 'copy-to-clipboard';
import BN from "bn.js";
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Header, SelectToken, Segmentd, JitoFee } from '@/components'
import type { Token_Type, SwapBotConfigType } from '@/type'
import { Input_Style, Button_Style, SWAP_BOT_FEE } from '@/config'
import { getTxLink, addressHandler, getImage } from '@/utils'
import { useIsVip, useAppDispatch, useAppSelector } from '@/hooks';
import {
  _tokenA,
  _tokenB,
  tokenAChange,
  tokenBChange,
  _swpConfig,
  swapConfigChange,
  _privateKeys,
  privateKeysChange,
} from '@/store/bot'
import { fetcher } from '@/utils'
import { delay, getRandomNumber, getWalletsInfo, getCurrentTimestamp, getAmountIn } from './utils';
import {
  WalletInfoCollection, PrivateKeyPage,
  CeateWalletButton
} from './components'
import { vipFee } from './fee'
import { SwapBotPage, LeftPage, RightPage, Card } from './style'


interface LogsType {
  time: string
  label: string
  color?: string
  isLink?: boolean
  account?: string
}

const HASH_COLOR = '#51d38e'


function SwapBot() {
  const { connection } = useConnection();
  const [api, contextHolder1] = notification.useNotification();
  const vipConfig = useIsVip()
  const navigate = useNavigate()

  const dispatch = useAppDispatch()
  const tokenA = useAppSelector(_tokenA)
  const tokenB = useAppSelector(_tokenB)
  const config = useAppSelector(_swpConfig)
  const privateKeys = useAppSelector(_privateKeys)

  const [walletConfig, setWalletConfig] = useState<SwapBotConfigType[]>([]) //钱包信息
  const [isLoadingUpdate, setIsLoadingUpdata] = useState(false)
  const [logsArr, setLogsArr] = useState<LogsType[]>([])

  const [info, setInfo] = useState({
    _totalSol: 0, //总sol
    _totalTokenA: 0,
    _totalTokenB: 0, //代币
    _seleNum: 0,
    _seleSol: 0,
    _seleTokenA: 0,
    _seleTokenB: 0,
  })

  const [isStart, setIsStart] = useState(false)
  const [isStop, setIsStop] = useState(false)
  const [tokenPrice, setTokenPrice] = useState('') //代币价格


  useEffect(() => {
    getTonePrice()
  }, [tokenB])
  useEffect(() => {
    getInfo()
  }, [walletConfig])
  useEffect(() => {
    getWalletHander()
  }, [tokenA, tokenB, privateKeys])


  const configChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(swapConfigChange({ ...config, [e.target.name]: e.target.value }))
  }
  const modeTypeChange = (e: RadioChangeEvent) => {
    dispatch(swapConfigChange({ ...config, modeType: Number(e.target.value) }))
  }
  const buyTypeChange = (e: RadioChangeEvent) => {
    dispatch(swapConfigChange({ ...config, buyType: Number(e.target.value) }))
  }
  const sellTypeChange = (e: RadioChangeEvent) => {
    dispatch(swapConfigChange({ ...config, sellType: Number(e.target.value) }))
  }
  const tokenAClick = (_token: Token_Type) => {
    dispatch(tokenAChange(_token))
  }
  const tokenBClick = (_token: Token_Type) => {
    dispatch(tokenBChange(_token))
  }
  // 日志
  const logsArrChange = (label: string, color?: string, isLink?: boolean, account?: string) => {
    const obj: LogsType = { time: getCurrentTimestamp(), label, color, isLink, account }
    setLogsArr(item => [...item, obj])
  }

  // 获取代币价格
  const getTonePrice = async () => {
    try {
      if (!tokenB.address) return
      const url = `https://lite-api.jup.ag/price/v3?ids=${tokenB.address}`
      const resut = await fetcher(url)
      const price = resut[tokenB.address].usdPrice
      setTokenPrice(price)
    } catch (error) {
      console.log(error, 'getTonePrice')
    }
  }
  //**钱包私钥数组 */
  const privateKeyCallBack = async (keys: string) => {
    const resultArr = keys.split(/[(\r\n)\r\n]+/)
    const _pris = resultArr.filter((item: string) => item !== '')
    dispatch(privateKeysChange(_pris))
  }
  const getWalletHander = async () => {
    try {
      if (isLoadingUpdate) return
      setIsLoadingUpdata(true)
      const _walletCon = await getWalletsInfo(connection, privateKeys, tokenA.address, tokenB.address)
      setWalletConfig(_walletCon)
      setIsLoadingUpdata(false)
    } catch (error) {
      setIsLoadingUpdata(false)
    }
  }
  //统计信息
  const getInfo = () => {
    let _totalSol = 0
    let _tatalTokenA = 0
    let _totalTokenB = 0

    let _seleNum = 0
    let _seleSol = 0
    let _seleTokenA = 0
    let _seleTokenB = 0
    walletConfig.forEach(item => {
      _totalSol += item.balance
      _tatalTokenA += item.tokenABalance
      _totalTokenB += item.tokenBBalace

      if (item.isCheck) {
        _seleNum += 1
        _seleSol += item.balance
        _seleTokenA += item.tokenABalance
        _seleTokenB += item.tokenBBalace
      }
    })
    setInfo({
      _totalSol: Number(_totalSol.toFixed(4)),
      _totalTokenA: Number(_tatalTokenA.toFixed(4)),
      _totalTokenB: Number(_totalTokenB.toFixed(4)),
      _seleNum,
      _seleSol: Number(_seleSol.toFixed(4)),
      _seleTokenA: Number(_seleTokenA.toFixed(4)),
      _seleTokenB: Number(_seleTokenB.toFixed(4))
    })
  }


  const workersRef = useRef<any[]>([]);
  const TaskRef = useRef<NodeJS.Timeout>(null);

  const startClick = async () => {
    try {

      if (walletConfig.length === 0) return logsArrChange('请导入钱包私钥', 'red')
      if (Number(config.modeType) !== 2) {
        if (!config.minBuy) return logsArrChange('请填写购买金额', 'red')
      }
      if (Number(config.modeType) !== 3 && !config.targetPrice) return logsArrChange('请填写目标价格', 'red')
      if (Number(config.modeType) === 1 && Number(config.targetPrice) <= Number(tokenPrice))
        return logsArrChange('拉盘目标价格需要大于当前价格', 'red')
      if (Number(config.modeType) === 2 && Number(config.targetPrice) >= Number(tokenPrice))
        return logsArrChange('砸盘目标价格需要小于当前价格', 'red')

      setIsStop(false)
      setIsStart(true)
      const _config = [...walletConfig]
      const _walletConfig = _config.filter(item => item.isCheck)
      console.log(_walletConfig)


      let waitingForConfirmation: boolean; //执行中
      let walletIndexes = 0
      let round = 0 //执行轮数

      const QueteToken = new PublicKey(tokenA.address)
      const BaseToken = new PublicKey(tokenB.address)

      TaskRef.current = setInterval(async () => {
        try {
          if (waitingForConfirmation) {
            console.log("还在交易中");
            return;
          }
          if (isStop) console.log('任务暂停')
          waitingForConfirmation = true;
          console.log(walletIndexes, '开始walletIndexes')
          try {
            await threadFun(_walletConfig, walletIndexes, QueteToken, BaseToken)
          } catch (error) {
          }

          waitingForConfirmation = false;
          if (walletIndexes == _walletConfig.length - 1) {
            walletIndexes = 0;
            round += 1;
            if (Number(config.modeType) === 2 &&
              (Number(config.sellType) == 3 || Number(config.sellType) == 4)
              && Number(config.minSell) === 100) {
              stopClick()
              waitingForConfirmation = true
              logsArrChange('砸盘任务完成', HASH_COLOR)
              return
            }
          } else {
            walletIndexes++
          }
        } catch (error) {
          console.error("获取交易失败:", error);
        }
      }, 500)
    } catch (error) {
      console.log(error)
      setIsStart(false)
    }
  }

  const threadFun = (
    _walletConfig: SwapBotConfigType[],
    index: number,
    QueteToken: PublicKey,
    BaseToken: PublicKey,
  ) => {
    return new Promise(async (resolve, reject) => {
      try {
        if (!_walletConfig[index]) return
        const account = Keypair.fromSecretKey(bs58.decode(_walletConfig[index].privateKey));

        let isBuy = true
        if (Number(config.modeType) === 1) {
          isBuy = true
        } else if (Number(config.modeType) === 2) {
          isBuy = false
        } else if (Number(config.modeType) === 3) {
          const randomNumber = getRandomNumber(0, 99)
          console.log(randomNumber, 'randomNumber')
          if (randomNumber > Number(config.buyChance)) isBuy = false
        }

        logsArrChange(`钱包-${index + 1}：--${isBuy ? '买入交易' : "卖出交易"}`)

        const { balance, amountIn } = await getAmountIn(true, connection, account, QueteToken, BaseToken,
          isBuy, Number(config.buyType), Number(config.minBuy), Number(config.maxBuy),
          Number(config.sellType), Number(config.minSell), Number(config.maxSell))

        if (balance === 0 || amountIn === 0) {
          logsArrChange(`${addressHandler(account.publicKey.toBase58())}余额不足，跳过该钱包`, '#f9d236')
          resolve(true)
          return
        }

        let _amount = ''
        if (isBuy) {
          logsArrChange(`花费${amountIn} ${tokenA.symbol}购买`)
          _amount = (new BN(amountIn * 10 ** (tokenA.decimals))).toString()
        } else {
          logsArrChange(`出售${amountIn} ${tokenB.symbol}`)
          _amount = (new BN(amountIn * 10 ** (tokenB.decimals))).toString()
        }

        // 1、获取报价
        let _tokenA = tokenA.address
        let _tokenB = tokenB.address
        if (!isBuy) {
          _tokenA = tokenB.address
          _tokenB = tokenA.address
        }

        const _slippage = Number(config.slippage) * 100// 0.5%
        const url = `https://lite-api.jup.ag/swap/v1/quote?inputMint=${_tokenA}&outputMint=${_tokenB}&amount=${_amount}&slippageBps=${_slippage}&restrictIntermediateTokens=true`
        const quoteResponse = await (await fetch(url)).json();
        // 2、建立交易
        const swapResponse = await (
          await fetch('https://lite-api.jup.ag/swap/v1/swap', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              quoteResponse,
              userPublicKey: account.publicKey,

              // ADDITIONAL PARAMETERS TO OPTIMIZE FOR TRANSACTION LANDING
              // See next guide to optimize for transaction landing
              dynamicComputeUnitLimit: true,
              dynamicSlippage: true,
              prioritizationFeeLamports: {
                priorityLevelWithMaxLamports: {
                  maxLamports: 1000000,
                  priorityLevel: "veryHigh"
                }
              }
            })
          })
        ).json();
        // 3、发送交易
        const transactionBase64 = swapResponse.swapTransaction
        const transaction = VersionedTransaction.deserialize(Buffer.from(transactionBase64, 'base64'));
        transaction.sign([account]);
        const transactionBinary = transaction.serialize();
        const signature = await connection.sendRawTransaction(transactionBinary, {
          maxRetries: 2,
          skipPreflight: true
        });
        // const confirmation = await connection.confirmTransaction(signature, "finalized");
        // console.log(confirmation, 'confirmation')
        console.log(`Transaction successful: https://solscan.io/tx/${signature}/`);
        logsArrChange(signature, HASH_COLOR, true, addressHandler(account.publicKey.toBase58()))
        if (!vipConfig.isVip) {
          try {
            const _signature = await vipFee(connection, account)
            console.log(`Transaction successful: https://solscan.io/tx/${_signature}/`);
          } catch (error) {
            console.log(error, 'viphhhhh')
          }
        }
        if (isStop) console.log('任务暂停')

        // const urlprice = `https://api.jup.ag/price/v2?ids=${tokenB.address}`
        // const resut = await fetcher(urlprice)
        // const _tokenPrice = resut.data[tokenB.address].price
        const urlprice = `https://lite-api.jup.ag/price/v3?ids=${tokenB.address}`
        const resut = await fetcher(urlprice)
        const _tokenPrice = resut[tokenB.address].usdPrice

        setTokenPrice(_tokenPrice)

        logsArrChange(`当前代币价格: ${_tokenPrice}`, '#c931f7')
        if (Number(config.modeType) === 1 && Number(config.targetPrice) <= Number(_tokenPrice) && _tokenPrice) {
          logsArrChange(`拉盘任务完成`)
          stopClick()
        }
        if (Number(config.modeType) === 2 && Number(config.targetPrice) >= Number(_tokenPrice) && _tokenPrice) {
          logsArrChange(`砸盘任务完成`)
          stopClick()
        }

        const _time = getRandomNumber(Number(config.minTime), Number(config.maxTime))
        logsArrChange(`暂停${_time}秒`)
        await delay(Number(_time) * 1000);
        resolve(true)
      } catch (error) {
        console.log(error, 'error')
        logsArrChange(`${error.toString()}`, 'red')
        if (error.toString() === 'Error: target pool is not AMM pool and Cpmm Pool') {
          stopClick()
        }
        reject(false)
      }
    })
  }

  const closeTask = () => {
    setIsStart(false)
    logsArrChange(`停止任务`, '#ffca28')
    if (TaskRef) clearInterval(TaskRef.current)
    if (workersRef.current) workersRef.current.forEach((worker, index) => {
      worker.postMessage({ eventName: 'CLOSE' })
      worker.terminate()
    })
    workersRef.current = []
    console.log(workersRef.current)
  }
  const stopClick = () => {
    setIsStop(false)
    setIsStart(false)
    closeTask()
  }

  useEffect(() => {
    scrollBottom()
  }, [logsArr])
  const scrollBottom = () => {
    const div = document.getElementById('scrolldIV')
    if (div) div.scrollTop = div.scrollHeight
  }

  const createWalletCallBack = (keyArr: string[]) => {
    const newPrivateKey = privateKeys.concat(keyArr)
    dispatch(privateKeysChange(newPrivateKey))
  }
  //复制刷单钱包
  const copyAllWalletAddrs = () => {
    const addressArr = []
    walletConfig.forEach(item => {
      addressArr.push(item.walletAddr)
    })
    const _value = addressArr.join('\n')
    copy(_value)
    api.success({ message: "已复制所有钱包地址到粘贴板" })
  }
  //复制私钥
  const copyAllWalletPrivatekey = () => {
    const _value = privateKeys.join('\n')
    copy(_value)
    api.success({ message: "已复制所有钱包私钥到粘贴板" })
  }


  return (
    <SwapBotPage>
      {contextHolder1}
      <Header title='市值管理' hint='预设并自动执行交易指令，轻松实现批量在DEX交易，提高了交易的效率和时效性，特别适用于快速执行大量交易的场景' />

      <div className='swap'>
        <LeftPage>

          {/* 交易对 swap设置 */}
          <div className='box'>
            <div className='header'>
              <div className='font-bold text-xl'>交易对设置</div>
            </div>
            <div className='flex justify-between mt-3 bb1 items-center'>
              <div className='flex-1 bw100'>
                <div>价值代币</div>
                <SelectToken selecToken={tokenA} callBack={tokenAClick} isBot />
              </div>
              <div className='ml-2 mr-2 mt-6'>
                <IoMdSwap size='20' />
              </div>
              <div className='flex-1 bw100'>
                <div>目标代币</div>
                <SelectToken selecToken={tokenB} callBack={tokenBClick} isBot />
              </div>
            </div>

            <div className='mt-4 flex items-center'>
              <div className='header mr-2'>
                <div>选择交易所</div>
              </div>
              <Radio.Group  >
                <Radio.Button value={1}>
                  <span className=''>自动</span>
                </Radio.Button>
              </Radio.Group>
            </div>

            {/* <div className='mt-4'>
              <div>自定义RPC</div>
              <Input />
            </div> */}

            <div className='mt-4'>
              <div className='mt-4 font-bold' style={{ color: '#974ed5' }}>
                当前代币价格：{tokenPrice}
              </div>
            </div>
          </div>

          <div className='box mt-3 mb-3'>
            <div className='font-bold text-xl'>交易设置</div>
            {/* 交易模式 */}
            <div className='flex items-center mt-3'>
              <div className='font-semibold'>模式：</div>
              <Radio.Group onChange={modeTypeChange} value={config.modeType}>
                <Radio.Button value={1}>拉盘</Radio.Button>
                <Radio.Button value={2}>砸盘</Radio.Button>
                <Radio.Button value={3}>刷交易量</Radio.Button>
              </Radio.Group>
            </div>
            {config.modeType === 3 &&
              <div className='mt-3 flex items-center'>
                <div className='mr-1 font-semibold'>买入概率：</div>
                <div>
                  <Input value={config.buyChance} onChange={configChange} name='buyChance'
                    suffix='%' />
                </div>
              </div>
            }
            {/* 买入设置 */}
            {config.modeType !== 2 &&
              <>
                <div className='mt-3'>
                  <div className='font-semibold'>买入设置：</div>
                  <Radio.Group onChange={buyTypeChange} value={config.buyType}>
                    <Radio.Button value={1}>固定金额</Radio.Button>
                    <Radio.Button value={2}>随机金额</Radio.Button>
                    <Radio.Button value={3}>固定百分比</Radio.Button>
                    <Radio.Button value={4}>随机百分比</Radio.Button>
                  </Radio.Group>
                </div>
                <div className='flex items-center mt-2'>
                  <div className='w-48'>
                    <Input value={config.minBuy} onChange={configChange} name='minBuy'
                      prefix={<img src={tokenA.image} style={{ width: '22px', height: '22px' }} />}
                      suffix={(config.buyType === 3 || config.buyType === 4) ? '%' : tokenA.symbol} size='large' />
                  </div>
                  {(config.buyType === 2 || config.buyType === 4) &&
                    <>
                      <div className='mx-2 font-bold'>~</div>
                      <div className='w-48'>
                        <Input value={config.maxBuy} onChange={configChange} name='maxBuy'
                          prefix={<img src={tokenA.image} style={{ width: '22px', height: '22px' }} />}
                          suffix={config.buyType === 4 ? '%' : tokenA.symbol} size='large' />
                      </div>
                    </>
                  }
                </div>
              </>
            }
            {/* 卖出设置 */}
            {config.modeType !== 1 &&
              <>
                <div className='mt-3'>
                  <div className='font-semibold'>卖出设置：</div>
                  <Radio.Group onChange={sellTypeChange} value={config.sellType}>
                    <Radio.Button value={1}>固定数量</Radio.Button>
                    <Radio.Button value={2}>随机数量</Radio.Button>
                    <Radio.Button value={3}>固定百分比</Radio.Button>
                    <Radio.Button value={4}>随机百分比</Radio.Button>
                  </Radio.Group>
                </div>
                <div className='flex items-center mt-2'>
                  <div className='w-48'>
                    <Input value={config.minSell} onChange={configChange} name='minSell'
                      prefix={<img src={tokenB.image} style={{ width: '22px', height: '22px' }} />}
                      suffix={(config.sellType === 3 || config.sellType === 4) ? '%' : tokenB.symbol} size='large' />
                  </div>
                  {(config.sellType === 2 || config.sellType === 4) &&
                    <>
                      <div className='mx-2 font-bold'>~</div>
                      <div className='w-48'>
                        <Input value={config.maxSell} onChange={configChange} name='maxSell'
                          prefix={<img src={tokenB.image} style={{ width: '22px', height: '22px' }} />}
                          suffix={config.sellType === 4 ? '%' : tokenB.symbol} size='large' />
                      </div>
                    </>
                  }
                </div>
              </>
            }

            {/* 目标价格 */}
            {Number(config.modeType) !== 3 &&
              <div className='flex items-center mt-3'>
                <div className='font-semibold'>目标价格：</div>
                <div>
                  <Input value={config.targetPrice} onChange={configChange} name='targetPrice' suffix='$' />
                </div>
              </div>
            }

            <div className='flex items-center mt-3'>
              <div className='font-semibold'>任务执行间隔(秒)：</div>
              <div className='flex items-center'>
                <div className='w-46'>
                  <Input type='number'
                    value={config.minTime} onChange={configChange} name='minTime' />
                </div>
                <div className='mx-2 font-bold'>~</div>
                <div className='w-46'>
                  <Input type='number'
                    value={config.maxTime} onChange={configChange} name='maxTime' />
                </div>
              </div>
            </div>

            <div className='flex items-center mt-4'>
              <div className='font-semibold'>滑点(%)：</div>
              <div>
                <Input value={config.slippage} onChange={configChange} name='slippage' />
              </div>
            </div>
          </div>

          <div className='box mb-3'>
            <div className='header'>账号概览</div>
            <div className='flex justify-between mt-4 bb1'>
              <div className='box1 mr-4 bw100'>
                <div className='box1_header mb-3'>所有账户数量 {walletConfig.length}</div>
                <div>
                  <div className='mb-1'>SOL 余额：{info._totalSol}</div>
                  <div className='mb-1'>{tokenA.symbol} 余额：{info._totalTokenA}</div>
                  <div className='mb-1'>{tokenB.symbol} 余额：{info._totalTokenB}</div>
                </div>
              </div>
              <div className='box1 bw100'>
                <div className='box1_header mb-3'>启用账户数量 {info._seleNum}</div>
                <div>
                  <div className='mb-1'>SOL 余额：{info._seleSol}</div>
                  <div className='mb-1'>{tokenA.symbol} 余额：{info._seleTokenA}</div>
                  <div className='mb-1'>{tokenB.symbol} 余额：{info._seleTokenB}</div>
                </div>
              </div>
            </div>
          </div>

          <WalletInfoCollection config={walletConfig}
            setConfig={setWalletConfig}
            tokenASymbol={tokenA ? tokenA.symbol : ''}
            tokenBSymbol={tokenB ? tokenB.symbol : ''}
            isLoading={isLoadingUpdate}
            updata={getWalletHander} />
        </LeftPage>
        <RightPage>
          <div className='box'>
            <div className='flex box_btnSwapper'>
              <PrivateKeyPage privateKeys={privateKeys} callBack={privateKeyCallBack} title='导入钱包' />
              {/* <CeateWalletButton callBack={createWalletCallBack} /> */}
              <Button onClick={copyAllWalletPrivatekey}>导出刷单私钥</Button>
              <Button onClick={copyAllWalletAddrs}>导出刷单地址</Button>
              <Button onClick={() => navigate('/tool/multisend')}>SOL 批量转账</Button>
              <Button onClick={() => navigate('/tool/multisend')}>{tokenB.symbol} 批量转账</Button>
              <Button onClick={() => navigate('/tool/collector')}>SOL 批量归集</Button>
              <Button onClick={() => navigate('/tool/collector')}>{tokenB.symbol} 批量归集</Button>
            </div>
          </div>


          <div className='btn mt-3'>
            <div className='buttonSwapper mt-4 startbtn'>
              <div className='w-100'>
                <Button className={`${Button_Style} w-100`} onClick={startClick} loading={isStart}>开始执行</Button>
              </div>
              <div className='mt-3 mb-5'>
                <Button className={`${Button_Style} stop`} onClick={stopClick}>停止</Button>
              </div>
            </div>
            <div className='fee'>全网最低服务费: {SWAP_BOT_FEE} SOL</div>
          </div>

          <div className='logs'>
            <div className='header'>
              <div>交易日志</div>
              <Button type='primary' onClick={() => setLogsArr([])}>清空日志</Button>
            </div>
            <div className='scrolldIV' id='scrolldIV'>
              {logsArr.map((item, index) => (
                item.isLink ?
                  <div key={index} className='logoitem'>{item.time}: 交易hash--
                    <a href={getTxLink(item.label)} target='_blank' style={{ color: '#51d38e' }}>
                      {item.account}： {item.label}
                    </a>
                  </div>
                  :
                  <div key={index} style={{ color: item.color }} className='logoitem'>{item.time}: {item.account}{item.label}</div>
              ))}
            </div>
          </div>
        </RightPage>
      </div>
    </SwapBotPage>
  )
}

export default SwapBot