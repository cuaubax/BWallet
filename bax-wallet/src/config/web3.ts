// src/config/web3.ts

import { sepolia, optimismGoerli, arbitrumGoerli, polygonMumbai } from 'viem/chains'
import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { http } from 'wagmi'

export const config = getDefaultConfig({
  appName: 'BaxB Wallet',
  projectId: 'ab7b37eec09f818c882461a21b37b9c1', // TODO: get from WalletConnect
  chains: [sepolia, optimismGoerli, arbitrumGoerli, polygonMumbai],
  transports: {
    [sepolia.id]: http(),
    [optimismGoerli.id]: http(),
    [arbitrumGoerli.id]: http(),
    [polygonMumbai.id]: http(),
  },
})