import { WalletConnect } from './WalletConnect'
import { TransactionHistory } from './TransactionHistory'
import { SwapWidget } from './SwapWidget'
import { AaveComponent } from './EarnWidget'
import { BatchTransfer } from './Dispersions'
import { WalletBalance } from './WalletBalance'

import { useState } from 'react'

const tabs = [
  { id: 'transactions', label: 'Historial', icon: "/icons/Vector.svg" },
  { id: 'dispersions', label: 'Dispersiones', icon: "/icons/Payments.svg" },
  { id: 'swap', label: 'Cambios', icon: "/icons/SwapVertical.svg" },
  { id: 'earn', label: 'Ahorro', icon: "/icons/Wallet.svg" },
] as const

export const Layout = () => {
  const [activeTab, setActiveTab] = useState<typeof tabs[number]['id']>('transactions')

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r p-6">
        <div className="flex flex-col space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold">BaxB Wallet</span>
          </div>
          <nav className="flex flex-col space-y-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors
                  ${activeTab === tab.id 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
              >
                <img src={tab.icon} alt={tab.label} className="h-6 w-6 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Area */}
      <main className="flex-1 p-8 bg-white">
        <div className="flex justify-end mb-4">
          <WalletConnect />
        </div>
        <div className="top-0 bg-gray-50 z-10">
          <WalletBalance />
        </div>
        {activeTab === 'transactions' && <TransactionHistory />}
        {activeTab === 'dispersions' && <BatchTransfer />}
        {activeTab === 'swap' && <SwapWidget />}
        {activeTab === 'earn' && <AaveComponent />}
      </main>
    </div>
  )
}