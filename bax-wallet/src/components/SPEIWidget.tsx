import React, { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSimulateContract } from 'wagmi'
import { emitter } from '../utils/eventBus'
import { parseUnits, erc20Abi } from 'viem'

const FEE_PERCENTAGE = 0.015
const MEXA = {
  symbol: "MEX",
  // Used USDT address for testing purposes. Using MEXA for deployment
  // address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
  address: '0xDF617aA28bbdC3F1004291e1dEC24c617A4AE3aD',
  decimals: 6,
  logoUrl: "/icons/MEXAS.svg"
}

export const SPEIWidget = () => {
  const [mounted, setMounted] = useState(false)
  const [amount, setAmount] = useState('')
  const [clabe, setClabe] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [mexasTotal, setMexasTotal] = useState('')
  
  const { address } = useAccount()

  const { data: simulateData, error: errorSim } = useSimulateContract({
    address: MEXA.address as `0x${string}`,
    abi: erc20Abi,
    functionName: "transfer",
    args: [address! , BigInt(parseUnits(mexasTotal, MEXA.decimals))],
  })

  const { 
    writeContractAsync,
    data: approvalTxHash,
    error: approvalError,
    isPending,
  } = useWriteContract()

  const { 
    data: approvalReceipt,
    isLoading 
  } = useWaitForTransactionReceipt({
    hash: approvalTxHash
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  const calculateFee = (amount: string): number => {
    const amountValue = parseFloat(amount) || 0
    return (amountValue * FEE_PERCENTAGE)
  }

  const calculateTotal = (amount: string): number => {
    const amountValue = parseFloat(amount) || 0
    const fee = calculateFee(amount)
    return amountValue + fee
  }  

  const validateClabe = (clabeNumber: string): boolean => {
    // CLABE should be 18 digits
    const clabeRegex = /^\d{18}$/
    return clabeRegex.test(clabeNumber)
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Only allow numbers and decimals
    if (/^\d*\.?\d*$/.test(value) || value === '') {
      setAmount(value)
      setError(null)
    }
  }

  const handleClabeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Only allow numbers
    if (/^\d*$/.test(value) || value === '') {
      setClabe(value)
      setError(null)
    }
  }

    useEffect(() => {
        if (approvalReceipt && isProcessing) {
          // Transaction confirmed successfully
          setSuccess('Transferencia SPEI iniciada correctamente')
          setAmount('')
          setClabe('')
          setIsProcessing(false)
          
          // Emit event to update balances
          emitter.emit('balanceUpdated')
        }
      }, [approvalReceipt, isProcessing])

      useEffect(() => {
        if (amount) {
          setMexasTotal(calculateTotal(amount).toString())
        } else {
          setMexasTotal('')
        }
      }, [amount])

  const handleSubmit = async () => {
    // Reset states
    setError(null)
    setSuccess(null)
    
    // Validate inputs
    if (!amount || parseFloat(amount) <= 0) {
      setError('Por favor ingresa un monto válido')
      return
    }
    
    if (!validateClabe(clabe)) {
      setError('La CLABE debe tener 18 dígitos numéricos')
      return
    }
    
    if (!address) {
      setError('Conecta tu wallet primero')
      return
    }
    
    try {
        setIsProcessing(true)

        if(errorSim) {
            setError("eeror al simular")
            console.log(errorSim)
            throw new Error('Error sim')
        }

        if(!simulateData?.request) {
            setError("Error al crear la transaccion")
            throw new Error('No se puede simular la transacción de transferencia de token')
        }

        await writeContractAsync(simulateData.request)

    } catch (err) {
        console.log(err)
      setError('La transferencia SPEI falló')
    } finally {
      setIsProcessing(false)
    }
  }

  if (!mounted) return null

  return (
    <div className="bg-sectionBackground rounded-xl p-5 shadow-sm border border-gray-100">
      {/* Title */}
      <h2 className="text-lg font-medium mb-4">Transferencia SPEI</h2>
      
      {/* Amount Input */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-500 font-medium">Monto</span>
        </div>
        
        <div className="flex items-center bg-itemBackground rounded-xl p-4 border border-transparent focus-within:border-gray-200">
          <input
            type="text"
            placeholder="0.00"
            className="w-full text-2xl font-bold outline-none bg-transparent"
            value={amount}
            onChange={handleAmountChange}
            disabled={isProcessing}
          />
          
          <div className="ml-2 text-sm font-medium text-gray-600">MXN</div>
        </div>
      </div>
      
      {/* CLABE Input */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-500 font-medium">Cuenta CLABE</span>
        </div>
        
        <div className="flex items-center bg-itemBackground rounded-xl p-4 border border-transparent focus-within:border-gray-200">
          <input
            type="text"
            placeholder="18 dígitos"
            className="w-full text-lg font-medium outline-none bg-transparent"
            value={clabe}
            onChange={handleClabeChange}
            maxLength={18}
            disabled={isProcessing}
          />
        </div>
      </div>
      
      {/* Fee display */}
      {amount && parseFloat(amount) > 0 && (
        <div className="mb-5 p-4 bg-itemBackground rounded-xl">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Monto:</span>
            <span className="text-sm font-medium">{parseFloat(amount).toFixed(2)} MXN</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Comisión ({FEE_PERCENTAGE}%):</span>
            <span className="text-sm font-medium">{calculateFee(amount).toFixed(2)} MXN</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-gray-200">
            <span className="text-sm font-medium">Total:</span>
            <span className="text-sm font-bold">{calculateTotal(amount).toFixed(2)} MXN</span>
          </div>
        </div>
      )}
      
      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-gray-50 text-gray-700 rounded-lg text-sm font-medium border border-gray-200">
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        </div>
      )}
      
      {/* Success Display */}
      {success && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm font-medium border border-green-200">
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {success}
          </div>
        </div>
      )}
  
      {/* Submit Button */}
      <button
        className="w-full bg-black text-white py-3.5 px-4 rounded-xl font-medium disabled:bg-gray-200 disabled:text-gray-400 transition-colors"
        onClick={handleSubmit}
        disabled={isProcessing || isPending || isLoading || !amount || !clabe}
      >
        {isPending ? 'Confirmando en wallet...' : 
         isLoading  ? 'Confirmando en blockchain...' : 
         isProcessing ? 'Procesando...' : 'Enviar'}
      </button>

      
      {/* Processing Status */}
    {(isProcessing || isPending || isLoading) && (
        <div className="flex items-center justify-center mt-3 text-xs text-gray-500">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {isPending ? (
                <span>Por favor confirma la transacción en tu wallet...</span>
            ) : isLoading ? (
                <span>Esperando confirmación en la blockchain...</span>
            ) : (
                <span>Procesando tu transferencia SPEI...</span>
            )}
            </div>
        )}
    </div>
  )
}