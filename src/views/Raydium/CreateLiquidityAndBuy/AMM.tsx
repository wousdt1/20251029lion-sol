import { useState } from 'react'
import { Input, Switch, DatePicker, Button, notification, Space, Radio, message } from 'antd'
import type { DatePickerProps } from 'antd';
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import {
  PublicKey, SystemProgram, LAMPORTS_PER_SOL, Transaction, TransactionInstruction,
  Keypair
} from '@solana/web3.js'
import axios from 'axios'
import {
  MARKET_STATE_LAYOUT_V3,
  AMM_V4,
  OPEN_BOOK_PROGRAM,
  FEE_DESTINATION_ID,
  DEVNET_PROGRAM_ID,
  TxVersion,
  getLiquidityAssociatedId,
  ApiV3PoolInfoStandardItem,
  AmmV4Keys
} from '@raydium-io/raydium-sdk-v2'
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'
import base58 from "bs58";
import * as BufferLayout from 'buffer-layout';
import BN from 'bn.js'
import { initSdk } from '@/Dex/Raydium'
import { getTxLink, addPriorityFees } from '@/utils'
import { Input_Style, Button_Style, CREATE_POOL_FEE, BANANATOOLS_ADDRESS } from '@/config'
import { useIsVip } from '@/hooks';
import { getVaultOwnerAndNonce } from '../CreateID/orderbookUtils';
import { useConfig } from '@/hooks';
import { SOL, PUMP } from '@/config/Token'
import type { Token_Type, WalletConfigType } from '@/type'
import { JitoFee, SelectToken, Result, Hint, WalletInfo } from '@/components'
import { CreatePool } from './style'

interface PropsType {
  isAndBuy?: boolean
}
declare type AssociatedName = "amm_associated_seed" | "lp_mint_associated_seed" | "coin_vault_associated_seed" | "pc_vault_associated_seed" | "lp_mint_associated_seed" | "temp_lp_token_associated_seed" | "open_order_associated_seed" | "target_associated_seed" | "withdraw_associated_seed";

function CreateLiquidity(props: PropsType) {
  const { isAndBuy } = props
  const { _isMainnet, OPENBOOK_PROGRAM_ID } = useConfig()
  const [api, contextHolder1] = notification.useNotification();
  const { connection } = useConnection();
  const { publicKey, sendTransaction, signTransaction } = useWallet();
  const vipConfig = useIsVip()
  const [baseToken, setBaseToken] = useState<Token_Type>(PUMP)
  const [token, setToken] = useState<Token_Type>(SOL)
  const [isOptions, setIsOptions] = useState(false)
  const [isCreate, setIsCreate] = useState(false)
  const [signature, setSignature] = useState("");
  const [error, setError] = useState('');
  const [poolAddr, setPoolAddr] = useState('')
  const [isSearchId, setIsSearchId] = useState(false)
  const [jitoOpen, setJitoOpen] = useState(false)
  const [jitoFee, setJitoFee] = useState<number>(0)
  const [jitoRpc, setJitoRpc] = useState('')
  const [walletConfig, setWalletConfig] = useState<WalletConfigType[]>([])
  const [mainBuySol, setMainBuySol] = useState('')
  const [buyType, setBuyType] = useState(0)

  const [config, setConfig] = useState({
    marketId: '',
    baseAmount: '',
    quoteAmount: '',
    startTime: ''
  })
  const configChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfig({ ...config, [e.target.name]: e.target.value })
  }
  const baseChange = (_token: Token_Type) => {
    setBaseToken(_token)
  }
  const backClick = (_token: Token_Type) => {
    setToken(_token)
  }
  const timeOnChange: DatePickerProps['onChange'] = (date, dateString) => {
    const time = Date.parse(dateString as string) / 1000
    setConfig({ ...config, startTime: time.toString() })
  };
  const jitoCallBack = (jitoFee_: number, jitoRpc_: string) => {
    setJitoFee(jitoFee_)
    setJitoRpc(jitoRpc_)
  }

  const ACCOUNT_LAYOUT = BufferLayout.struct([
    BufferLayout.blob(53, 'mint'),
    BufferLayout.blob(32, 'owner'),
    BufferLayout.blob(85, 'base'),
    BufferLayout.nu64('amount'),
    BufferLayout.blob(93),
  ]);
  const findMarketId = async () => {
    try {
      setIsSearchId(true)
      const result = await connection.getProgramAccounts(new PublicKey(OPENBOOK_PROGRAM_ID), {
        filters: [
          {
            memcmp: {
              offset: ACCOUNT_LAYOUT.offsetOf('owner'),
              bytes: baseToken.address,
            },
          },
          {
            memcmp: {
              offset: ACCOUNT_LAYOUT.offsetOf('base'),
              bytes: token.address,
            },
          },
        ]
      });
      if (result.length > 0) {
        const marketId = result[0].pubkey.toBase58()
        setConfig({ ...config, marketId })
        api.success({ message: "查找成功" })
      } else {
        api.success({ message: "没有查找到ID" })
      }
      setIsSearchId(false)
    } catch (error) {
      console.log(error)
      api.error({ message: error.toString() })
      setIsSearchId(false)
    }
  }

  const createClick = async () => {
    try {

      if (!token) return api.error({ message: "请选择代币" })
      if (!config.marketId) return api.error({ message: "请填写市场ID" })
      if (!config.baseAmount) return api.error({ message: "请填写基础代币数量" })
      if (!config.quoteAmount) return api.error({ message: "请填写报价代币数量" })

      setIsCreate(true)
      let startTime = new BN(0)
      if (isOptions && config.startTime) {
        startTime = new BN(config.startTime)
      }
      const raydium = await initSdk({
        owner: publicKey,
        connection: connection,
      });

      const marketId = new PublicKey(config.marketId)
      // if you are confirmed your market info, don't have to get market info from rpc below
      const marketBufferInfo = await raydium.connection.getAccountInfo(new PublicKey(marketId))
      const marketData = MARKET_STATE_LAYOUT_V3.decode(marketBufferInfo!.data)
      const { baseMint, quoteMint } = MARKET_STATE_LAYOUT_V3.decode(marketBufferInfo!.data)
      const baseMintInfo = await raydium.token.getTokenInfo(baseMint)
      const quoteMintInfo = await raydium.token.getTokenInfo(quoteMint)
      const txVersion = TxVersion.V0 // or TxVersion.LEGACY
      const baseAmount = new BN(Number(config.baseAmount) * (10 ** baseToken.decimals))
      const quoteAmount = new BN(Number(config.quoteAmount) * (10 ** token.decimals))
      if (
        baseMintInfo.programId !== TOKEN_PROGRAM_ID.toBase58() ||
        quoteMintInfo.programId !== TOKEN_PROGRAM_ID.toBase58()
      ) {
        return message.error('not amm pools ')
      }
      const execute = await raydium.liquidity.createPoolV4({
        programId: _isMainnet ? AMM_V4 : DEVNET_PROGRAM_ID.AmmV4,
        marketInfo: {
          marketId,
          programId: _isMainnet ? OPEN_BOOK_PROGRAM : DEVNET_PROGRAM_ID.OPENBOOK_MARKET,
        },
        baseMintInfo: {
          mint: baseMint,
          decimals: baseToken.decimals, // if you know mint decimals here, can pass number directly
        },
        quoteMintInfo: {
          mint: quoteMint,
          decimals: token.decimals, // if you know mint decimals here, can pass number directly
        },
        baseAmount, // if devent pool with sol/wsol, better use amount >= 4*10**9
        quoteAmount, // if devent pool with sol/wsol, better use amount >= 4*10**9
        startTime, // unit in seconds
        ownerInfo: {
          feePayer: publicKey,
          useSOLBalance: true,
        },
        associatedOnly: false,
        txVersion,
        checkCreateATAOwner: true,
        feeDestinationId: _isMainnet ? FEE_DESTINATION_ID : DEVNET_PROGRAM_ID.FEE_DESTINATION_ID, // devnet
        // optional: set up priority fee here
        // computeBudgetConfig: {
        //   units: 600000,
        //   microLamports: 4659150,
        // },
      })
      const poolId = execute.extInfo.address.ammId.toBase58()
      const _transaction = execute.transaction;
      const Tx = new Transaction();
      const instructions = _transaction.message.compiledInstructions.map((instruction: any) => {
        return new TransactionInstruction({
          keys: instruction.accountKeyIndexes.map((index: any) => ({
            pubkey: _transaction.message.staticAccountKeys[index],
            isSigner: _transaction.message.isAccountSigner(index),
            isWritable: _transaction.message.isAccountWritable(index),
          })),
          programId: _transaction.message.staticAccountKeys[instruction.programIdIndex],
          data: Buffer.from(instruction.data),
        });
      });
      instructions.forEach((instruction: any) => Tx.add(instruction));
      if (!vipConfig.isVip) {
        const fee = SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(BANANATOOLS_ADDRESS),
          lamports: CREATE_POOL_FEE * LAMPORTS_PER_SOL,
        })
        Tx.add(fee)
      }
      const memoProgramId = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');
      const tipAccounts = [
        'Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY',
        'DttWaMuVvTiduZRnguLF7jNxTgiMBZ1hyAumKUiL2KRL',
        '96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5',
        '3AVi9Tg9Uo68tJfuvoKvqKNWKkC5wPdSSdeBnizKZ6jT',
        'HFqU5x63VTqvQss8hp11i4wVV8bD44PvwucfZ2bU7gRe',
        'ADaUMid9yfUytqMBgopwjb2DTLSokTSzL1zt6iGPaS49',
        'ADuUkR4vqLUMWXxW9gh6D6L8pMSawimctcNZ5pGwDcEt',
        'DfXygSm4jCyNCybVYYK6DwvWqjKee8pbDmJGcLWNDXjh',
      ];
      const jitoTipAccount = new PublicKey(tipAccounts[Math.floor(tipAccounts.length * Math.random())])
      const JITO_FEE = Number(jitoFee) * LAMPORTS_PER_SOL; // 小费
      Tx.add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: jitoTipAccount,
          lamports: JITO_FEE,
        })
      );
      // Get recent blockhash
      const { blockhash } = await connection.getLatestBlockhash("processed");
      Tx.recentBlockhash = blockhash;
      Tx.feePayer = publicKey;
      const transactions: string[] = [];
      // Sign the transaction
      const finalTxId = await signTransaction(Tx);
      const serializedTransaction = finalTxId!.serialize({ verifySignatures: false });
      const base58EncodedTransaction = base58.encode(serializedTransaction);
      transactions.push(base58EncodedTransaction);

      let baseReserve = Number(baseAmount) * (10 ** baseMintInfo.decimals);
      let quoteReserve = Number(quoteAmount) * (10 ** quoteMintInfo.decimals);
      const status = 6;
      if (Number(buyType) === 0) {
        // 一次
        if (Number(mainBuySol) > 0) {
          const accountKeys = execute.transaction.message.staticAccountKeys;
          const virtualPoolInfo: ApiV3PoolInfoStandardItem = {
            configId: accountKeys[19].toBase58(),
            day: {
              apr: 0,
              feeApr: 0,
              priceMax: 0,
              priceMin: 0,
              rewardApr: [],
              volume: 0,
              volumeFee: 0,
              volumeQuote: 0
            },
            farmFinishedCount: 0,
            farmOngoingCount: 0,
            farmUpcomingCount: 0,
            feeRate: 0.0025,
            id: accountKeys[2].toBase58(),
            lpAmount: 0,
            lpMint: {
              address: accountKeys[4].toBase58(),
              chainId: 101,
              decimals: 9,
              extensions: {},
              logoURI: "",
              name: "",
              programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
              symbol: "",
              tags: []
            },
            lpPrice: 0,
            marketId: accountKeys[21].toBase58(),
            mintA: {
              address: accountKeys[18].toBase58(),
              chainId: 101,
              decimals: baseMintInfo.decimals,
              extensions: {},
              logoURI: "",
              name: "",
              programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
              symbol: "",
              tags: []
            },
            mintAmountA: Number(baseAmount),
            mintAmountB: Number(quoteAmount),
            mintB: {
              address: accountKeys[13].toBase58(),
              chainId: 101,
              decimals: quoteMintInfo.decimals,
              extensions: {},
              logoURI: "",
              name: "",
              programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
              symbol: "",
              tags: []
            },
            month: {
              apr: 0,
              feeApr: 0,
              priceMax: 0,
              priceMin: 0,
              rewardApr: [],
              volume: 0,
              volumeFee: 0,
              volumeQuote: 0
            },
            openTime: "0",
            pooltype: [],
            price: Number(quoteAmount) / Number(baseAmount),
            programId: accountKeys[15].toBase58(),
            rewardDefaultInfos: [],
            rewardDefaultPoolInfos: "Ecosystem",
            tvl: 0,
            type: "Standard",
            week: {
              apr: 0,
              feeApr: 0,
              priceMax: 0,
              priceMin: 0,
              rewardApr: [],
              volume: 0,
              volumeFee: 0,
              volumeQuote: 0
            },
            burnPercent: 0
          };
          const [vaultOwner] = await getVaultOwnerAndNonce(
            new PublicKey(marketId),
            new PublicKey(marketBufferInfo.owner.toBase58()!)
          );
          const virtualPoolKeys: AmmV4Keys = {
            authority: accountKeys[17].toBase58(),
            id: accountKeys[2].toBase58(),
            marketAsks: marketData.asks.toBase58(),
            marketAuthority: vaultOwner.toString(),
            marketBaseVault: marketData.baseVault.toBase58(),
            marketBids: marketData.bids.toBase58(),
            marketEventQueue: marketData.eventQueue.toBase58(),
            marketId: accountKeys[21].toBase58(),
            marketProgramId: accountKeys[20].toBase58(),
            marketQuoteVault: marketData.quoteVault.toBase58(),
            mintA: {
              address: accountKeys[18].toBase58(),
              chainId: 101,
              decimals: baseMintInfo.decimals,
              extensions: {},
              logoURI: '',
              name: "",
              programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              symbol: '',
              tags: []
            },
            mintB: {
              address: accountKeys[13].toBase58(),
              chainId: 101,
              decimals: quoteMintInfo.decimals,
              extensions: {},
              logoURI: '',
              name: "",
              programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              symbol: '',
              tags: []
            },
            mintLp: {
              address: accountKeys[4].toBase58(),
              chainId: 101,
              decimals: 9,
              extensions: {},
              logoURI: '',
              name: "",
              programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              symbol: '',
              tags: []
            },
            openOrders: accountKeys[3].toBase58(),
            openTime: "0",
            programId: accountKeys[15].toBase58(),
            targetOrders: accountKeys[7].toBase58(),
            vault: {
              A: accountKeys[5].toBase58(),
              B: accountKeys[6].toBase58()
            }
          };
          const mintIn = quoteMint.toBase58();
          const mintOut = baseMint.toBase58();
          const amountIn = Number(mainBuySol)
          console.log(baseMint.toBase58(), quoteMint.toBase58(), 'baseMint, quoteMint')
          // 计算数据
          const out = raydium.liquidity.computeAmountOut({
            poolInfo: {
              ...virtualPoolInfo,
              // baseReserve,
              // quoteReserve,
              baseReserve: new BN(baseReserve),
              quoteReserve: new BN(quoteReserve),
              status,
              version: 4,
            },
            amountIn: new BN(amountIn * 10 ** quoteMintInfo.decimals),
            mintIn: mintIn,
            mintOut: mintOut,
            slippage: 0.5,
          });
          baseReserve -= Number(out.minAmountOut);
          quoteReserve += amountIn * 10 ** quoteMintInfo.decimals;
          const swapResult = await raydium.liquidity.swap({
            poolInfo: virtualPoolInfo,
            poolKeys: virtualPoolKeys,
            amountIn: new BN(amountIn * 10 ** quoteMintInfo.decimals),
            amountOut: out.minAmountOut,
            fixedSide: "in",
            inputMint: mintIn,
            txVersion,
            computeBudgetConfig: {
              units: 250000,
              microLamports: 1000000,
            },
          });
          // console.log(swapResult, "swapResult");
          const _transaction = swapResult.transaction;
          const combinedTransaction = new Transaction();
          const instructions = _transaction.message.compiledInstructions.map((instruction: any) => {
            return new TransactionInstruction({
              keys: instruction.accountKeyIndexes.map((index: any) => ({
                pubkey: _transaction.message.staticAccountKeys[index],
                isSigner: _transaction.message.isAccountSigner(index),
                isWritable: _transaction.message.isAccountWritable(index),
              })),
              programId: _transaction.message.staticAccountKeys[instruction.programIdIndex],
              data: Buffer.from(instruction.data),
            });
          });
          instructions.forEach((instruction: any) => combinedTransaction.add(instruction));
          // jito---------------------------------------------
          // Add Jito tip instruction
          combinedTransaction.add(
            SystemProgram.transfer({
              fromPubkey: publicKey,
              toPubkey: jitoTipAccount,
              lamports: JITO_FEE,
            })
          );
          // Add memo instruction
          const memoInstruction = new TransactionInstruction({
            keys: [],
            programId: memoProgramId,
            data: Buffer.from('Hello, Jito!'),
          });
          combinedTransaction.add(memoInstruction);
          // Get recent blockhash
          const { blockhash } = await connection.getLatestBlockhash("processed");
          combinedTransaction.recentBlockhash = blockhash;
          combinedTransaction.feePayer = publicKey;
          // Sign the transaction
          const finalTxId = await signTransaction(combinedTransaction);
          const serializedTransaction = finalTxId!.serialize({ verifySignatures: false });
          const base58EncodedTransaction = base58.encode(serializedTransaction);
          transactions.push(base58EncodedTransaction);
          // jito------------------------------------------------------
        }
      } else {
        for (let i = 0; i < walletConfig.length; i++) {
          if (walletConfig[i].privateKey != "") {
            const keypair2 = Keypair.fromSecretKey(bs58.decode(walletConfig[i].privateKey));
            const raydium2 = await initSdk({
              owner: keypair2.publicKey,
              connection: connection,
            });
            const accountKeys = execute.transaction.message.staticAccountKeys;
            const virtualPoolInfo: ApiV3PoolInfoStandardItem = {
              configId: accountKeys[19].toBase58(),
              day: {
                apr: 0,
                feeApr: 0,
                priceMax: 0,
                priceMin: 0,
                rewardApr: [],
                volume: 0,
                volumeFee: 0,
                volumeQuote: 0
              },
              farmFinishedCount: 0,
              farmOngoingCount: 0,
              farmUpcomingCount: 0,
              feeRate: 0.0025,
              id: accountKeys[2].toBase58(),
              lpAmount: 0,
              lpMint: {
                address: accountKeys[4].toBase58(),
                chainId: 101,
                decimals: 9,
                extensions: {},
                logoURI: "",
                name: "",
                programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                symbol: "",
                tags: []
              },
              lpPrice: 0,
              marketId: accountKeys[21].toBase58(),
              mintA: {
                address: accountKeys[18].toBase58(),
                chainId: 101,
                decimals: baseMintInfo.decimals,
                extensions: {},
                logoURI: "",
                name: "",
                programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                symbol: "",
                tags: []
              },
              mintAmountA: Number(baseAmount),
              mintAmountB: Number(quoteAmount),
              mintB: {
                address: accountKeys[13].toBase58(),
                chainId: 101,
                decimals: quoteMintInfo.decimals,
                extensions: {},
                logoURI: "",
                name: "",
                programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                symbol: "",
                tags: []
              },
              month: {
                apr: 0,
                feeApr: 0,
                priceMax: 0,
                priceMin: 0,
                rewardApr: [],
                volume: 0,
                volumeFee: 0,
                volumeQuote: 0
              },
              openTime: "0",
              pooltype: [],
              price: Number(quoteAmount) / Number(baseAmount),
              programId: accountKeys[15].toBase58(),
              rewardDefaultInfos: [],
              rewardDefaultPoolInfos: "Ecosystem",
              tvl: 0,
              type: "Standard",
              week: {
                apr: 0,
                feeApr: 0,
                priceMax: 0,
                priceMin: 0,
                rewardApr: [],
                volume: 0,
                volumeFee: 0,
                volumeQuote: 0
              },
              burnPercent: 0
            };
            const [vaultOwner] = await getVaultOwnerAndNonce(
              new PublicKey(marketId),
              new PublicKey(marketBufferInfo.owner.toBase58()!)
            );
            const virtualPoolKeys: AmmV4Keys = {
              authority: accountKeys[17].toBase58(),
              id: accountKeys[2].toBase58(),
              marketAsks: marketData.asks.toBase58(),
              marketAuthority: vaultOwner.toString(),
              marketBaseVault: marketData.baseVault.toBase58(),
              marketBids: marketData.bids.toBase58(),
              marketEventQueue: marketData.eventQueue.toBase58(),
              marketId: accountKeys[21].toBase58(),
              marketProgramId: accountKeys[20].toBase58(),
              marketQuoteVault: marketData.quoteVault.toBase58(),
              mintA: {
                address: accountKeys[18].toBase58(),
                chainId: 101,
                decimals: baseMintInfo.decimals,
                extensions: {},
                logoURI: '',
                name: "",
                programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                symbol: '',
                tags: []
              },
              mintB: {
                address: accountKeys[13].toBase58(),
                chainId: 101,
                decimals: quoteMintInfo.decimals,
                extensions: {},
                logoURI: '',
                name: "",
                programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                symbol: '',
                tags: []
              },
              mintLp: {
                address: accountKeys[4].toBase58(),
                chainId: 101,
                decimals: 9,
                extensions: {},
                logoURI: '',
                name: "",
                programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                symbol: '',
                tags: []
              },
              openOrders: accountKeys[3].toBase58(),
              openTime: "0",
              programId: accountKeys[15].toBase58(),
              targetOrders: accountKeys[7].toBase58(),
              vault: {
                A: accountKeys[5].toBase58(),
                B: accountKeys[6].toBase58()
              }
            };
            const mintIn = quoteMint.toBase58();
            const mintOut = baseMint.toBase58();
            const amountIn = Number(walletConfig[i].buySol)
            console.log(baseMint.toBase58(), quoteMint.toBase58(), 'baseMint, quoteMint')
            // 计算数据
            const out = raydium2.liquidity.computeAmountOut({
              poolInfo: {
                ...virtualPoolInfo,
                // baseReserve,
                // quoteReserve,
                baseReserve: new BN(baseReserve),
                quoteReserve: new BN(quoteReserve),
                status,
                version: 4,
              },
              amountIn: new BN(amountIn * 10 ** quoteMintInfo.decimals),
              mintIn: mintIn,
              mintOut: mintOut,
              slippage: 0.5,
            });
            // console.log(Number(out.minAmountOut), "out");
            baseReserve -= Number(out.minAmountOut);
            quoteReserve += amountIn * 10 ** quoteMintInfo.decimals;
            const swapResult = await raydium2.liquidity.swap({
              poolInfo: virtualPoolInfo,
              poolKeys: virtualPoolKeys,
              amountIn: new BN(amountIn * 10 ** quoteMintInfo.decimals),
              amountOut: out.minAmountOut,
              fixedSide: "in",
              inputMint: mintIn,
              txVersion,
              computeBudgetConfig: {
                units: 250000,
                microLamports: 1000000,
              },
            });
            // console.log(swapResult, "swapResult");
            const _transaction = swapResult.transaction;
            const combinedTransaction = new Transaction();
            const instructions = _transaction.message.compiledInstructions.map((instruction: any) => {
              return new TransactionInstruction({
                keys: instruction.accountKeyIndexes.map((index: any) => ({
                  pubkey: _transaction.message.staticAccountKeys[index],
                  isSigner: _transaction.message.isAccountSigner(index),
                  isWritable: _transaction.message.isAccountWritable(index),
                })),
                programId: _transaction.message.staticAccountKeys[instruction.programIdIndex],
                data: Buffer.from(instruction.data),
              });
            });
            instructions.forEach((instruction: any) => combinedTransaction.add(instruction));
            // jito---------------------------------------------
            // Add Jito tip instruction
            combinedTransaction.add(
              SystemProgram.transfer({
                fromPubkey: keypair2.publicKey,
                toPubkey: jitoTipAccount,
                lamports: JITO_FEE,
              })
            );
            // Add memo instruction
            // const memoInstruction = new TransactionInstruction({
            //     keys: [],
            //     programId: memoProgramId,
            //     data: Buffer.from('Hello, Jito!'),
            // });
            // combinedTransaction.add(memoInstruction);
            // Get recent blockhash
            const { blockhash } = await connection.getLatestBlockhash("processed");
            combinedTransaction.recentBlockhash = blockhash;
            combinedTransaction.feePayer = keypair2.publicKey;
            // Sign the transaction
            combinedTransaction.sign(keypair2);
            // const finalTxId = await sendAndConfirmTransaction(connection, combinedTransaction, [keypair2], { commitment: 'processed' });
            // console.log(`sig: ${finalTxId}`);
            // Serialize and base58 encode the entire signed transaction
            const serializedTransaction = combinedTransaction.serialize({ verifySignatures: false });
            // 序列化交易并获取其大小
            // console.log(`Transaction size: ${serializedTransaction.length} bytes`);
            const base58EncodedTransaction = base58.encode(serializedTransaction);
            transactions.push(base58EncodedTransaction);
            // jito------------------------------------------------------
          }
        }
      }

      const endpoints = `${jitoRpc}/api/v1/bundles`
      const result = await axios.post(endpoints, {
        jsonrpc: '2.0',
        id: 1,
        method: 'sendBundle',
        params: [transactions],
      })
      const bundleId = result?.data.result;
      console.log(bundleId, 'bundleId')
      const explorerUrl = `https://explorer.jito.wtf/bundle/${bundleId}`;
      console.log(explorerUrl)
      setSignature(explorerUrl)
      getBundleStatuses(bundleId, 0)

      setPoolAddr(poolId)
      // console.log("confirmation", signature);
      // setIsCreate(false);
      // api.success({ message: 'create pool success' })
    } catch (error) {
      console.log(error)
      api.error({ message: error.toString() })
      setIsCreate(false);
    }
  }

  const getBundleStatuses = async (bundleId: string, time: number) => {
    try {
      if (time > 120000) {
        api.error({ message: '请求超时' })
        setIsCreate(false);
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
        api.error({ message: '执行失败' })
        setError('发币失败')
        setIsCreate(false);
      } else if (state === 'Landed') {
        api.success({ message: '执行成功' })
        setIsCreate(false);
      } else {
        api.info({ message: '捆绑包ID提交中，请稍等...' })
        setTimeout(() => {
          getBundleStatuses(bundleId, time + 2000)
        }, 2000)
      }
    } catch (error: any) {
      setIsCreate(false);
      setError(error.toString())
      console.error('检查包状态时出错:', error);
    }
  }

  return (
    <>
      {contextHolder1}

      <CreatePool>
        <div className='token'>
          <div className='tokenItem mr-5'>
            <div className='mb-1 start'>基础代币</div>
            <SelectToken selecToken={baseToken} callBack={baseChange} />
          </div>
          <div className='tokenItem'>
            <div className='mb-1 start'>报价代币</div>
            <SelectToken selecToken={token} callBack={backClick} />
          </div>
        </div>

        <div className='mt-5'>
          <div className='flex mb-1 justify-between'>
            <div>OpenBook市场 ID(没有？去创建)</div>
            <Button type='primary' onClick={findMarketId} loading={isSearchId}>查找Market ID</Button>
          </div>
          <div>
            <Input className={Input_Style} value={config.marketId} onChange={configChange} name='marketId' />
          </div>
        </div>

        <div className='token mt-5'>
          <div className='tokenItem mr-5'>
            <div className='mb-1 start'>基础代币数量</div>
            <Input className={Input_Style} type='number' value={config.baseAmount} onChange={configChange} name='baseAmount' />
          </div>
          <div className='tokenItem'>
            <div className='mb-1 start'>报价代币数量</div>
            <Input className={Input_Style} type='number' value={config.quoteAmount} onChange={configChange} name='quoteAmount' />
          </div>
        </div>


        <Radio.Group className='mt-5 mb-5' value={buyType} onChange={(e) => setBuyType(e.target.value)} size='large'>
          <Radio.Button value={0}>当前钱包买入</Radio.Button>
          <Radio.Button value={1}>导入钱包买入</Radio.Button>
        </Radio.Group>

        {/* {isAndBuy ?
          <div className='flex items-center mt-5 options'>
            <div className='mr-3 mb-2'>捆绑选项</div>
            <Switch checked={jitoOpen} onChange={(e) => setJitoOpen(e)} />
          </div> :
          <div className='flex items-center mt-5 options'>
            <div className='mr-3 mb-2'>开盘时间</div>
            <Switch checked={isOptions} onChange={(e) => setIsOptions(e)} />
          </div>
        } */}
        {buyType === 0 ?
          <div>
            <div className='tokenItem mr-5'>
              <div className='mb-1 start'>当前钱包买入数量</div>
              <Input className={Input_Style} type='number' value={mainBuySol} onChange={(e) => setMainBuySol(e.target.value)} name='baseAmount' />
            </div>
          </div> :
          <>
            <JitoFee callBack={jitoCallBack} />
            <WalletInfo config={walletConfig} setConfig={setWalletConfig} />
          </>
        }


        {isOptions && !isAndBuy &&
          <>
            <Space direction="vertical" size={12}>
              <DatePicker showTime onChange={timeOnChange} size='large' />
            </Space>
          </>
        }
        
        <Hint title='创建流动性同时买入请保证买入钱包有足够的买入金额，避免买入失败，同时买入最多设置 4 个地址。'/>
        <Hint title='当创建流动性至Raydium时，Raydium官方将收取0.4 SOL的手续费。为确保操作成功，请确保账户中预留至少0.5 SOL，以避免因余额不足导致添加流动性失败。' showClose />

        <div className='btn'>
          <div className='buttonSwapper mt-4'>
            <Button className={Button_Style} onClick={createClick} loading={isCreate}>创建</Button>
          </div>
          <div className='fee'>全网最低服务费: {vipConfig.isVip ? 0 : CREATE_POOL_FEE} SOL</div>
        </div>

        <Result tokenAddress={poolAddr} signature={signature} error={error} />
      </CreatePool>

    </>
  )
}

export default CreateLiquidity