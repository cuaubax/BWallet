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
          <span className="text-gray-600">De: </span>
          {tx.from?.slice(0, 6)}...{tx.to?.slice(-4)}
        </p>
        <p>
          <span className="text-gray-600">Monto: </span>
          {tx.value} {tx.asset}
        </p>
      </div>
    </div>
  )

  const TransactionRow = ({
    tx,
    type,
  }: {
    tx: AssetTransfersWithMetadataResult;
    type: 'sent' | 'received';
  }) => (
    <div className="flex items-center py-2 border-b last:border-0">
      {/* To/From */}
      <div className="flex-1 text-sm font-medium text-gray-700">
        {type === 'sent' ? 'Para:' : 'Desde:'}{' '}
        {type === 'sent'
          ? tx.to ? `${tx.to.slice(0, 6)}...${tx.to.slice(-4)}` : ''
          : tx.from ? `${tx.from.slice(0, 6)}...${tx.from.slice(-4)}` : ''}
      </div>
      {/* Amount */}
      <div className="flex-1 text-sm text-gray-700 text-center">
        {tx.value}
      </div>
      {/* Token */}
      <div className="flex-1 text-sm text-gray-700 text-center">
        {tx.asset}
      </div>
      {/* Tx Hash */}
      <div className="flex-1 text-sm text-gray-700 text-center">
        {tx.hash ? `${tx.hash.slice(0, 10)}...` : ''}
      </div>
      {/* Date */}
      <div className="flex-1 text-sm text-gray-700 text-right">
        {new Date(tx.metadata.blockTimestamp).toLocaleString()}
      </div>
    </div>
  );
  

  if (!mounted || !isConnected) return null

  return (
    <div className="bg-gray-50 rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-6">Historial de Transferencias</h2>
      {loading ? (
        <div className="text-center py-4">Cargando...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sent Transactions Column */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-black flex items-center space-x-2">
              <img src="/icons/Send.svg" alt="Enviadas" className="h-6 w-6" />
              <span>Enviadas</span>
            </h3>
            <div>
              {sentTxs.length > 0 ? (
                sentTxs.map((tx) => (
                  <TransactionRow key={tx.uniqueId} tx={tx} type="sent" />
                ))
              ) : (
                <p className="text-gray-500 text-center">No hay transacciones enviadas</p>
              )}
            </div>
          </div>
  
          {/* Received Transactions Column */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-black flex items-center space-x-2">
              <img src="/icons/Receive.svg" alt="Recibidas" className="h-6 w-6" />
              <span>Recibidas</span>
            </h3>
            <div>
              {receivedTxs.length > 0 ? (
                receivedTxs.map((tx) => (
                  <TransactionRow key={tx.uniqueId} tx={tx} type="received" />
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