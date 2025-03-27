import { WalletConnect } from './WalletConnect'
import { TransactionHistory } from './TransactionHistory'
import { SwapWidget } from './SwapWidget'
import { AaveComponent } from './EarnWidget'
import { BatchTransfer } from './Dispersions'
import { WalletBalance } from './WalletBalance'
import { Contacts } from './ContactsWidget'
import { CardsWidget } from './CardsWidget'
import { SPEIWidget } from './SPEIWidget'
import { ServiciosWidget } from './ServiciosWidget'

import { useState } from 'react'

const tabs = [
  { id: 'transactions', label: 'Historial', icon: "/icons/Vector.svg" },
  { id: 'dispersions', label: 'Dispersiones', icon: "/icons/Payments.svg" },
  { id: 'swap', label: 'Cambios', icon: "/icons/SwapVertical.svg" },
  { id: 'earn', label: 'Ahorro', icon: "/icons/Wallet.svg" },
  { id: 'contacts', label: 'Contactos', icon: "/icons/Contactos.svg" },
  { id: 'cards', label: 'Tarjetas', icon: "/icons/Card.svg" },
  { id: 'spei', label: 'Envíos SPEI', icon: "/icons/SPEI.svg"},
  { id: 'servicios', label: 'Pago de Servicios', icon: "/icons/Servicios.svg"}
] as const

export const Layout = () => {
    const [activeTab, setActiveTab] = useState<typeof tabs[number]['id']>('transactions')

  return (
      <div className="min-h-screen flex bg-gray-50">
	  {/* Sidebar */}
	  <aside className="w-64 bg-sectionBackground shadow-sm border-r border-gray-100 py-6">
	      <div className="flex flex-col h-full">
		  {/* Logo */}
		  <div className="px-6 mb-8">
		      <span className="text-xl font-bold">Mexas Wallet</span>
		  </div>
		  
		  {/* Navigation */}
		  <nav className="bg-sectionBackground flex-1 px-4">
		      <div className="space-y-1">
			  {tabs.map(tab => (
			      <button
				  key={tab.id}
				  onClick={() => setActiveTab(tab.id)}
				  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-150 ease-in-out
              ${activeTab === tab.id 
                ? 'bg-itemBackground text-black  shadow-sm' 
                : 'text-gray-600 hover:bg-gray-50'}`}
			      >
				  <div className={`flex items-center justify-center w-8 h-8 ${activeTab === tab.id ? 'opacity-100' : 'opacity-70'}`}>
				      <img src={tab.icon} alt={tab.label} className="h-5 w-5" />
				  </div>
				  <span className="ml-3">{tab.label}</span>
			      </button>
			  ))}
		      </div>
		  </nav>
		  
		  {/* Optional: Bottom section for additional links/info */}
		  <div className="mt-auto px-6">
		      <div className="pt-4 border-t border-gray-100">
			  <div className="flex items-center text-xs text-gray-500">
			  </div>
		      </div>
		  </div>
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
        {activeTab === 'cards' && <CardsWidget />}
        {activeTab === 'contacts' && <Contacts />}
		{activeTab === 'spei' && <SPEIWidget />}
		{activeTab === 'servicios' && <ServiciosWidget />}
      </main>
    </div>
  )
}
