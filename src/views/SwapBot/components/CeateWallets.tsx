import React, { useState } from 'react';
import { Button, Modal, notification, Input, message } from 'antd';
import { Keypair } from '@solana/web3.js';
import styled from 'styled-components';
import bs58 from 'bs58';
import { delay } from '../utils';

const ModalSwapper = styled.div`
  text-align: center;
  padding: 30px 0;
  .title {
    font-size: 26px;
    font-weight: bold;
  }
  .title1 {
    font-size: 18px;
    margin: 20px 0;
  }
  .ant-btn.ant-btn-lg {
    padding: 8px 30px;
  }
`

interface PropsType {
  callBack: (keyArr: string[]) => void
}

export const CeateWalletButton = (props: PropsType) => {
  const { callBack } = props
  const [messageApi, contextHolder] = notification.useNotification();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [value, setValue] = useState('')
  const [isCreateWallet, setIsCreateWallet] = useState(false)

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleOk = async () => {
    try {
      setIsCreateWallet(true)
      await delay(500)
      const keyArr = []
      for (let i = 0; i < Number(value); i++) {
        const wallet = Keypair.generate()
        const address = wallet.publicKey.toString()
        const privateKey = bs58.encode(wallet.secretKey)
        keyArr.push(privateKey)
      }
      messageApi.success({ message: '钱包创建成功' })
      callBack(keyArr)
      setIsCreateWallet(false)
    } catch (error) {
      messageApi.error({ message: error.toString() })
      setIsCreateWallet(false)
    }

    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  return (
    <>{contextHolder}
      <Button onClick={showModal}>生成刷单钱包</Button>
      <Modal title="" open={isModalOpen}
        onCancel={handleCancel} centered footer={null}>
        <ModalSwapper>
          <div className='title'>输入要生成的钱包数量</div>
          <div className='title1'>
            <Input size='large' value={value} onChange={(e) => setValue(e.target.value)}
              placeholder='输入要生成的钱包数量' />
          </div>
          <Button type="primary" size='large' onClick={handleOk} loading={isCreateWallet}>
            {!isCreateWallet ? '确定' : '创建钱包中..'}
          </Button>
          <Button type="primary" size='large' style={{ marginLeft: '10px' }} danger
            onClick={handleCancel}>取消</Button>
        </ModalSwapper>
      </Modal>
    </>
  );
};

