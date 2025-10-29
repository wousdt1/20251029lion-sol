import styled from 'styled-components'

export const GatherPage = styled.div`

  .title {
    font-size: 22px;
    font-weight: bold;
  }
  .t1 {
    font-size: 14px;
    color: #4d4747;
  }

  p {
        color: #8c8c8c;
    }
.ibtn {
    button {
        height: 40px;
        background-color: #ff9815 !important;
        color: #fff !important;
    }
}
    input{
        width: 100%;
        height: 41px;
        border-radius: 5px;
        border: 1px solid #737373;
    }
    .token {
        margin: 30px 0;
        /* display: flex;
        justify-content: space-between; */

    }
    .top {
        display: flex;
        padding: 3px;
        margin: 20px 0;
        flex-wrap: wrap;
        div {
            padding:6px 4px;
            border: 1px solid #737373;
            
        }
        input {
            margin-left: 30px;
            width:40px;
        }
        .active {
            background-color: #ff5733 !important;
            border-radius: 3px;
        }
    }
    .box {
       background-color: #512da8;
       padding: 20px;
       border-radius: 6px;

       flex: 1;
       img {
        width: 30px;
        height: 30px;
       }
    }

    @media (max-width: 768px) {
        padding:30px;
    
    }

`