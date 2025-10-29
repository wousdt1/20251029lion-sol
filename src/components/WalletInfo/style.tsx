import styled from "styled-components";

export const WalletInfoPage = styled.div`
  margin: 20px 0;
  .header {
    margin: 10px 0;
  }
  
  .wallet {
    font-size: 14px;
  }
  .buttonSwapper button {
    background-color: #63e2bd;
  }
  .walletHeader {
    display: flex;
    justify-content: space-between;
    margin: 10px 0 0 0;
    border: 1px solid #e2e8f0;

    background-color: #fafafa;
    font-weight: bold;
    border-radius: 10px 10px 0 0;
    overflow: hidden;
    div:not(:last-child) {
      width: 29%;
      text-align: center;
      padding: 10px 0;
      border-right: 1px solid #e2e8f0;
    }
    div:last-child {
      width: 13%;
      text-align: center;
      padding: 10px;
    }
  }

  .walletInfo {
    display: flex;
    justify-content: space-between;
    border-bottom: 1px solid #e2e8f0;
    div:not(:last-child) {
      width: 29%;
      padding: 10px;
    }
    div:last-child {
      width: 13%;
      text-align: center;
      padding: 10px;
    }
    div {
      border-right: 1px solid #e2e8f0;
    }
    div:first-child {
      border-left: 1px solid #e2e8f0;
    }
  }
  .autoInput {
    display: flex;
    align-items: center;
    font-size: 14px;
    margin: 20px 0;
  }

  @media screen and (max-width:968px) { 
    .wallet {
      width: 100%;
      overflow: scroll;
    }
    .walletHeader, .walletInfo {
      width: 200%;
    }
    .gt {
      margin: 10px 0;
    }
  }
`