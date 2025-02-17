import { useAccount, useBalance, useChainId } from 'wagmi'
import { useEffect, useState } from 'react'

const chainToExplorerUrl: { [chainId: number]: string } = {
  11155111: "https://sepolia.etherscan.io/address/{address}",
  11155420: "https://sepolia.optimistic.etherscan.io/address/{address}",
  421614: "https://sepolia.arbiscan.io/address/{address}",
  80002: "https://amoy.polygonscan.com/address/{address}",
}

function getExplorerUrl(chainId: number, walletAddress: string): string {
  const urlTemplate = chainToExplorerUrl[chainId];
  return urlTemplate ? urlTemplate.replace("{address}", walletAddress) : "";
}

export const WalletBalance = () => {
    const [mounted, setMounted] = useState(false)
    const { address, isConnected } = useAccount()
    const { data: balance } = useBalance({
      address,
    })
    const chainId = useChainId()

    const walletURL = getExplorerUrl(chainId, address as string)
  
    // Prevent hydration errors by only rendering after mount
    useEffect(() => {
      setMounted(true)
    }, [])
  
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
      </div>
    )
  }
  