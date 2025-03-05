import { useAccount, useBalance, useChainId, useReadContracts, type UseReadContractsReturnType } from 'wagmi'
import { useEffect, useState } from 'react'
import { Address, erc20Abi } from 'viem'
import { formatUnits } from 'ethers'

const chainToExplorerUrl: { [chainId: number]: string } = {
  137: "https://polygonscan.com/address/{address}",
  42161: "https://arbiscan.io/address/{address}",
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

    const { data: balanceData, refetch} = useReadContracts({
      contracts: [
        {
          // Hard coded USDC arbitrum address
          address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
          abi: erc20Abi,
          functionName: "balanceOf",
          chainId: 42161,
          args: [address as Address]
        },
        {
          // Hard coded arbitrum MEXA address
          address: '0xDF617aA28bbdC3F1004291e1dEC24c617A4AE3aD',
          abi: erc20Abi,
          functionName: "balanceOf",
          chainId: 42161,
          args: [address as Address]
        }
      ]
    })
  
    // Prevent hydration errors by only rendering after mount
    useEffect(() => {
      setMounted(true)
    }, [])

    useEffect(() => {
      if (!balanceData) {
        refetch()
        return
      }
      
      const rawBalanceUSDC = balanceData[0]?.result;
      const rawBalanceWETH = balanceData[1]?.result;
      
      if (rawBalanceUSDC != null && rawBalanceWETH != null) {
        // Hardcoded both decimal places
        setBalanceUSDC(formatUnits(rawBalanceUSDC, 6));
        setBalanceWETH(formatUnits(rawBalanceWETH, 6));
      }
    }, [balanceData, refetch]);
  
    if (!mounted) return null
    if (!isConnected) return null
  
    return (
      <div className="bg-white shadow-xl rounded-xl p-8 mb-8">
        {/* Header with title and wallet link */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Saldos 
           (<a
            href={walletURL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-blue-600 hover:underline"
          >
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </a>)
          </h2>
        </div>
  
        <div className="space-y-4">
          {/* Native Token (e.g., MATIC for Polygon) */}
          <div className="bg-gray-100 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img
                src="https://cryptologos.cc/logos/polygon-matic-logo.png?v=013"
                alt="MATIC"
                className="h-8 w-8"
              />
              <span className="font-semibold">MATIC</span>
            </div>
            <span className="font-bold text-lg">
              {balance?.formatted} {balance?.symbol}
            </span>
          </div>
  
          {/* USDC */}
          <div className="bg-gray-100 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img
                src="https://cryptologos.cc/logos/usd-coin-usdc-logo.png?v=013"
                alt="USDC"
                className="h-8 w-8"
              />
              <span className="font-semibold">USDC</span>
            </div>
            <span className="font-bold text-lg">
              {balanceUSDC ? balanceUSDC : '—'} USDC
            </span>
          </div>
  
          {/* WETH */}
          <div className="bg-gray-100 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img
                src="https://cryptologos.cc/logos/weth-logo.svg?v=013"
                alt="WETH"
                className="h-8 w-8"
              />
              <span className="font-semibold">WETH</span>
            </div>
            <span className="font-bold text-lg">
              {balanceWETH ? balanceWETH : '—'} WETH
            </span>
          </div>
        </div>
      </div>
    )
  }
  