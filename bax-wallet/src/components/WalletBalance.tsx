import { useAccount, useBalance } from 'wagmi'

export const WalletBalance = () => {
  const { address, isConnected } = useAccount()
  const { data: balance } = useBalance({
    address,
  })

  if (!isConnected) return null

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Wallet Balance</h2>
      <div className="flex justify-between items-center">
        <span className="text-gray-600">Address:</span>
        <span className="font-mono">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
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