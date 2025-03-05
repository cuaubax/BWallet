import { useState } from 'react'
import { TransactionHistory } from './TransactionHistory'
import { SwapWidget } from './SwapWidget'
import { AaveComponent } from './EarnWidget'
import { BatchTransfer } from './Dispersions'

const tabs = [
    { id: 'transactions', label: 'Historial', icon: "/icons/Timer.svg" },
    { id: 'dispersions', label: 'Dispersiones', icon: "/icons/Payments.svg" },
    { id: 'swap', label: 'Cambios', icon: "/icons/SwapVertical.svg" },
    { id: 'earn', label: 'Ahorro', icon: "/icons/Wallet.svg" },
  ] as const
  

export const TabContent = () => {
  const [activeTab, setActiveTab] = useState<typeof tabs[number]['id']>('transactions')

  return (
    <div>
      {/* Modern Tab Navigation */}
      <div className="flex space-x-4 border-b mb-4">
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
              <img src={tab.icon} alt={tab.label} className="h-6 w-6"/>
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