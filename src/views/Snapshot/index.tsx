import { useState, useEffect } from 'react'
import { Button, message, Input, Segmented, Radio } from 'antd'
import { PublicKey, Transaction, LAMPORTS_PER_SOL, SystemProgram } from "@solana/web3.js";
import axios from 'axios'
import * as XLSX from 'xlsx';
import {
  Input_Style, Button_Style,
} from '@/config'
import { getAsset } from '@/utils/sol'
import { useSelector, useDispatch } from 'react-redux'
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { rpcUrl, isMainnet } from '@/store/bot'
import { Page } from '@/styles';
import { GatherPage } from './style'
import { t } from "i18next";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";

const Options = [
  { label: 'Top100', value: 100 },
  { label: 'Top500', value: 500 },
  { label: 'Top1000', value: 1000 },
  { label: 'Top2000', value: 2000 },
  { label: 'Top5000', value: 5000 },
  { label: 'Top10000', value: 10000 },
]

async function fetchMintInfo(param: string, url: string) {
    const requestBody = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "getAsset",
        "params": {
            "id": param
        }
    };

    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
    });
    const data = await response.json();
    console.log(data, 'data')
    let img: any
    await fetch(data.result?.content?.json_uri).then(async res => {
        img = (await res.json()).image
    }
    )

    if (data?.result) {
        const name = data.result?.content?.metadata?.name;
        const symbol = data.result?.content?.metadata?.symbol;

        return { symbol, image: img, name };
    } else {
        throw new Error("Invalid response structure");
    }
}

function Snapshot() {
  const _rpcUrl = useSelector(rpcUrl)
  const [messageApi, contextHolder] = message.useMessage();
  const { connection } = useConnection();
  const [value, setValue] = useState('')

  const [config, setConfig] = useState({
    name: '',
    symbol: '',
    ho: '',
    img: ''
  })
  const [amount, setAmount] = useState('100')
  const [inputAmount, setInputAmount] = useState('')
  const [inputValue, setinputValue] = useState('')
  const [isStart, setIsStart] = useState(false)
  const [isSta, setIsSta] = useState(false)
  const [programId, setProgramId] = useState<string>('')

  useEffect(() => {
    if (amount) {
      setinputValue(amount)
    }
  }, [amount])

  // 获取目标代币信息
  const getTargetTokenInfo = async () => {
    try {
      setIsSta(true)
      const tokenAccountInfo = await connection.getParsedAccountInfo(new PublicKey(value));
      const mintData = tokenAccountInfo.value?.data
      // if (mintData instanceof Buffer) return
      if (!tokenAccountInfo.value || mintData instanceof Buffer) {
        message.error(t('no found token info'))
        setIsSta(false)
        return
      }

      const programId1 = tokenAccountInfo.value.owner.toString();
      setProgramId(programId1)
      let name: string = ""
      let symbol: string = ""
      let img
      let _data1
      try {
        const data = await fetchMintInfo(value, _rpcUrl);
        name = data.name;
        symbol = data.symbol;
        img = data.image ? data.image : '/images/logo.png';
      } catch (error) {
        console.log(error, 'error')
      }
      if (programId1 == "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA") {
        // SPL-TOKEN
        console.log("SPL-Token");
        _data1 = JSON.stringify({
          "jsonrpc": "2.0",
          "id": 1,
          "method": "getProgramAccounts",
          "params": [
            new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
            {
              encoding: 'jsonParsed',
              commitment: 'confirmed',
              filters: [
                {
                  dataSize: 165, // number of bytes
                },
                {
                  memcmp: {
                    offset: 0, // number of bytes
                    bytes: value, // base58 encoded string
                  },
                },
              ],
            }
          ]
        });
      } else if (programId1 == "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb") {
        // SPL-TOKEN-2022
        console.log("SPL-Token-2022");
        _data1 = JSON.stringify({
          "jsonrpc": "2.0",
          "id": 1,
          "method": "getProgramAccounts",
          "params": [
            new PublicKey('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'),
            {
              encoding: "jsonParsed",
              commitment: "confirmed",
              dataSlic: {
                length: '1000000'
              },
              filters: [
                {
                  memcmp: {
                    offset: 0,
                    bytes: value,
                  },
                },
              ],
            }
          ]
        });
      }

      const config1 = {
        method: 'post',
        maxBodyLength: Infinity,
        url: _rpcUrl,
        headers: {
          'Content-Type': 'application/json'
        },
        data: _data1
      };
      const response1 = await axios.request(config1)
      const data11: any[] = []
      response1.data.result.forEach((element: any) => {
        const owner = element.account.data.parsed.info.owner
        const amount = element.account.data.parsed.info.tokenAmount.amount
        const uiAmount = element.account.data.parsed.info.tokenAmount.uiAmount

        data11.push({
          owner,
          amount,
          uiAmount,
        })
      });
      const totalItemCount = data11.length
      console.log(name, symbol, totalItemCount.toString(), img, 'mintInfo')

      setConfig({
        name,
        symbol,
        ho: totalItemCount.toString(),
        img: img
      })
      setIsSta(false)
    } catch (error) {
      console.log(error, 'error')
      setIsSta(false)
      message.error('查询失败')
    }

  };

  const click = async () => {
    try {
      setIsStart(true)
      let _data1
      if (programId == "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA") {
        _data1 = JSON.stringify({
          "jsonrpc": "2.0",
          "id": 1,
          "method": "getProgramAccounts",
          "params": [
            new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
            {
              encoding: 'jsonParsed',
              commitment: 'confirmed',
              filters: [
                {
                  dataSize: 165, // number of bytes
                },

                {
                  memcmp: {
                    offset: 0, // number of bytes
                    bytes: value, // base58 encoded string
                  },
                },
              ],
            }
          ]
        });
      } else if (programId == "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb") {
        // spl token2022
        _data1 = JSON.stringify({
          "jsonrpc": "2.0",
          "id": 1,
          "method": "getProgramAccounts",
          "params": [
            new PublicKey('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'),
            {
              encoding: "jsonParsed",
              commitment: "confirmed",
              dataSlic: {
                length: '1000000'
              },
              filters: [
                {
                  memcmp: {
                    offset: 0,
                    bytes: value,
                  },
                },
              ],
            }
          ]
        });
      }

      const config1 = {
        method: 'post',
        maxBodyLength: Infinity,
        url: _rpcUrl,
        headers: {
          'Content-Type': 'application/json'
        },
        data: _data1
      };
      const response1 = await axios.request(config1)

      const data: any[] = []
      response1.data.result.forEach((element: any) => {
        const owner = element.account.data.parsed.info.owner
        const amount = element.account.data.parsed.info.tokenAmount.amount
        const uiAmount = element.account.data.parsed.info.tokenAmount.uiAmount

        data.push({
          owner,
          amount,
          uiAmount,
        })
      });

      let judgments: any[] = []
      let isMore = true
      if (data.length < 10000000) {
        isMore = false
        const toSlice: any[] = [];
        for (let i = 0; i < data.length; i += 100) {
          const accs = data.slice(i, i + 100)
          const arr: any[] = []
          accs.forEach(item => {
            arr.push(new PublicKey(item.owner));
          })
          toSlice.push(arr)
        }
        for (const acccount of toSlice) {
          const judgment = await connection.getMultipleAccountsInfo(acccount, "processed")
          const _arr: any[] = []
          judgment.forEach(item => {
            _arr.push(item?.lamports)
          })
          judgments = [...judgments, ..._arr];
        }
      }

      const newData: any[] = []
      data.forEach((item, index) => {
        const obj = { ...item, sol: isMore ? '0' : judgments[index] / 1000000000 }
        newData.push(obj)
      })
      const _data11 = newData.sort((a, b) => {
        return b.amount - a.amount
      })
      let _da = _data11.slice(0, Number(inputValue))
      if (inputAmount) {
        _da = _da.filter(item => item.uiAmount >= Number(inputAmount))
      }
      // 创一个新的工作簿
      const workbook = XLSX.utils.book_new();
      // 将数据转换为工作表
      const worksheetData = [
        ['地址', '数量', 'SOL余额'], // 标题
        ..._da.map(wallet => [wallet.owner, wallet.uiAmount, wallet.sol])
      ];
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      // 将工作表添加到工作簿中
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Wallets');
      // 导出 Excel 文件
      XLSX.writeFile(workbook, 'wallets.xlsx');
      setIsStart(false)
      message.success(t("Download Successfully"))
    } catch (error) {
      console.log(error, 'error')
      setIsStart(false)
      message.success(t("Download Failed"))
    }
  }

  const onChange = (e) => {
    setAmount(e.target.value)
  }

  return (
    <Page>
      {contextHolder}
      <GatherPage>
        <div className='title'>代币快照</div>
        <div className='mb-2 t1'>代币持有者快速筛选快照，数据参考，更好的进行代币的市值管理，或进行海量空投营销</div>

        <div className='flex'>
          <Input
            type="text"
            className={Input_Style}
            placeholder="请输入您想要的代币合约地址"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <div className='ibtn'>
            <Button onClick={getTargetTokenInfo}
              loading={isSta}
            >搜索</Button>
          </div>
        </div>

        {config.name &&
          <>
            <div className='token'>
              <div className='box'>
                <div className='mr-3'>代币名称</div>
                <div className='flex items-center'>
                  <img src={config.img} />
                  <div>{config.name}</div>
                </div>
              </div>
              <div className='box ml-3'>
                <div className='mr-3'>代币符号</div>
                <div>
                  <div>{config.symbol}</div>
                </div>
              </div>
              <div className='box ml-3'>
                <div className='mr-3'>历史持币人数</div>
                <div>
                  <div>{config.ho}</div>
                </div>
              </div>
            </div>

            <div className='mb-1'>{t('快照数据筛选')}</div>
            <div>
              <div className='flex'>
                {/* <Segmented options={Options} size='large' value={Number(amount)} onChange={onChange} /> */}
                <Radio.Group value={amount} onChange={onChange} size='large'>
                  {Options.map(item => (
                    <Radio.Button value={item.value}>{item.label}</Radio.Button>
                  ))
                  }

                </Radio.Group>
                <div>
                  <input value={inputValue} className='ml-2'
                    onChange={(e) => setinputValue(e.target.value)}
                  />
                </div>
              </div>


              <div className='mt-3 mb-1'>{t('自定义最低代币持有量')}</div>
              <input
                value={inputAmount}
                onChange={(e) => setInputAmount(e.target.value)}
              />
            </div>

            <div className='buttonSwapper mt-3'>
              <Button className={Button_Style} onClick={click} loading={isStart}>立即快照</Button>
            </div>
          </>}
      </GatherPage >
    </Page>
  )
}

export default Snapshot