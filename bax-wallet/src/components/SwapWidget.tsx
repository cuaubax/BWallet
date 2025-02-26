import { useEffect, useState, useRef } from 'react'
import axios from 'axios'

interface Token {
  symbol: string
  address: string
  decimals: number
}

export const SwapWidget = () => {
  const [mounted, setMounted] = useState(false)
  const [amount, setAmount] = useState('')
  const [quoteAmount, setQuoteAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)


  // All of the following const should be moved to different files

  // Polygon mainnet
  const CHAIN_ID = 137

  const USDC: Token = {
    symbol: 'USDC',
    address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', 
    decimals: 6
  }
  
  const ETH: Token = {
    symbol: 'ETH',
    address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
    decimals: 18
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  const getQuote = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setQuoteAmount('')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const sellAmount = (parseFloat(amount) * (10 ** USDC.decimals)).toString()

      const params = {
        sellToken: USDC.address,
        buyToken: ETH.address,
        sellAmount: sellAmount,
        chainId: CHAIN_ID,
      }

      const response = await axios.get(`/api/swapproxy`, { 
        params,
      })

      const quote = response.data

      const buyAmount = ((parseInt(quote.buyAmount)) / (10 ** ETH.decimals)).toString()

      setQuoteAmount(buyAmount)
      setLoading(false)
    } catch (error) {
      console.error('Error geting qoute:', error)
      setError('Failed to get Price')
      setQuoteAmount('')
      setLoading(false)
    }
  }

  // Waits unitl user is done typing
  useEffect(() => {
    const handler = setTimeout(() => {
      getQuote()
    }, 500)
    
    return () => {
      clearTimeout(handler)
    }
  }, [amount])

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setAmount(value)
  }

  if (!mounted) return null

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Convert USDC to ETH</h2>
      
      {/* USDC Input */}
      <div className="mb-4 border rounded-lg p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-600">From</span>
          <span className="font-medium">{USDC.symbol}</span>
        </div>
        <input
          type="number"
          placeholder="0.0"
          className="w-full text-2xl outline-none"
          value={amount}
          onChange={handleAmountChange}
        />
      </div>
      
      {/* Arrow */}
      <div className="flex justify-center mb-4">
        <div className="bg-gray-100 p-2 rounded-full">⇅</div>
      </div>
      
      {/* ETH Output */}
      <div className="mb-4 border rounded-lg p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-600">To</span>
          <span className="font-medium">{ETH.symbol}</span>
        </div>
        <div className="w-full text-2xl">
          {loading ? 'Loading...' : quoteAmount ? quoteAmount : '0.0'}
        </div>
      </div>
      
      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {/* Exchange Rate (when we have a quote) */}
      {quoteAmount && amount && (
        <div className="mb-4 p-3 bg-gray-50 rounded">
          <div className="flex justify-between">
            <span>Rate</span>
            <span>
              1 {USDC.symbol} = {(parseFloat(quoteAmount) / parseFloat(amount)).toFixed(6)} {ETH.symbol}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}