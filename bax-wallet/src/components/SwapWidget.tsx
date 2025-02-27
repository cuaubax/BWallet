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
  const [fromToken, setFromToken] = useState<Token | null>(null)
  const [toToken, setToToken] = useState<Token | null>(null)


  // All of the following const should be moved to different files

  // Polygon mainnet
  const CHAIN_ID = 137

  const tokensList: Token[] = [
    {
      symbol: 'USDC',
      address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', 
      decimals: 6
    },

    {
      symbol: 'POL',
      address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      decimals: 18
    },

    // Eventually change this one for MEXAS
    {
      symbol: 'WETH',
      address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
      decimals: 18
    }

  ]

  useEffect(() => {
    setMounted(true)
  }, [])

  const getQuote = async () => {
    if (!amount || parseFloat(amount) <= 0 || !fromToken || !toToken) {
      setQuoteAmount('')

    const usdcToken = tokensList.find(token => token.symbol === 'USDC')
    const polToken = tokensList.find(token => token.symbol === 'POL')
    
    setFromToken(usdcToken || null)
    setToToken(polToken || null)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const sellAmount = (parseFloat(amount) * (10 ** fromToken.decimals)).toString()

      const params = {
        sellToken: fromToken.address,
        buyToken: toToken.address,
        sellAmount: sellAmount,
        chainId: CHAIN_ID,
      }

      const response = await axios.get(`/api/swapproxy`, { 
        params,
      })

      const quote = response.data

      const buyAmount = ((parseInt(quote.buyAmount)) / (10 ** toToken.decimals)).toString()

      setQuoteAmount(buyAmount)
      setLoading(false)
    } catch (error) {
      console.error('Error geting qoute:', error)
      setError('Failed to get Price')
      setQuoteAmount('')
      setLoading(false)
    }
  }

  // Waits unitl user is done typing or making changes
  useEffect(() => {
    const handler = setTimeout(() => {
      getQuote()
    }, 500)
    
    return () => {
      clearTimeout(handler)
    }
  }, [fromToken?.address, toToken?.address, amount])

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setAmount(value)
  }

  const handleFromTokenChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFromToken((prevFromToken) => {
      const selectedToken = tokensList.find(token => token.address === e.target.value)
      // should not happend, but better to have it
      if (!selectedToken) return prevFromToken
  
      // Swap tokens if necessary
      return selectedToken.address === toToken?.address ? toToken : selectedToken
    })
  
    setToToken((prevToToken) => 
      prevToToken?.address === e.target.value ? fromToken : prevToToken
    )
  }
  
  const handleToTokenChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setToToken((prevToToken) => {
      const selectedToken = tokensList.find(token => token.address === e.target.value)
      if (!selectedToken) return prevToToken
  
      return selectedToken.address === fromToken?.address ? fromToken : selectedToken
    })
  
    setFromToken((prevFromToken) => 
      prevFromToken?.address === e.target.value ? toToken : prevFromToken
    )
  }  

  const handleSwapTokens = () => {
    // Swap the from and to tokens
    const tempToken = fromToken
    setFromToken(toToken)
    setToToken(tempToken)
    setQuoteAmount('')
  }

  if (!mounted) return null

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Token Swap</h2>
      
      {/* From Token Input */}
      <div className="mb-4 border rounded-lg p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-600">From</span>
          <select 
            className="bg-gray-100 rounded p-1"
            value={fromToken?.address || ''}
            onChange={handleFromTokenChange}
          >
            {tokensList.map((token) => (
              <option key={`from-${token.address}`} value={token.address}>
                {token.symbol}
              </option>
            ))}
          </select>
        </div>
        <input
          type="number"
          placeholder="0.0"
          className="w-full text-2xl outline-none"
          value={amount}
          onChange={handleAmountChange}
        />
      </div>
      
      {/* Swap Direction Button */}
      <div className="flex justify-center mb-4">
        <button 
          className="bg-gray-100 p-2 rounded-full hover:bg-gray-200"
          onClick={handleSwapTokens}
        >
          ⇅
        </button>
      </div>
      
      {/* To Token Output */}
      <div className="mb-4 border rounded-lg p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-600">To</span>
          <select 
            className="bg-gray-100 rounded p-1"
            value={toToken?.address || ''}
            onChange={handleToTokenChange}
          >
            {tokensList.map((token) => (
              <option key={`to-${token.address}`} value={token.address}>
                {token.symbol}
              </option>
            ))}
          </select>
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
      {quoteAmount && amount && fromToken && toToken && (
        <div className="mb-4 p-3 bg-gray-50 rounded">
          <div className="flex justify-between">
            <span>Rate</span>
            <span>
              1 {fromToken.symbol} = {(parseFloat(quoteAmount) / parseFloat(amount)).toFixed(6)} {toToken.symbol}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}