import { useState, SetStateAction, Dispatch, useEffect } from 'react'
import { Button, message, notification, Tag, Checkbox, Spin } from 'antd'
import type { CheckboxChangeEvent } from 'antd'
import { BsCopy } from "react-icons/bs";
import { DeleteOutlined, ArrowRightOutlined } from '@ant-design/icons'
import copy from 'copy-to-clipboard';
import { addressHandler } from '@/utils'
import { LoadingOut } from '@/components'
import type { SwapBotConfigType } from '@/type'
import { ClearWalletButton } from '../ClearWallets'
import { WalletInfoPage } from './style'


interface PropsType {
  tokenASymbol: string
  tokenBSymbol: string
  config: SwapBotConfigType[]
  setConfig: Dispatch<SetStateAction<SwapBotConfigType[]>>
  isLoading: boolean
  updata: () => void
}

function WalletInfo(props: PropsType) {
  const { config, setConfig, tokenBSymbol, tokenASymbol, isLoading, updata } = props

  const [messageApi, contextHolder] = message.useMessage();

  const deleteClick = (account: string, index: number) => {
    const _config = config.filter(item => item.walletAddr !== account)
    setConfig(_config)
  }

  const [checkAll, setCheckAll] = useState(false);
  const [indeterminate, setIndeterminate] = useState(false);
  const onCheckAllChange = (e: CheckboxChangeEvent) => {
    setIndeterminate(false);
    setCheckAll(e.target.checked);

    const _config = [...config]
    _config.map(item => item.isCheck = e.target.checked)
    setConfig(_config)
  };
  const itemOnCheckChange = (e: CheckboxChangeEvent) => {
    const _config = [...config]
    _config[Number(e.target.name)].isCheck = e.target.checked
    setConfig(_config)
  }

  useEffect(() => {
    checkChange()
  }, [config])

  const checkChange = () => {
    const _config = [...config]
    const checkArr = _config.filter(item => item.isCheck)
    if (checkArr.length === 0) {
      setIndeterminate(false);
      setCheckAll(false)
    } else if (checkArr.length === _config.length) {
      setIndeterminate(false);
      setCheckAll(true)
    } else {
      setIndeterminate(true);
    }
  }

  const copyClick = (value: string) => {
    copy(value)
    messageApi.success('copy success')
  }

  return (
    <WalletInfoPage>
      {contextHolder}
      <div className='header'>
        <Button onClick={updata} type='primary'>刷新余额</Button>
        <ClearWalletButton />
      </div>

      <div className='wallet'>
        <div className='walletHeader'>
          <div className='flex items-center'><Checkbox indeterminate={indeterminate} checked={checkAll} onChange={onCheckAllChange} /></div>
          <div className='flex items-center'>地址</div>
          <div className='flex items-center'>SOL余额</div>
          <div className='flex items-center'>{tokenASymbol} 余额</div>
          <div className='flex items-center'>{tokenBSymbol}余额</div>

          <div className='flex items-center'>移除</div>
        </div>
        {isLoading && <LoadingOut title='钱包信息加载中...' />}
        {!isLoading &&
          <div className='waletSwapper'>
            {config.map((item, index) => (
              <div className='walletInfo' key={item.walletAddr}>
                <div>
                  <span>
                    <Checkbox className='mr-2' checked={item.isCheck} onChange={itemOnCheckChange} name={`${index}`} />
                    {index + 1}
                  </span>
                </div>
                <div className='flex items-center'>
                  <span>{addressHandler(item.walletAddr)} </span>
                  <BsCopy className='ml-2' onClick={() => copyClick(item.walletAddr)} />
                </div>
                <div>{item.balance}</div>
                <div>{item.tokenABalance}</div>
                <div>{item.tokenBBalace}</div>

                <div><DeleteOutlined onClick={() => deleteClick(item.walletAddr, index)} /></div>
              </div>
            ))}
          </div>
        }

      </div>
    </WalletInfoPage>
  )
}

export default WalletInfo