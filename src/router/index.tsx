import { useRoutes, Navigate } from "react-router-dom"
import Home from '@/views/Home'
import CreateToken from '@/views/Token/CreateToken'
import Update from '@/views/Token/Update'
import RevokeAuthority from '@/views/Token/RevokeAuthority'
import BurnToken from '@/views/Token/Burn'
import FreezeAccount from '@/views/Token/FreezeAccount'
import MintToken from '@/views/Token/MintToken'
import CloseAccount from '@/views/CloseAccount'
import BatchClose from '@/views/CloseAccount/BatchClose'
import CreateBuy from '@/views/Pump/CreateBuy'
import NotFound from '@/views/NotFound'
import Multisend from "@/views/Tool/Multisend"
import Collector from '@/views/Tool/Collector'
import CreateWallet from "@/views/Tool/CreateWallet"
import App from '@/views/App'
import UnfreezeAccount from '@/views/Token/UnFreezeAccount'
import SwapBot from '@/views/SwapBot'
import CreateID from '@/views/Raydium/CreateID'
import CreateLiquidity from '@/views/Raydium/CreateLiquidity'
import CreateLiquidityAndBuy from '@/views/Raydium/CreateLiquidityAndBuy'
import RemoveLiquidity from '@/views/Raydium/RemoveLiquidity'
import Snapshot from '@/views/Snapshot'
import Meteora from '@/views/Meteora/Pool'
import MeteoraSwap from '@/views/Meteora/Swap'

const Routers = () => {
  const router = useRoutes([
    {
      path: '/', element: <Home />,
      children: [
        { path: '/', element: <App /> },
        // { index: true, element: <Navigate to='token/create' /> },
        { path: '/404', element: <NotFound /> },
        { path: '*', element: <Navigate to="/404" replace /> },
        { path: '/swapbot', element: <SwapBot />, },
        { path: '/snapshot', element: <Snapshot />, },
        { path: "createwallet", element: <CreateWallet /> },

      ]
    },
    {
      path: '/token',
      element: <Home />,
      children: [
        { index: true, element: <Navigate to='create' /> },
        { path: "create", element: <CreateToken /> },
        { path: "clone", element: <CreateToken /> },
        { path: "update", element: <Update /> },
        { path: "revokeAuthority", element: <RevokeAuthority /> },
        { path: "burn", element: <BurnToken /> },
        { path: "freezeAccount", element: <FreezeAccount /> },
        { path: "unfreezeAccount", element: <UnfreezeAccount /> },
        { path: "mint", element: <MintToken /> },
      ]
    },
    {
      path: '/raydium',
      element: <Home />,
      children: [
        { index: true, element: <Navigate to='createId' /> },
        { path: "createId", element: <CreateID /> },
        { path: "createLiquidity", element: <CreateLiquidity /> },
        { path: "removeLiquidity", element: <RemoveLiquidity /> },
        { path: "createLiquidityandbuy", element: <CreateLiquidityAndBuy /> },
      ]
    },
    {
      path: '/pump',
      element: <Home />,
      children: [
        { index: true, element: <Navigate to='create' /> },
        { path: "create", element: <CreateBuy /> },
        { path: "clone", element: <CreateBuy /> },
        { path: 'swapbot', element: <SwapBot />, },
      ]
    },
    {
      path: '/meteora',
      element: <Home />,
      children: [
        { index: true, element: <Navigate to='pool' /> },
        { path: "pool", element: <Meteora /> },
        { path: "swap", element: <MeteoraSwap /> },
      ]
    },
    {
      path: '/tool',
      element: <Home />,
      children: [
        { index: true, element: <Navigate to='multisend' /> },
        { path: "multisend", element: <Multisend /> },
        { path: "collector", element: <Collector /> },

      ]
    },
    {
      path: '/close',
      element: <Home />,
      children: [
        { path: "account", element: <CloseAccount /> },
        { path: "batch", element: <BatchClose /> },
      ]
    },
  ])

  return router
}

export default Routers