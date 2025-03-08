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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
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
        <div className="space-y-4">
          {allTransactions.length > 0 ? (
            allTransactions.map((tx) => (
              <div key={tx.uniqueId} className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors">
                <div className="flex items-start justify-between">
                  {/* Left side - Type and Address */}
                  <div className="flex items-start space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'sent' ? 'bg-gray-200' : 'bg-gray-200'}`}>
                      <img 
                        src={tx.type === 'sent' ? "/icons/Send.svg" : "/icons/Receive.svg"} 
                        alt={tx.type === 'sent' ? "Enviada" : "Recibida"} 
                        className="h-5 w-5" 
                      />
                    </div>
                    <div>
                      <div className="font-medium text-sm">
                        {tx.type === 'sent' ? 'Enviada' : 'Recibida'}
                      </div>
                      <div className="mt-1 text-sm text-gray-500">
                        {tx.type === 'sent' ? 'Para:' : 'De:'} 
                        <a 
                          href={tx.type === 'sent' 
                            ? getExplorerUrlAddress(chainId, tx.to || '') 
                            : getExplorerUrlAddress(chainId, tx.from || '')
                          } 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="ml-1 text-gray-700 hover:text-black hover:underline"
                        >
                          {tx.type === 'sent' 
                            ? (tx.to ? `${tx.to.slice(0, 6)}...${tx.to.slice(-4)}` : '')
                            : (tx.from ? `${tx.from.slice(0, 6)}...${tx.from.slice(-4)}` : '')
                          }
                        </a>
                      </div>
                    </div>
                  </div>
                  
                  {/* Right side - Amount and Token */}
                  <div className="text-right">
                    <div className="font-bold">{tx.value}</div>
                    <div className="text-sm text-gray-500">{tx.asset}</div>
                  </div>
                </div>
                
                {/* Bottom section - Hash and Date */}
                <div className="flex justify-between mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
                  <a 
                    href={getTxUrl(chainId, tx.hash)} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center hover:text-black"
                  >
                    <span>Tx: {tx.hash?.slice(0, 10)}...</span>
                    <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                  <span>{formatDate(tx.metadata.blockTimestamp)}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <svg className="w-12 h-12 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="mt-3 text-gray-500">No hay transacciones para mostrar</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}