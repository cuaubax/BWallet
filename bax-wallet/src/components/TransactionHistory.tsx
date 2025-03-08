import { useAccount, useChainId } from 'wagmi'
import { useEffect, useState } from 'react'
import { getAlchemyClient } from '../config/alchemy'
import { AssetTransfersWithMetadataResult, AssetTransfersCategory, SortingOrder } from 'alchemy-sdk'

// Reading ranbow-kit docs it seems like we might be able to get
// transaction history straight from it, no need for alchemy

// TODO: Might need modify this based on
// the selected chain, keeping external,
// ERC20 and ERC721 for testing purposes atm
// probaly move this to config
const CATEGORIES = [
    AssetTransfersCategory.EXTERNAL,
    AssetTransfersCategory.ERC20,
    AssetTransfersCategory.ERC721
  ]

const chainToExplorerUrl: { [chainId: number]: string } = {
    137: "https://polygonscan.com/tx/{hash}",
    42161: "https://arbiscan.io/tx/{hash}",
    11155111: "https://sepolia.etherscan.io/tx/{hash}",
    11155420: "https://sepolia.optimistic.etherscan.io/tx/{hash}",
    421614: "https://sepolia.arbiscan.io/tx/{hash}",
    80002: "https://amoy.polygonscan.com/tx/{hash}",
}

const chainToExplorerUrlAddress: { [chainId: number]: string } = {
  137: "https://polygonscan.com/address/{address}",
  42161: "https://arbiscan.io/address/{address}",
  11155111: "https://sepolia.etherscan.io/address/{address}",
  11155420: "https://sepolia.optimistic.etherscan.io/address/{address}",
  421614: "https://sepolia.arbiscan.io/address/{address}",
  80002: "https://amoy.polygonscan.com/address/{address}",
}
  
function getTxUrl(chainId: number, txHash: string): string {
    const urlTemplate = chainToExplorerUrl[chainId];
    return urlTemplate ? urlTemplate.replace("{hash}", txHash) : ""
}

function getExplorerUrlAddress(chainId: number, walletAddress: string): string {
  const urlTemplate = chainToExplorerUrlAddress[chainId];
  return urlTemplate ? urlTemplate.replace("{address}", walletAddress) : ""
}

interface TransactionWithType extends AssetTransfersWithMetadataResult {
  type: 'sent' | 'received'
}

export const TransactionHistory = () => {
  const [mounted, setMounted] = useState(false)
  const [sentTxs, setSentTxs] = useState<AssetTransfersWithMetadataResult[]>([])
  const [receivedTxs, setReceivedTxs] = useState<AssetTransfersWithMetadataResult[]>([])
  const [loading, setLoading] = useState(false)
  const { address, isConnected } = useAccount()
  const [allTransactions, setAllTransactions] = useState<TransactionWithType[]>([])
  const chainId = useChainId()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!address || !chainId) return
      
      setLoading(true)
      try {
        const alchemy = getAlchemyClient(chainId)
        
        // Get sent transactions
        // Invert sorting order
        const sent = await alchemy.core.getAssetTransfers({
          fromBlock: "0x0",
          fromAddress: address,
          category: CATEGORIES,
          withMetadata: true,
          order: SortingOrder.DESCENDING,
          maxCount: 5
        })

        // Get received transactions
        const received = await alchemy.core.getAssetTransfers({
          fromBlock: "0x0",
          toAddress: address,
          category: CATEGORIES,
          withMetadata: true,
          order: SortingOrder.DESCENDING,
          maxCount: 5
        })

        const sentWithType = sent.transfers.map(tx => ({ ...tx, type: 'sent' as const }))
        const receivedWithType = received.transfers.map(tx => ({ ...tx, type: 'received' as const }))

        const combined = [...sentWithType, ...receivedWithType].sort((a, b) => {
          return new Date(b.metadata.blockTimestamp).getTime() - new Date(a.metadata.blockTimestamp).getTime()
        })

        setAllTransactions(combined.slice(0, 15))
      } catch (error) {
        console.error('Error fetching transactions:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [address, chainId])

  if (!mounted || !isConnected) return null

  return (
    <div className="bg-sectionBackground rounded-xl p-5 shadow-sm border">
      <h2 className="text-xl font-semibold mb-6">Historial de Transacciones</h2>
      
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <svg className="animate-spin h-8 w-8 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="ml-2 text-gray-500">Cargando transacciones...</span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-gray-200">
                <th className="pb-3 text-xs text-gray-500 font-medium">Tipo</th>
                <th className="pb-3 text-xs text-gray-500 font-medium">Dirección</th>
                <th className="pb-3 text-xs text-gray-500 font-medium text-center">Monto</th>
                <th className="pb-3 text-xs text-gray-500 font-medium text-center">Token</th>
                <th className="pb-3 text-xs text-gray-500 font-medium text-center">Tx Hash</th>
                <th className="pb-3 text-xs text-gray-500 font-medium text-right">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {allTransactions.length > 0 ? (
                allTransactions.map((tx) => (
                  <tr key={tx.uniqueId} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                    <td className="py-4">
                      {tx.type === 'sent' ? (
                        <div className="flex items-center space-x-2">
                          <img src="/icons/Send.svg" alt="Enviada" className="h-5 w-5" />
                          <span className="text-sm font-medium">Enviada</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <img src="/icons/Receive.svg" alt="Recibida" className="h-5 w-5" />
                          <span className="text-sm font-medium">Recibida</span>
                        </div>
                      )}
                    </td>
                    <td className="py-4">
                      <a 
                        href={tx.type === 'sent' 
                          ? getExplorerUrlAddress(chainId, tx.to || '') 
                          : getExplorerUrlAddress(chainId, tx.from || '')
                        } 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm hover:underline"
                      >
                        {tx.type === 'sent' 
                          ? (tx.to ? `${tx.to.slice(0, 6)}...${tx.to.slice(-4)}` : '')
                          : (tx.from ? `${tx.from.slice(0, 6)}...${tx.from.slice(-4)}` : '')
                        }
                      </a>
                    </td>
                    <td className="py-4 text-center text-sm font-medium">{tx.value}</td>
                    <td className="py-4 text-center text-sm">{tx.asset}</td>
                    <td className="py-4 text-center">
                      <a 
                        href={getTxUrl(chainId, tx.hash)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-gray-600 hover:text-black hover:underline"
                      >
                        {tx.hash?.slice(0, 10)}...
                      </a>
                    </td>
                    <td className="py-4 text-right text-sm text-gray-600">
                      {new Date(tx.metadata.blockTimestamp).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-gray-500 text-center py-8">
                    No hay transacciones para mostrar
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}