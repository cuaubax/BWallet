import { sepolia, optimismSepolia, arbitrumSepolia, polygonAmoy, polygon } from 'viem/chains'
import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { http } from 'wagmi'

export const config = getDefaultConfig({
  appName: 'BaxB Wallet',
  projectId: 'ab7b37eec09f818c882461a21b37b9c1',
  chains: [polygon, sepolia, optimismSepolia, arbitrumSepolia, polygonAmoy],
  transports: {
    [polygon.id]: http(),
    [sepolia.id]: http(),
    [optimismSepolia.id]: http(),
    [arbitrumSepolia.id]: http(),
    [polygonAmoy.id]: http(),
  },
})