import styled from "styled-components";

export const Page = styled.div`
  width: 80%;
  padding: 50px;
  margin: 0 auto;
  font-size: 18px;
  /* min-height: 200vh; */

  .btn {
    text-align: center;
    button  {
      width: 30%;
      box-shadow: rgba(0, 0, 0, 0.4) 0px 2px 4px, rgba(0, 0, 0, 0.3) 0px 7px 13px -3px, rgba(0, 0, 0, 0.2) 0px -3px 0px inset;
    }
}
  .tokenInput {
     display: flex;
     align-items: center;

     .input {
       flex: 1;
       input {
        height: 48px;
       }
     }
   }
   .authorityBox {
    background-color: #f6f6f6;
    border-radius: 6px;
    font-size: 14px;
    color: #626262;
    padding: 14px;
   }
   .box {
     background-color: #00c853;
     color: #fff;
     display: inline-flex;
     align-items: center;
     border-radius: 4px;
     padding: 0 16px;
     margin-top: 4px;
   }
   .box1 {
     background-color: #ff5252;
     color: #fff;
     display: inline-flex;
     align-items: center;
     border-radius: 4px;
     padding: 0 16px;
     margin-top: 4px;
   }
   .cardActive {
    border: 2px solid #bf39f1;
   }

  @media screen and (max-width:968px) {
    width: 100%;
    padding:50px 0;
}
`