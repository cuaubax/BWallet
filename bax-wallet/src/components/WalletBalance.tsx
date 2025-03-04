import { useAccount, useBalance, useChainId, useReadContracts, type UseReadContractsReturnType } from 'wagmi'
import { useEffect, useState } from 'react'
import { Address, erc20Abi } from 'viem'
import { formatUnits } from 'ethers'

const chainToExplorerUrl: { [chainId: number]: string } = {
  137: "https://polygonscan.com/address/{address}",
  11155111: "https://sepolia.etherscan.io/address/{address}",
  11155420: "https://sepolia.optimistic.etherscan.io/address/{address}",
  421614: "https://sepolia.arbiscan.io/address/{address}",
  80002: "https://amoy.polygonscan.com/address/{address}",
}

function getExplorerUrl(chainId: number, walletAddress: string): string {
  const urlTemplate = chainToExplorerUrl[chainId];
  return urlTemplate ? urlTemplate.replace("{address}", walletAddress) : "";
}
interface Token {
  symbol: string
  address: string
  decimals: number
}

const tokensList: Token[] = [
  {
    symbol: 'USDC',
    address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', 
    decimals: 6
  },
  {
    symbol: 'POL',
    address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
    decimals: 18
  },
  {
    symbol: 'WETH',
    address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
    decimals: 18
  }
]

export const WalletBalance = () => {
    const [mounted, setMounted] = useState(false)
    const { address, isConnected } = useAccount()
    const [balanceUSDC, setBalanceUSDC] = useState<string | null>(null)
    const [balanceWETH, setBalanceWETH] = useState<string | null>(null)
    const { data: balance } = useBalance({
      address,
    })
    const chainId = useChainId()

    const walletURL = getExplorerUrl(chainId, address as string)

    const balanceData = useReadContracts({
      contracts: [
        {
          address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
          abi: erc20Abi,
          functionName: "balanceOf",
          chainId: 137,
          args: [address as Address]
        },
        {
          address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
          abi: erc20Abi,
          functionName: "balanceOf",
          chainId: 137,
          args: [address as Address]
        }
      ]
    })
  
    // Prevent hydration errors by only rendering after mount
    useEffect(() => {
      setMounted(true)
    }, [])

    useEffect(() => {
      if(balanceData){
        const balanceTokens: UseReadContractsReturnType = balanceData
        console.log(balanceData.data)
        let rawBalanceUSDC = balanceData.data?.[0].result!
        let rawBalanceWETH = balanceData.data?.[1].result!

        console.log(rawBalanceUSDC)
        console.log(rawBalanceWETH)

        console.log(formatUnits(rawBalanceUSDC,6))
        console.log(formatUnits(rawBalanceWETH,18))

        setBalanceUSDC(formatUnits(rawBalanceUSDC,6))
        setBalanceWETH(formatUnits(rawBalanceWETH,18))
      }
    }, [balanceData])
  
    if (!mounted) return null
    if (!isConnected) return null
  
    return (
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Saldos</h2>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Wallet:</span>
          <span className="font-mono">
            <a href={walletURL} target="_blank" rel="noopener noreferrer">
            {address?.slice(0, 6)}...{address?.slice(-4)}
            </a>
          </span>
        </div>
        <div className="flex justify-between items-center mt-4">
          <span className="text-gray-600">Balance:</span>
          <span className="font-bold">
            {balance?.formatted} {balance?.symbol}
          </span>
        </div>
        <div className="flex justify-between items-center mt-4">
          <span className="text-gray-600">Balance:</span>
          <span className="font-bold">
            {balanceUSDC} USDC
          </span>
        </div>
        <div className="flex justify-between items-center mt-4">
          <span className="text-gray-600">Balance:</span>
          <span className="font-bold">
            {balanceWETH} WETH
          </span>
        </div>
      </div>
    )
  }
  