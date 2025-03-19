import axios from 'axios';
import { useState, useEffect } from 'react'

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
  const [selectedCard, setSelectedCard] = useState<CardData | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

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
      const data = await axios.get("/api/moonproxy?path=card&page=1&limit=10")

      const cardApiResponse: CardApiResponse = data.data
      console.log(cardApiResponse.cards)
      
      // Just use the cards data directly from the API response
      setCards(cardApiResponse.cards)
    } catch (err) {
      console.error('Error fetching cards:', err)
      setError('Error al cargar las tarjetas. Por favor, intente de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  const openCardModal = (card: CardData) => {
    setSelectedCard(card)
    setIsModalOpen(true)
  }

  const closeCardModal = () => {
    setIsModalOpen(false)
    setSelectedCard(null)
  }

  const formatPan = (pan: string) => {
    return '••••' + pan.slice(-4)
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

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Cards Tab Content */}
      {activeTab === 'cards' && !isLoading && !error && (
        <div className="mt-6">
          {/* Table Header */}
          <div className="grid grid-cols-5 py-4 border-b border-gray-200">
            <div className="text-sm font-medium text-gray-500">
                Tarjeta
            </div>
            <div className="text-sm font-medium text-gray-500">
              Balance disponible
            </div>
            <div className="text-sm font-medium text-gray-500">
              Válida hasta
            </div>
            <div className="text-sm font-medium text-gray-500">
              CVV
            </div>
            <div className="text-sm font-medium text-gray-500">
              Estado
            </div>
          </div>

          {/* Card List */}
          {cards.length > 0 ? (
            cards.map(card => (
              <div 
                key={card.id} 
                className="grid grid-cols-5 py-6 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                onClick={() => openCardModal(card)}
              >
                <div>
                  <div className="font-medium">{formatPan(card.pan)}</div>
                  <div className="text-sm text-gray-500">Virtual</div>
                </div>
                <div className="flex items-center font-medium">
                  ${card.available_balance} USD
                </div>
                <div className="flex items-center font-medium">
                  {card.display_expiration}
                </div>
                <div className="flex items-center font-medium">
                  {card.cvv}
                </div>
                <div className="flex items-center">
                  <span className={`px-2 py-1 text-sm font-medium rounded-full ${
                    card.frozen === 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {card.frozen === 0 ? 'Activa' : 'Congelada'}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-gray-500">
              No hay tarjetas disponibles.
            </div>
          )}

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

      {/* Card Detail Modal */}
      {isModalOpen && selectedCard && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50" 
            onClick={closeCardModal}
          ></div>
          
          {/* Modal Content */}
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-auto z-10 relative">
            <button 
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              onClick={closeCardModal}
            >
              ✕
            </button>
            
            <h2 className="text-xl font-bold mb-4">Detalle de tarjeta</h2>
            
            <div className="bg-black rounded-xl p-6 text-white shadow-lg mb-6">
              <div className="flex justify-between items-start mb-8">
                <div className="text-sm uppercase tracking-wider opacity-80">Tarjeta Virtual</div>
                <div className="text-xl font-bold">VISA</div>
              </div>
              
              <div className="mb-6 text-xl tracking-widest font-mono">
                {selectedCard.pan.replace(/(\d{4})/g, '$1 ').trim()}
              </div>
              
              <div className="flex justify-between items-end">
                <div>
                  <div className="text-xs opacity-80 mb-1">Válida Hasta</div>
                  <div>{selectedCard.display_expiration}</div>
                </div>
                <div>
                  <div className="text-xs opacity-80 mb-1">CVV</div>
                  <div>{selectedCard.cvv}</div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              
              <div className="grid grid-cols-2 gap-2">
                <div className="text-gray-500">Disponible:</div>
                <div className="font-medium">${selectedCard.available_balance} USD</div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="text-gray-500">Estatus:</div>
                <div className={`font-medium ${selectedCard.frozen === 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {selectedCard.frozen === 0 ? 'Active' : 'Frozen'}
                </div>
              </div>

            </div>
            
            <div className="mt-6 flex space-x-4">
              <button 
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 flex-1"
                onClick={closeCardModal}
              >
                Close
              </button>
              {selectedCard.frozen === 0 ? (
                <button className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 flex-1">
                  Freeze Card
                </button>
              ) : (
                <button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 flex-1">
                  Unfreeze Card
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}