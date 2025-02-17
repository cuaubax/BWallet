import { useState } from 'react'
import { TransactionHistory } from './TransactionHistory'
import { SwapWidget } from './SwapWidget'
import { AaveComponent } from './EarnWidget'
import { BatchTransfer } from './Dispersions'

const tabs = [
    { id: 'transactions', label: 'Transferencias', icon: '📊' },
    { id: 'dispersions', label: 'Dispersiones', icon: '📤' },
    { id: 'swap', label: 'Swaps', icon: '🔄' },
    { id: 'earn', label: 'Préstamos', icon: '💰' },
  ] as const
  

export const TabContent = () => {
  const [activeTab, setActiveTab] = useState<typeof tabs[number]['id']>('transactions')

  return (
    <div>
      {/* Modern Tab Navigation */}
      <div className="border-b border-gray-200">
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
                ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'transactions' && <TransactionHistory />}
        {activeTab === 'dispersions' && <BatchTransfer />}
        {activeTab === 'swap' && <SwapWidget />}
        {activeTab === 'earn' && <AaveComponent />}
      </div>
    </div>
  )
}