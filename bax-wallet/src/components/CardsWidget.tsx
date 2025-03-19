import axios from 'axios';
import React, { useState, useEffect } from 'react'

interface CardData {
    id: string;
    balance: string;
    true_balance: string;
    available_balance: string;
    expiration: string;
    display_expiration: string;
    terminated: number;
    card_product_id: string;
    pan: string;
    cvv: string;
    support_token: string;
    frozen: number;
    gift_card_info: Record<string, any>
  }

interface CardApiResponse {
    cards: CardData[];
    pagination: {
      current_page: number;
      from: number;
      last_page: number;
      per_page: number;
      total: number;
    }
  }

// Mock data for demonstration
const mockCards = [
  {
    id: 1,
    name: 'Adobe and Figma Design',
    cardType: 'Virtual',
    cardNumber: '3481',
    monthlySpent: 0,
    limit: 30000,
    status: 'Activa',
  },
  {
    id: 2,
    name: 'Marketing Team',
    cardType: 'Physical',
    cardNumber: '5923',
    monthlySpent: 12500,
    limit: 50000,
    status: 'Activa',
  },
  {
    id: 3,
    name: 'Office Supplies',
    cardType: 'Virtual',
    cardNumber: '7114',
    monthlySpent: 3600,
    limit: 10000,
    status: 'Inactiva',
  }
]

const mockTransactions = [
  {
    id: 1,
    cardId: 1,
    cardName: 'Adobe and Figma Design',
    cardNumber: '3481',
    merchant: 'Adobe Inc.',
    amount: 2400,
    date: '2025-03-15T10:30:00',
    status: 'Completado',
  },
  {
    id: 2,
    cardId: 2,
    cardName: 'Marketing Team',
    cardNumber: '5923',
    merchant: 'Facebook Ads',
    amount: 8500,
    date: '2025-03-14T14:45:00',
    status: 'Completado',
  },
  {
    id: 3,
    cardId: 2,
    cardName: 'Marketing Team',
    cardNumber: '5923',
    merchant: 'Google Ads',
    amount: 4000,
    date: '2025-03-12T09:15:00',
    status: 'Completado',
  },
  {
    id: 4,
    cardId: 3,
    cardName: 'Office Supplies',
    cardNumber: '7114',
    merchant: 'Office Depot',
    amount: 3600,
    date: '2025-03-10T11:20:00',
    status: 'Completado',
  }
]

export const CardsWidget = () => {
  const [activeTab, setActiveTab] = useState('cards')
  const [mounted, setMounted] = useState(false)
  const [cards, setCards] = useState<CardData[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setMounted(true)
    fetchCards()
  }, [])

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    fetchCards()
  }

  const fetchCards = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data: CardApiResponse = await axios.get("/api/moonproxy?path=card&page=1&limit=10")

      console.log(data.data.cards)
      
      // Just use the cards data directly from the API response
      setCards(data.cards);
    } catch (err) {
      console.error('Error fetching cards:', err)
      setError('Error al cargar las tarjetas. Por favor, intente de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!mounted) return null;

  return (
    <div className="w-full">
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          className={`flex items-center px-4 py-4 text-lg font-medium ${
            activeTab === 'cards' 
              ? 'text-black border-b-2 border-black' 
              : 'text-gray-500 hover:text-black'
          }`}
          onClick={() => handleTabChange('cards')}
        >
          Tarjetas
        </button>
        <button
          className={`flex items-center px-4 py-4 text-lg font-medium ${
            activeTab === 'transactions' 
              ? 'text-black border-b-2 border-black' 
              : 'text-gray-500 hover:text-black'
          }`}
          onClick={() => handleTabChange('transactions')}
        >
          Movimientos
        </button>
      </div>

      {/* Cards Tab Content */}
      {activeTab === 'cards' && (
        <div className="mt-6">
          {/* Table Header */}
          <div className="grid grid-cols-4 py-4 border-b border-gray-200">
            <div className="text-sm font-medium text-gray-500">Nombre / Alias</div>
            <div className="text-sm font-medium text-gray-500">
              Consumido en el mes
            </div>
            <div className="text-sm font-medium text-gray-500">
              Límite
            </div>
            <div className="text-sm font-medium text-gray-500">
              Estado
            </div>
          </div>

          {/* Card List */}
          {mockCards.map(card => (
            <div key={card.id} className="grid grid-cols-4 py-6 border-b border-gray-100 hover:bg-gray-50 cursor-pointer">
              <div>
                <div className="font-medium">{card.name}</div>
                <div className="text-sm text-gray-500">
                  {card.cardType} * {card.cardNumber}
                </div>
              </div>
              <div className="flex items-center font-medium">
                ${card.monthlySpent.toLocaleString()} MXN
              </div>
              <div className="flex items-center font-medium">
                ${card.limit.toLocaleString()} / mes
              </div>
              <div className="flex items-center">
                <span className={`px-2 py-1 text-sm font-medium rounded-full ${
                  card.status === 'Activa' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {card.status}
                </span>
              </div>
            </div>
          ))}

          {/* Add Card Button */}
          <div className="mt-6">
            <button className="px-6 py-3 font-medium text-white bg-black rounded-lg hover:bg-gray-800">
              + Nueva Tarjeta
            </button>
          </div>
        </div>
      )}

      {/* Transactions Tab Content */}
      {activeTab === 'transactions' && (
        <div className="mt-6">
          {/* Table Header */}
          <div className="grid grid-cols-5 py-4 border-b border-gray-200">
            <div className="text-sm font-medium text-gray-500">Tarjeta</div>
            <div className="text-sm font-medium text-gray-500">Comercio</div>
            <div className="text-sm font-medium text-gray-500">
              Monto
            </div>
            <div className="text-sm font-medium text-gray-500">
              Fecha
            </div>
            <div className="text-sm font-medium text-gray-500">
              Estado
            </div>
          </div>

          {/* Transaction List */}
          {mockTransactions.map(transaction => (
            <div key={transaction.id} className="grid grid-cols-5 py-6 border-b border-gray-100 hover:bg-gray-50 cursor-pointer">
              <div>
                <div className="font-medium">{transaction.cardName}</div>
                <div className="text-sm text-gray-500">
                  **** {transaction.cardNumber}
                </div>
              </div>
              <div className="flex items-center">
                {transaction.merchant}
              </div>
              <div className="flex items-center font-medium">
                ${transaction.amount.toLocaleString()} MXN
              </div>
              <div className="flex items-center">
                {new Date(transaction.date).toLocaleDateString('es-MX', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </div>
              <div className="flex items-center">
                <span className={`px-2 py-1 text-sm font-medium rounded-full ${
                  transaction.status === 'Completado' ? 'bg-green-100 text-green-800' : 
                  transaction.status === 'Pendiente' ? 'bg-yellow-100 text-yellow-800' : 
                  'bg-red-100 text-red-800'
                }`}>
                  {transaction.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}