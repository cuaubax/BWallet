import { useAccount, useChainId } from 'wagmi'
import { useEffect, useState } from 'react'
import { getAlchemyClient } from '../config/alchemy'
import { AssetTransfersWithMetadataResult, AssetTransfersCategory } from 'alchemy-sdk'

// Reading ranbow-kit docs it seems like we might be able to get
// transaction history straight from it, no need for alchemy

// TODO: Might need modify this based on
// the selected chain, keeping external,
// ERC20 and ERC721 for testing purposes atm
const CATEGORIES = [
    AssetTransfersCategory.EXTERNAL,
    AssetTransfersCategory.ERC20,
    AssetTransfersCategory.ERC721
  ]

  const chainToExplorerUrl: { [chainId: number]: string } = {
    11155111: "https://sepolia.etherscan.io/tx/{hash}",
    11155420: "https://sepolia.optimistic.etherscan.io/tx/{hash}",
    421614: "https://sepolia.arbiscan.io/tx/{hash}",
    80002: "https://amoy.polygonscan.com/tx/{hash}",
  }
  
  function getTxUrl(chainId: number, txHash: string): string {
    const urlTemplate = chainToExplorerUrl[chainId];
    return urlTemplate ? urlTemplate.replace("{hash}", txHash) : "";
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
        const sent = await alchemy.core.getAssetTransfers({
          fromBlock: "0x0",
          fromAddress: address,
          category: CATEGORIES,
          withMetadata: true,
          maxCount: 5
        })

        // Get received transactions
        const received = await alchemy.core.getAssetTransfers({
          fromBlock: "0x0",
          toAddress: address,
          category: CATEGORIES,
          withMetadata: true,
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

  const TransactionCardSend = ({ tx }: { tx: AssetTransfersWithMetadataResult }) => (
    <div className="bg-white rounded-lg shadow p-4 mb-4">
      <div className="flex justify-between items-center mb-2">
        <span className="font-mono text-sm">
          <a href={getTxUrl(chainId,tx.hash)} target="_blank" rel="noopener noreferrer">
          {tx.hash?.slice(0, 10)}...
          </a>
        </span>
        <span className="text-gray-600 text-sm">
          {new Date(tx.metadata.blockTimestamp).toLocaleString()}
        </span>
      </div>
      <div className="text-sm">
        <p className="truncate">
          <span className="text-gray-600">Para: </span>
          {tx.to?.slice(0, 6)}...{tx.to?.slice(-4)}
        </p>
        <p>
          <span className="text-gray-600">Monto: </span>
          {tx.value} {tx.asset}
        </p>
      </div>
    </div>
  )

  const TransactionCard = ({ tx }: { tx: AssetTransfersWithMetadataResult }) => (
    <div className="bg-white rounded-lg shadow p-4 mb-4">
      <div className="flex justify-between items-center mb-2">
        <span className="font-mono text-sm">
        <a href={getTxUrl(chainId,tx.hash)} target="_blank" rel="noopener noreferrer">
          {tx.hash?.slice(0, 10)}...
        </a>
        </span>
        <span className="text-gray-600 text-sm">
          {new Date(tx.metadata.blockTimestamp).toLocaleString()}
        </span>
      </div>
      <div className="text-sm">
        <p className="truncate">
          <span className="text-gray-600">Desde: </span>
          {tx.from?.slice(0, 6)}...{tx.to?.slice(-4)}
        </p>
        <p>
          <span className="text-gray-600">Monto: </span>
          {tx.value} {tx.asset}
        </p>
      </div>
    </div>
  )

  if (!mounted || !isConnected) return null

  return (
    <div className="bg-gray-50 rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-6">Historial de Transferencias</h2>
      
      {loading ? (
        <div className="text-center py-4">Cargando...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sent Transactions */}
          <div>
            <h3 className="text-lg font-medium mb-4 text-red-600">Enviadas</h3>
            <div>
              {sentTxs.length > 0 ? (
                sentTxs.map((tx) => (
                  <TransactionCardSend key={tx.uniqueId} tx={tx} />
                ))
              ) : (
                <p className="text-gray-500 text-center">No hay transacciones enviadas</p>
              )}
            </div>
          </div>

          {/* Received Transactions */}
          <div>
            <h3 className="text-lg font-medium mb-4 text-green-600">Recibidas</h3>
            <div>
              {receivedTxs.length > 0 ? (
                receivedTxs.map((tx) => (
                  <TransactionCard key={tx.uniqueId} tx={tx} />
                ))
              ) : (
                <p className="text-gray-500 text-center">No hay transacciones recibidas</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}