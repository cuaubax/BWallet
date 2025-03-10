import { useAccount, useBalance, useChainId, useReadContracts } from 'wagmi'
import { useEffect, useState } from 'react'
import { Address, erc20Abi } from 'viem'
import { formatUnits } from 'ethers'
import { emitter } from '../utils/eventBus';

const chainToExplorerUrlAddress: { [chainId: number]: string } = {
  137: "https://polygonscan.com/address/{address}",
  42161: "https://arbiscan.io/address/{address}",
  11155111: "https://sepolia.etherscan.io/address/{address}",
  11155420: "https://sepolia.optimistic.etherscan.io/address/{address}",
  421614: "https://sepolia.arbiscan.io/address/{address}",
  80002: "https://amoy.polygonscan.com/address/{address}",
}

function getExplorerUrl(chainId: number, walletAddress: string): string {
  const urlTemplate = chainToExplorerUrlAddress[chainId];
  return urlTemplate ? urlTemplate.replace("{address}", walletAddress) : "";
}

export const WalletBalance = () => {
    const [mounted, setMounted] = useState(false)
    const { address, isConnected } = useAccount()
    const [balanceUSDC, setBalanceUSDC] = useState<string | null>(null)
    const [balanceWETH, setBalanceWETH] = useState<string | null>(null)
    const [balanceWBTC, setBalanceWBTC] = useState<string | null>(null)
    const { data: balance , refetch: refetchNativeBalance} = useBalance({
      address,
    })
    const chainId = useChainId()

    const walletURL = getExplorerUrl(chainId, address as string)

    const { data: balanceData, refetch} = useReadContracts({
      contracts: [
        {
          // Hard coded USDT arbitrum address
          address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
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
        },
        {
          // hard coded WBTC in arbitrum
          address: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f',
          abi: erc20Abi,
          chainId: 42161,
          functionName: "balanceOf",
          args: [address as Address]
        }
      ]
    })
  
    // Prevent hydration errors by only rendering after mount
    useEffect(() => {
      setMounted(true)
    }, [])

    useEffect(() => {
      const handleBalanceUpdate = () => {
        refetch()
        refetchNativeBalance()
      }
    
      emitter.on('balanceUpdated', handleBalanceUpdate);
      return () => {
        emitter.off('balanceUpdated', handleBalanceUpdate);
      }
    }, [refetch, refetchNativeBalance])

    useEffect(() => {
      if (!balanceData) {
        refetch()
        return
      }
      
      const rawBalanceUSDC = balanceData[0]?.result
      const rawBalanceWETH = balanceData[1]?.result
      const rawBalanceWBTC = balanceData[2]?.result
      
      if (rawBalanceUSDC != null && rawBalanceWETH != null && rawBalanceWBTC != null) {
        // Hardcoded both decimal places
        setBalanceUSDC(formatUnits(rawBalanceUSDC, 6))
        setBalanceWETH(formatUnits(rawBalanceWETH, 6))
        // For WBTC decimals change
        setBalanceWBTC(formatUnits(rawBalanceWBTC,8))
      }
    }, [balanceData, refetch]);
  
    if (!mounted) return null
    if (!isConnected) return null
  
    return (
      <div className="bg-sectionBackground rounded-xl p-5 shadow-sm border border-gray-100 mb-8">
        {/* Header with title and wallet link */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <button
              onClick={() => window.open(walletURL, '_blank')}
              className="text-xl font-semibold flex items-center hover:text-gray-700 transition-colors"
            >
              <span>Balances</span>
              <svg className="w-4 h-4 ml-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </button>
          </div>
          <button
            className="bg-white border border-gray-200 hover:bg-gray-50 text-black font-medium px-4 py-2 rounded-xl shadow-sm flex items-center space-x-2 transition-colors"
            onClick={() => window.open('https://paywithmoon.com/', '_blank')}
          >
            <img
              src="/icons/Card.svg"
              alt=""
              className="h-5 w-5"
            />
            <span>Fondear Tarjeta</span>
          </button>
        </div>
    
        <div className="space-y-3">
          {/* MEXA */}
          <div className="bg-itemBackground rounded-xl p-4 flex items-center justify-between hover:bg-gray-100 transition-colors">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm p-1">
                <img
                  src="/icons/MEXAS.svg"
                  alt="MEXA"
                  className="h-7 w-7"
                />
              </div>
              <span className="font-medium">MEX</span>
            </div>
            <span className="font-bold text-lg">
              {balanceWETH ? balanceWETH: '—'} 
            </span>
          </div>
    
          {/* Native Token (e.g., ETH) */}
          <div className="bg-itemBackground rounded-xl p-4 flex items-center justify-between hover:bg-gray-100 transition-colors">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm p-1">
                <img
                  src="https://cryptologos.cc/logos/ethereum-eth-logo.png?v=040"
                  alt="ETH"
                  className="h-7 w-7"
                />
              </div>
              <span className="font-medium">ETH</span>
            </div>
            <span className="font-bold text-lg">
              {balance?.formatted}
            </span>
          </div>
    
          {/* WBTC */}
          <div className="bg-itemBackground rounded-xl p-4 flex items-center justify-between hover:bg-gray-100 transition-colors">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm p-1">
                <img
                  src="https://res.coinpaper.com/coinpaper/wrapped_bitcoin_wbtc_logo_5318368b91.svg"
                  alt="WBTC"
                  className="h-7 w-7"
                />
              </div>
              <span className="font-medium">WBTC</span>
            </div>
            <span className="font-bold text-lg">
              {balanceWBTC ? balanceWBTC : '—'} 
            </span>
          </div>
    
          {/* USDT */}
          <div className="bg-itemBackground rounded-xl p-4 flex items-center justify-between hover:bg-gray-100 transition-colors">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm p-1">
                <img
                  src="https://cryptologos.cc/logos/tether-usdt-logo.svg?v=040"
                  alt="USDT"
                  className="h-7 w-7"
                />
              </div>
              <span className="font-medium">USDT</span>
            </div>
            <span className="font-bold text-lg">
              {balanceUSDC ? balanceUSDC : '—'}
            </span>
          </div>
        </div>
      </div>
    )
  }
  