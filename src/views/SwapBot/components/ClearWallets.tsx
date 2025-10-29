import React, { useState } from 'react';
import { Button, Modal, ConfigProvider, Input, message } from 'antd';
import styled from 'styled-components';
import { useAppSelector as useSelector, useAppDispatch as useDispatch } from 'hooks/useStore'
import {
  privateKeysChange,
} from '@/store/bot'

const ModalSwapper = styled.div`
  text-align: center;
  padding: 30px 0;
  .title {
    font-size: 26px;
    font-weight: bold;
  }
  .title1 {
    color: #f40f0f;
    font-size: 18px;
    margin: 10px 0 20px;
  }
  .ant-btn.ant-btn-lg {
    padding: 8px 30px;
  }
`

interface PropsType {

}

export const ClearWalletButton = (props: PropsType) => {
  const dispatch = useDispatch()
  const [messageApi, contextHolder] = message.useMessage()
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [value, setValue] = useState('')
  const [isCreateWallet, setIsCreateWallet] = useState(false)

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleOk = async () => {
    dispatch(privateKeysChange([]))
    messageApi.success('清除成功')
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  return (
    <>{contextHolder}
      <Button onClick={showModal} type='primary' danger>删除全部钱包</Button>
      <Modal title="" open={isModalOpen}
        onCancel={handleCancel} centered footer={null}>
        <ModalSwapper>
          <div className='title'>确认删除?</div>
          <div className='title1'>即将删除所以刷单钱包，请确保已清空钱包内所有资产,否则无法找回</div>
          <Button type="primary" size='large'
            onClick={handleCancel}>取消</Button>
          <Button type="primary" size='large' style={{ marginLeft: '30px' }} danger
            onClick={handleOk}>确认删除</Button>
        </ModalSwapper>
      </Modal>
    </>
  );
};

