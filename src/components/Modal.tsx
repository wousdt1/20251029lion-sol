import React, { useState } from 'react';
import { Button, Modal, Input, Flex, message, Radio } from 'antd';
import { useTranslation } from "react-i18next";

export interface ConfigType {
  min: string
  max: string
  decimals: string
}

interface PropsType {
  // updata: (_value: string) => void
  updata: (type: number, _value: string, config: ConfigType) => void
}

const App = (props: PropsType) => {
  const { updata } = props
  const { t } = useTranslation()
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [messageApi, contextHolder] = message.useMessage()

  const [inputValue, setInputValue] = useState('')
  const [type, setType] = useState(0)
  const [numberConfig, setNumberConfig] = useState({
    min: '',
    max: '',
    decimals: '6'
  })

  const configChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNumberConfig({ ...numberConfig, [e.target.name]: e.target.value })
  }
  const inputValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleOk = () => {
    if (type === 1) {
      if (Number(numberConfig.decimals) > 9) return messageApi.error('小数位数最大为9')
      if (Number(numberConfig.min) > Number(numberConfig.max)) return messageApi.error('最低数不能大于最高数')
    }
    updata(type, inputValue, numberConfig)
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const typeChange = (e) => {
    setType(e.target.value)
  }

  return (
    <>
      {contextHolder}
      <div onClick={showModal} className='auto_color'>{t('Automatically add quantity')}</div>

      <Modal title={t('Automatically add quantity after each address')} open={isModalOpen} footer={null} onCancel={handleCancel}>

        <Radio.Group value={type} onChange={typeChange}>
          <Radio.Button value={0}>固定数量</Radio.Button>
          <Radio.Button value={1}>随机数量</Radio.Button>
        </Radio.Group>

        {type === 0 ?
          <>
            <p className='mt-5'>固定数量</p>
            <Input onChange={inputValueChange} value={inputValue} placeholder={t('请输入数量')} />
          </> :
          <>
            <div className='mt-5 flex justify-between'>
              <div>
                <p>最低数量</p>
                <Input onChange={configChange} value={numberConfig.min} name='min' placeholder={t('请输入最低数量')} />
              </div>
              <div>
                <p>最高数量</p>
                <Input onChange={configChange} value={numberConfig.max} name='max' placeholder={t('请输入最高数量')} />
              </div>
            </div>
            <div className='mt-5'>
              <p>小数位数(例如代币精度6，小数位数最大只能是6)</p>
              <Input onChange={configChange} value={numberConfig.decimals} name='decimals' placeholder={t('请输入小数位数')} />
            </div>
          </>
        }
        <Flex style={{ margin: '30px 0 10px' }}>
          <Button onClick={handleCancel} style={{ marginRight: '10px' }}>{t('Cancel')}</Button>
          <Button onClick={handleOk} type="primary">{t('Confirm')}</Button>
        </Flex>

      </Modal>
    </>
  );
};

export default App;