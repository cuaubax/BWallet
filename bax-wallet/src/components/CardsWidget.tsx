import axios from 'axios'
import { headers } from 'next/headers'
import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'

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

  interface WalletCards {
    [walletAddress: string]: string[];
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

const STORAGE_KEY = 'wallet-cards'

export const CardsWidget = () => {
  const [activeTab, setActiveTab] = useState('cards')
  const [mounted, setMounted] = useState(false)
  const [cards, setCards] = useState<CardData[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedCard, setSelectedCard] = useState<CardData | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [fundAmount, setFundAmount] = useState<number>(0)
  const [showSensitiveData, setShowSensitiveData] = useState(false)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [invoiceDetails, setInvoiceDetails] = useState<any>(null)
  const { address } = useAccount()

  useEffect(() => {
    setMounted(true)
    fetchCards()
  }, [])

  function userCards(walletAddress: `0x${string}`, cards: CardData[]): CardData[]{
    if (walletAddress) {
      const allCards = localStorage.getItem(STORAGE_KEY)

      if (!allCards) return []
      const parsedCards: WalletCards = JSON.parse(allCards)
      const userCards =  parsedCards[walletAddress] || []
      
      return cards.filter(card => userCards.includes(card.id))

    } else {
      return []
    }
  }

  function saveNewCard(walletAddress:  `0x${string}`, card: CardData) {
    const allCards = localStorage.getItem(STORAGE_KEY)
    const parsedCards: WalletCards = allCards ? JSON.parse(allCards) : {}

    if(!parsedCards[walletAddress]) {
      parsedCards[walletAddress] = []
    }

    parsedCards[walletAddress].push(card.id)

    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsedCards))

  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    //fetchCards()
  }

  const fetchCards = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await axios.get("/api/moonproxy?path=card&page=1&limit=10")

      const cardApiResponse: CardApiResponse = data.data
      
      // Just use the cards data directly from the API response
      const ucards = address? userCards(address, cardApiResponse.cards) : []
      setCards(ucards)
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
    setShowSensitiveData(false)
  }

  const createNewCard = async () => {
    // This is hard coded for now, but must change depending on the product or the card
    const cardProductID = "8f1c611d-098d-4f61-b106-f7b6d344b1ae"
    const newCardURL = `/api/moonproxy?path=card/${cardProductID}`

    try {
        const newCardData = await axios.post(newCardURL,
            {},
            {
                headers: {
                    accept: "application/json",
                    'Content-Type': "application/json"
                }
            }
        )

       fetchCards()

    } catch (err) {
        console.log("Error creating new card:", err)
        setError('Error al crear nueva tarjeta.')
    }
  }

  const addFunds = async (card: CardData, amountUSDC: number) => {

    setIsLoading(true)

    try{
        const invoiceData = await axios.post("/api/moonproxy?path=onchain/invoice",
            {
                creditPurchaseAmount: amountUSDC,
                blockchain: "POLYGON",
                currency: "USDC"
            },
            {
                headers: {
                    accept: "application/json",
                    'Content-Type': "application/json"
                }
            }

        )

        setInvoiceDetails(invoiceData.data)
        setIsConfirmModalOpen(true)
        setIsLoading(false)

    } catch (err) {
        console.error('Error creating invoice:', err)
        setError('Error al crear la factura. Por favor, intente de nuevo.')
        setIsLoading(false)
    }
}

const completePaymentProcess = async () => {
    if (!invoiceDetails || !selectedCard) return

    setIsLoading(true)
    setIsConfirmModalOpen(false)

    try {

        const invoiceURL = `/api/moonproxy?path=onchain/invoice/${invoiceDetails.invoice.id}/simulate-payment`

        const simulatedData = await axios.post(invoiceURL,
            {},
            {
                headers: {
                    accept: "application/json",
                    'Content-Type': "application/json"
                }
            }
        )

        console.log(simulatedData)

        const addBalanceURL = `/api/moonproxy?path=card/${selectedCard.id}/add-balance`
        const addBalanceData = await axios.post(addBalanceURL,
            {
                amount: invoiceDetails.invoice.usdAmountOwed,
            },
            {
                headers: {
                    accept: "application/json",
                    'Content-Type': "application/json"
                }
            }

        )

        console.log(addBalanceData)
        setInvoiceDetails(null)
        await fetchCards()

        if (selectedCard) {
            // Should update the model data right after adding funds
            const updatedCard = cards.find(card => card.id === selectedCard.id);
            if (updatedCard) {
                setSelectedCard(updatedCard)
            }
        }

    } catch (err) {
        console.error('Error adding balance:', err)
        setError('Error al añadir fondos. Por favor, intente de nuevo.')
    } finally {
        setIsLoading(false)
    }
  }

  const cancelPaymentProcess = () => {
    setInvoiceDetails(null)
    setIsConfirmModalOpen(false)
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
          <div className="grid grid-cols-3 py-4 border-b border-gray-200">
            <div className="text-sm font-medium text-gray-500">
                Tarjeta
            </div>
            <div className="text-sm font-medium text-gray-500">
              Balance disponible
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
                className="grid grid-cols-3 py-6 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                onClick={() => openCardModal(card)}
              >
                <div>
                  <div className="font-medium">{formatPan(card.pan)}</div>
                  <div className="text-sm text-gray-500">Virtual Card</div>
                </div>
                <div className="flex items-center font-medium">
                  ${card.available_balance} USD
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
            <button 
            className="px-6 py-3 font-medium text-white bg-black rounded-lg hover:bg-gray-800"
            onClick={createNewCard}>
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
            <div className="bg-black rounded-xl p-6 text-white shadow-lg mb-6">
                <div className="flex justify-between items-start mb-8">
                    <div className="text-sm uppercase tracking-wider opacity-80">Tarjeta Virtual</div>
                    <div className="text-xl font-bold">VISA</div>
                </div>
            
                <div className="mb-6 text-xl tracking-widest font-mono">
                    {showSensitiveData 
                    ? selectedCard.pan.replace(/(\d{4})/g, '$1 ').trim()
                    : "•••• •••• •••• " + selectedCard.pan.slice(-4)}
                </div>
            
                <div className="flex justify-between items-end">
                    <div>
                    <div className="text-xs opacity-80 mb-1">VALIDA HASTA</div>
                    <div>{selectedCard.display_expiration}</div>
                    </div>
                    <div>
                    <div className="text-xs opacity-80 mb-1">CVV</div>
                    <div>{showSensitiveData ? selectedCard.cvv : "•••"}</div>
                    </div>
                </div>
            </div>
                        
            {/* Card Actions */}
            <div className="flex space-x-4 mb-6">
                <button 
                onClick={() => setShowSensitiveData(!showSensitiveData)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 flex-1"
                >
                    {showSensitiveData ? "Ocultar detalles" : "Mostrar detalles"}
                </button>
            
            {selectedCard.frozen === 0 ? (
                <button className="px-4 py-2 bg-white hover:bg-gray-100 text-black rounded-xl flex-1 border border-black">
                    Congelar Tarjeta
                </button>
            ) : (
                <button className="px-4 py-2 bg-white hover:bg-gray-100 text-black rounded-xl flex-1 border border-black">
                    Reactivar Tarjeta
                </button>
            )}
            </div>

            {/* Card Info */}
            <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-2">
                    <div className="text-gray-500">Balance Disponible:</div>
                    <div className="font-medium">${selectedCard.true_balance} USD</div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                    <div className="text-gray-500">Estado:</div>
                    <div className={`font-medium ${selectedCard.frozen === 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedCard.frozen === 0 ? 'Activa' : 'Congelada'}
                    </div>
                </div>
            </div>
            
            {/* Add Funds - Single Line */}
            <div className="mt-6">
                <div className="flex space-x-3">
                    <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Monto a añadir (USD)
                    </label>
                    <input
                        type="number"
                        min="1"
                        step="1"
                        value={fundAmount === 0 ? '' : fundAmount}
                        onChange={(e) => setFundAmount(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="10"
                    />
                    </div>
                    <div className="flex items-end">
                    <button 
                        className="px-6 py-2 bg-black text-white rounded-xl font-medium h-10 disabled:bg-gray-300 disabled:cursor-not-allowed"
                        onClick={() => addFunds(selectedCard, fundAmount)}
                        disabled={isLoading || fundAmount <= 0}
                    >
                        {isLoading ? 'Procesando...' : 'Añadir'}
                    </button>
                    </div>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Confirmation Modal */}
    {isConfirmModalOpen && invoiceDetails && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
            {/* Backdrop */}
            <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={cancelPaymentProcess}
            ></div>
            
            {/* Modal Content */}
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-auto z-10 relative">
            <h3 className="text-xl font-bold mb-4">Confirmar Pago</h3>
            
            <div className="space-y-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-2">
                    <div className="text-gray-600">Monto:</div>
                    <div className="font-medium">${invoiceDetails.invoice.cryptoAmountOwed} {invoiceDetails.invoice.currency}</div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="text-gray-600">Red:</div>
                    <div className="font-medium">{invoiceDetails.invoice.blockchain}</div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="text-gray-600">ID de Factura:</div>
                    <div className="font-medium truncate text-sm">{invoiceDetails.invoice.id}</div>
                </div>
                
                {invoiceDetails.invoice.address && (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="text-gray-600">Dirección:</div>
                    <div className="font-medium truncate text-sm">{invoiceDetails.invoice.address}</div>
                    </div>
                )}
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg text-blue-700 text-sm">
                <p>Da click en "Simular" para completar el proceso</p>
                <p className="mt-1">Cuando el producto esté listo la transferencia se hará directamente en metamask.</p>
                </div>
            </div>
            
            <div className="flex space-x-4">
                <button 
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-xl flex-1"
                onClick={cancelPaymentProcess}
                >
                Cancelar
                </button>
                <button 
                className="px-4 py-2 bg-black text-white rounded-xl flex-1"
                onClick={completePaymentProcess}
                >
                Simular
                </button>
            </div>
            </div>
        </div>
    )}
    </div>
  )
}