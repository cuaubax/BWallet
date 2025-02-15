import { Network, Alchemy } from 'alchemy-sdk'

const ALCHEMY_KEY = 'ukCG96TR8vQVctT9fTyVFZZ6PXm5iOa-'

const chainToAlchemyNetwork: { [chainId: number]: Network } = {
  11155111: Network.ETH_SEPOLIA,
  11155420: Network.OPT_SEPOLIA,  
  421614: Network.ARB_SEPOLIA,
  80002: Network.MATIC_AMOY,
}

export const getAlchemyConfig = (chainId: number) => ({
  apiKey: ALCHEMY_KEY,
  network: chainToAlchemyNetwork[chainId],
})

export const getAlchemyClient = (chainId: number) => {
  return new Alchemy(getAlchemyConfig(chainId))
}