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
    return urlTemplate ? urlTemplate.replace("{hash}", txHash) : "";
}

function getExplorerUrlAddress(chainId: number, walletAddress: string): string {
  const urlTemplate = chainToExplorerUrlAddress[chainId];
  return urlTemplate ? urlTemplate.replace("{address}", walletAddress) : "";
}

export const TransactionHistory = () => {
  const [mounted, setMounted] = useState(false)
  const [sentTxs, setSentTxs] = useState<AssetTransfersWithMetadataResult[]>([])
  const [receivedTxs, setReceivedTxs] = useState<AssetTransfersWithMetadataResult[]>([])
  const [loading, setLoading] = useState(false)
  const { address, isConnected } = useAccount()
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

        setSentTxs(sent.transfers)
        setReceivedTxs(received.transfers)
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
    <div className="bg-sectionBackground rounded-lg p-6">
      {loading ? (
    <div className="text-center py-4">Cargando...</div>
  ) : (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Sent (Enviadas) */}
      <div>
        <h3 className="text-lg font-bold mb-4 text-black flex items-center space-x-2">
          <img src="/icons/Send.svg" alt="Enviadas" className="h-6 w-6" />
          <span>Enviadas</span>
        </h3>
        <table className="w-full table-fixed border-separate border-spacing-y-2">
          <thead>
            <tr className="text-left font-bold text-gray-700 border-b">
              <th className="w-24 py-2">Para</th>
              <th className="w-20 py-2 text-center">Monto</th>
              <th className="w-20 py-2 text-center">Token</th>
              <th className="w-32 py-2 text-center">Tx Hash</th>
              <th className="w-32 py-2 text-right">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {sentTxs.length > 0 ? (
              sentTxs.map((tx) => (
                <tr key={tx.uniqueId} className="border-b last:border-0">
                  <td className="py-2">
                  <a href={getExplorerUrlAddress(chainId,tx.to!)} target="_blank" rel="noopener noreferrer">
                    {tx.to
                      ? `${tx.to.slice(0, 6)}...${tx.to.slice(-4)}`
                      : ''}
                  </a>
                  </td>
                  <td className="py-2 text-center">{tx.value}</td>
                  <td className="py-2 text-center">{tx.asset}</td>
                  <td className="py-2 text-center">
                    <a href={getTxUrl(chainId,tx.hash)} target="_blank" rel="noopener noreferrer">
                      {tx.hash?.slice(0, 10)}...
                      </a>
                  </td>
                  <td className="py-2 text-right">
                    {new Date(tx.metadata.blockTimestamp).toLocaleString()}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="text-gray-500 text-center py-4">
                  No hay transacciones enviadas
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Received (Recibidas) */}
      <div>
        <h3 className="text-lg font-bold mb-4 text-black flex items-center space-x-2">
          <img src="/icons/Receive.svg" alt="Recibidas" className="h-6 w-6" />
          <span>Recibidas</span>
        </h3>
        <table className="w-full table-fixed border-separate border-spacing-y-2">
          <thead>
            <tr className="text-left font-bold text-gray-700 border-b">
              <th className="w-24 py-2">Desde</th>
              <th className="w-20 py-2 text-center">Monto</th>
              <th className="w-20 py-2 text-center">Token</th>
              <th className="w-32 py-2 text-center">Tx Hash</th>
              <th className="w-32 py-2 text-right">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {receivedTxs.length > 0 ? (
              receivedTxs.map((tx) => (
                <tr key={tx.uniqueId} className="border-b last:border-0">
                  <td className="py-2">
                  <a href={getExplorerUrlAddress(chainId,tx.from!)} target="_blank" rel="noopener noreferrer">
                    {tx.to
                      ? `${tx.from.slice(0, 6)}...${tx.from.slice(-4)}`
                      : ''}
                  </a>
                  </td>
                  <td className="py-2 text-center">{tx.value}</td>
                  <td className="py-2 text-center">{tx.asset}</td>
                  <td className="py-2 text-center">
                    <a href={getTxUrl(chainId,tx.hash)} target="_blank" rel="noopener noreferrer">
                      {tx.hash?.slice(0, 10)}...
                    </a>
                  </td>
                  <td className="py-2 text-right">
                    {new Date(tx.metadata.blockTimestamp).toLocaleString()}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="text-gray-500 text-center py-4">
                  No hay transacciones recibidas
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )}
    </div>
  )
  
}