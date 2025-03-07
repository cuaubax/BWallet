import { useEffect, useState, useRef, useCallback } from 'react'
import axios from 'axios'
import { 
  useWalletClient, 
  useAccount, 
  useReadContract, 
  useWriteContract, 
  useWaitForTransactionReceipt,
  useSimulateContract
} from 'wagmi'
import { concat, numberToHex, size, Address, erc20Abi } from 'viem'
import { emitter } from '../utils/eventBus'

// Constants move to a better file
// Permit2 contract address from 0x, same for all chaing
const PERMIT2_ADDRESS = '0x000000000022D473030F116dDEE9F6B43aC78BA3'
// Max uint256 for now, might be better to handle approvals with smaller amounts. Good for now
const MAX_ALLOWANCE = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')

interface Token {
  symbol: string
  address: string
  decimals: number
  logoUrl: string
}

export const SwapWidget = () => {
  const [mounted, setMounted] = useState(false)
  const [amount, setAmount] = useState('')
  const [quoteAmount, setQuoteAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fromToken, setFromToken] = useState<Token | null>(null)
  const [toToken, setToToken] = useState<Token | null>(null)
  const [isSwapping, setIsSwapping] = useState(false)
  const [quote, setQuote] = useState<any | null>(null)
  const [needsApproval, setNeedsApproval] = useState(false)
  const [waitingForApproval, setWaitingForApproval] = useState(false)
  
  const { data: walletClient } = useWalletClient()
  const { address } = useAccount()

  // Arbitrum mainnet
  const CHAIN_ID = 42161

  const tokensList: Token[] = [
    {
      symbol: 'USDT',
      address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', 
      decimals: 6,
      logoUrl: 'https://cryptologos.cc/logos/tether-usdt-logo.svg?v=040'
    },
    {
      symbol: 'ETH',
      address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      decimals: 18,
      logoUrl: "https://cryptologos.cc/logos/ethereum-eth-logo.png?v=040"
    },
    {
      symbol: 'MEX',
      address: '0xDF617aA28bbdC3F1004291e1dEC24c617A4AE3aD',
      decimals: 6,
      logoUrl: "/icons/MEXAS.svg"
    },
    {
      symbol: 'WBTC',
      address: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f',
      decimals: 8,
      logoUrl: "https://res.coinpaper.com/coinpaper/wrapped_bitcoin_wbtc_logo_5318368b91.svg"
    }
  ]

  // This executes the swap it self, endpoint is different from the
  // one that just checks prices. 
  const executeSwap = useCallback(async () => {
    if (!walletClient || !address || !fromToken || !toToken || !amount) {
      setError('Información faltante para realizar el intercambio')
      setIsSwapping(false)
      return
    }
    
    try {
      const sellAmount = (parseFloat(amount) * (10 ** fromToken.decimals)).toString()
      const params = {
        sellToken: fromToken.address,
        buyToken: toToken.address,
        sellAmount: sellAmount,
        taker: address,
        chainId: CHAIN_ID,
      }
      
      const response = await axios.get(`/api/swapproxy`, { params })
      const swapQuote = response.data

      let txData = swapQuote.transaction.data

      // If the sell token is not native, sign permit
      if (fromToken.address.toLowerCase() !== '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
        const eip712 = swapQuote.permit2.eip712
        // Sign the permit using the wallet client's signTypedData method
        const signature = await walletClient.signTypedData({
          domain: eip712.domain,
          types: eip712.types,
          message: eip712.message,
          primaryType: eip712.primaryType,
        })
        const signatureLengthInHex = numberToHex(size(signature), {
          signed: false,
          size: 32,
        });
        txData = concat([txData, signatureLengthInHex, signature]);
      }

      const tx = {
        to: swapQuote.transaction.to,
        data: txData,
        gas: swapQuote.transaction.gas,
        gasPrice: swapQuote.transaction.gasPrice,
        value: swapQuote.transaction.value,
      }

      const txResponse = await walletClient.sendTransaction(tx)
      console.log('Transaction sent:', txResponse)
      
      
      // Reset form after successful swap
      setTimeout(() => {
        resetSwapState()
        emitter.emit('balanceUpdated')
      }, 3000)
    } catch (error) {
      console.error('Swap failed:', error)
      setError('Falló la transacción')
      setIsSwapping(false)
    } finally {
      setIsSwapping(false)
    }
  }, [walletClient, address, fromToken, toToken, amount, CHAIN_ID]);


  // Following steps are almost an exact copy from the 0x docs
  // 1. Check token allowance for Permit2
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: fromToken?.address as Address,
    abi: erc20Abi,
    functionName: "allowance",
    args: [address as Address, PERMIT2_ADDRESS],
  })

  // 2. Simulate approve transaction
  const { data: simulateData } = useSimulateContract({
    address: fromToken?.address as Address,
    abi: erc20Abi,
    functionName: "approve",
    args: [PERMIT2_ADDRESS, MAX_ALLOWANCE], 
  })

  // 3. Execute the approve transaction
  const { 
    writeContractAsync: approveTokens,
    data: approvalTxHash,
    error: approvalError,
    isPending: isApproving
  } = useWriteContract()

  // 4. Wait for approval transaction to complete
  const { 
    data: approvalReceipt,
    isLoading: isWaitingForApproval 
  } = useWaitForTransactionReceipt({
    hash: approvalTxHash
  })

  // When approval transaction completes, continue with the swap
  useEffect(() => {
    if (approvalReceipt && needsApproval && waitingForApproval) {
      setWaitingForApproval(false)
      refetchAllowance()
      executeSwap()
    }
  }, [approvalReceipt, waitingForApproval, executeSwap, refetchAllowance]);

  // Check if allowance is sufficient whenever it changes
  useEffect(() => {
    if (
      fromToken && 
      fromToken.address.toLowerCase() !== '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' &&
      allowance !== undefined && 
      amount &&
      parseFloat(amount) > 0
    ) {
      const requiredAmount = BigInt(Math.floor(parseFloat(amount) * (10 ** fromToken.decimals)))
      const currentAllowance = allowance ? BigInt(allowance.toString()) : BigInt(0)
      const needsTokenApproval = currentAllowance < requiredAmount
      setNeedsApproval(needsTokenApproval)
    } else {
      setNeedsApproval(false)
    }
  }, [allowance, amount, fromToken])

  useEffect(() => {
    setMounted(true)
    const usdcToken = tokensList.find(token => token.symbol === 'USDT')
    const polToken = tokensList.find(token => token.symbol === 'ETH')
    
    setFromToken(usdcToken || null)
    setToToken(polToken || null)
  }, []);

  const getQuote = async () => {
    if (!amount || parseFloat(amount) <= 0 || !fromToken || !toToken) {
      setQuoteAmount('')
      return
    }

    try {
      setLoading(true)
      setError(null)

    if (fromToken.address.toLowerCase() !== '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
      await refetchAllowance();
    }


      const sellAmount = (parseFloat(amount) * (10 ** fromToken.decimals)).toString()

      const params = {
        sellToken: fromToken.address,
        buyToken: toToken.address,
        sellAmount: sellAmount,
        chainId: CHAIN_ID,
        takerAddress: address
      }

      const response = await axios.get(`/api/priceproxy`, { params })
      const quoteData = response.data

      setQuote(quoteData)
      const buyAmount = ((parseInt(quoteData.buyAmount)) / (10 ** toToken.decimals)).toString()
      setQuoteAmount(buyAmount)
      
    } catch (error) {
      console.error('Error getting quote:', error)
      setError('Error al obtener precio')
      setQuoteAmount('')
      setQuote(null)
    } finally {
      setLoading(false)
    }
  }

  // Waits until user is done typing or making changes
  useEffect(() => {
    const handler = setTimeout(() => {
      getQuote()
    }, 500)
    
    return () => {
      clearTimeout(handler)
    }
  }, [fromToken?.address, toToken?.address, amount, address]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setAmount(value)
  }

  const handleFromTokenChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFromToken((prevFromToken) => {
      const selectedToken = tokensList.find(token => token.address === e.target.value)
      if (!selectedToken) return prevFromToken
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
    const tempToken = fromToken
    setFromToken(toToken)
    setToToken(tempToken)
    setQuoteAmount('')
  }

  const resetSwapState = useCallback(() => {
    setAmount('')
    setQuoteAmount('')
    setQuote(null)
    
    setIsSwapping(false)
    setNeedsApproval(false)
    setWaitingForApproval(false)
    setError(null)

    if (fromToken && 
        fromToken.address.toLowerCase() !== '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
      refetchAllowance()
    }
  }, [fromToken, refetchAllowance]);
  

  const handleSwapButtonClick = async () => {
    if (!amount || parseFloat(amount) <= 0 || !fromToken || !toToken) {
      setError('Por favor selecciona un monto correcto y un token adecuado.')
      return
    }
    
    if (!walletClient || !address) {
      setError('Conecta tu wallet primero.')
      return
    }
    
    try {
      setIsSwapping(true)
      setError(null)
      
      // If selling a non-native token that needs approval, handle approval first
      if (
        fromToken.address.toLowerCase() !== '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' && 
        needsApproval
      ) {
        if (!simulateData || !simulateData.request) {
          throw new Error('Cannot simulate approval transaction')
        }
        
        setWaitingForApproval(true)
        await approveTokens(simulateData.request)

      } else {
        
        await executeSwap()
      }
    } catch (error) {
      console.error('Failed to initiate transaction:', error)
      setError('Error al iniciar la transacción')
      setWaitingForApproval(false)
      setIsSwapping(false)
    }
  }

  const getButtonText = () => {
    if (isApproving || isWaitingForApproval) return 'Aprobando...'
    if (isSwapping) return 'Procesando Swap...'
    if (needsApproval) return 'Aprovar & Swappear'
    return 'Realizar Swap'
  }

  if (!mounted) return null

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm">
      {/* From Token Input */}
      <div className="flex items-center mb-3 bg-gray-50 rounded-lg p-3">
        <input
          type="number"
          placeholder="0.00"
          className="w-2/3 text-xl outline-none bg-transparent"
          value={amount}
          onChange={handleAmountChange}
          disabled={isSwapping || isApproving || isWaitingForApproval}
        />
        
        <div className="relative ml-auto">
          <button
            type="button"
            className="flex items-center bg-gray-100 rounded-lg px-3 py-2 text-sm font-medium"
            onClick={() => {
              // You'll need to implement a dropdown/modal for token selection
              // This is a placeholder for the dropdown trigger
              console.log('Open token selection dropdown/modal')
            }}
            disabled={isSwapping || isApproving || isWaitingForApproval}
          >
            {fromToken && (
              <>
                <img 
                  src={fromToken.logoUrl} 
                  alt={fromToken.symbol} 
                  className="w-6 h-6 mr-2 rounded-full"
                />
                <span>{fromToken.symbol}</span>
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </>
            )}
          </button>
  
          {/* Hidden select for maintaining existing functionality */}
          <select 
            className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
            value={fromToken?.address || ''}
            onChange={handleFromTokenChange}
            disabled={isSwapping || isApproving || isWaitingForApproval}
          >
            {tokensList.map((token) => (
              <option key={`from-${token.address}`} value={token.address}>
                {token.symbol}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Swap Direction Button */}
      <div className="flex justify-center -my-1">
        <button 
          className="bg-gray-100 p-1 rounded-full hover:bg-gray-200 w-8 h-8 flex items-center justify-center"
          onClick={handleSwapTokens}
          disabled={isSwapping || isApproving || isWaitingForApproval}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <polyline points="19 12 12 19 5 12"></polyline>
          </svg>
        </button>
      </div>
      
      {/* To Token Output */}
      <div className="flex items-center mt-2 mb-3 bg-gray-50 rounded-lg p-3">
        <div className="w-2/3 text-xl">
          {loading ? (
            <span className="text-gray-400">Calculando...</span>
          ) : quoteAmount ? (
            quoteAmount
          ) : (
            <span className="text-gray-400">0.00</span>
          )}
        </div>
        
        <div className="relative ml-auto">
          <button
            type="button"
            className="flex items-center bg-gray-100 rounded-lg px-3 py-2 text-sm font-medium"
            onClick={() => {
              // You'll need to implement a dropdown/modal for token selection
              console.log('Open token selection dropdown/modal')
            }}
            disabled={isSwapping || isApproving || isWaitingForApproval}
          >
            {toToken && (
              <>
                <img 
                  src={toToken.logoUrl} 
                  alt={toToken.symbol} 
                  className="w-6 h-6 mr-2 rounded-full" 
                />
                <span>{toToken.symbol}</span>
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </>
            )}
          </button>
  
          {/* Hidden select for maintaining existing functionality */}
          <select 
            className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
            value={toToken?.address || ''}
            onChange={handleToTokenChange}
            disabled={isSwapping || isApproving || isWaitingForApproval}
          >
            {tokensList.map((token) => (
              <option key={`to-${token.address}`} value={token.address}>
                {token.symbol}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Fee display */}
      {quote && (
        <div className="flex justify-between items-center text-xs text-gray-500 mb-3 px-2">
          <span>Incluye comisiones</span>
          <span>Estimado: ~30 segundos</span>
        </div>
      )}
      
      {/* Error Display */}
      {error && (
        <div className="mb-3 p-2 bg-gray-100 text-gray-700 rounded-lg text-sm">
          {error}
        </div>
      )}
  
      {/* Swap Action Button */}
      <button
        className="w-full bg-black text-white py-3 px-4 rounded-lg font-medium disabled:bg-gray-300 disabled:text-gray-500"
        onClick={handleSwapButtonClick}
        disabled={isSwapping || isApproving || isWaitingForApproval || loading || !amount || !quoteAmount}
      >
        {getButtonText()}
      </button>
      
      {/* Transaction Status */}
      {(isApproving || isWaitingForApproval || isSwapping) && (
        <p className="text-xs text-center mt-2 text-gray-500">
          Por favor confirma la transacción en tu wallet...
        </p>
      )}
    </div>
  )
}