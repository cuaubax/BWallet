import { useState } from 'react'
import { TransactionHistory } from './TransactionHistory'
import { SwapWidget } from './SwapWidget'

export const TabContent = () => {
  const [activeTab, setActiveTab] = useState<'transactions' | 'swap'>('transactions')

  return (
    <div className="bg-white shadow rounded-lg p-6">
      {/* Tab Navigation */}
      <div className="flex space-x-4 mb-6 border-b">
        <button
          className={`pb-2 px-4 ${
            activeTab === 'transactions'
              ? 'border-b-2 border-blue-500 text-blue-500'
              : 'text-gray-500'
          }`}
          onClick={() => setActiveTab('transactions')}
        >
          Transactions
        </button>
        <button
          className={`pb-2 px-4 ${
            activeTab === 'swap'
              ? 'border-b-2 border-blue-500 text-blue-500'
              : 'text-gray-500'
          }`}
          onClick={() => setActiveTab('swap')}
        >
          Swap
        </button>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'transactions' ? (
          <TransactionHistory />
        ) : (
          <SwapWidget />
        )}
      </div>
    </div>
  )
}