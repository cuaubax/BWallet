import { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSimulateContract } from 'wagmi'
import { emitter } from '../utils/eventBus'
import { parseUnits, erc20Abi } from 'viem'

export const MEXA = {
    symbol: "MEX",
    // Used USDT address for testing purposes. Using MEXA for deployment
    // address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
    address: '0xDF617aA28bbdC3F1004291e1dEC24c617A4AE3aD',
    decimals: 6,
    logoUrl: "/icons/MEXAS.svg"
  }

interface UseMexaTransactionProps {
    amount: string, 
    recipientAddress: `0x${string}`,
    onSuccess?: () => void, 
    onError?: (error: any) => void
}

export const useMexaTransaction = ({
    amount, 
    recipientAddress, 
    onSuccess, 
    onError,
}: UseMexaTransactionProps) => {
    const [isProcessing, setIsProcessing] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    const { data: simulateData, error: simulateError } = useSimulateContract({
        address: MEXA.address as `0x${string}`,
        abi: erc20Abi,
        functionName: "transfer",
        args: [recipientAddress, amount ? BigInt(parseUnits(amount, MEXA.decimals)) : BigInt(0)]
      })

    const { 
        writeContractAsync,
        data: txHash,
        error: writeError,
        isPending,
    } = useWriteContract()

    const { 
        data: txReceipt,
        isLoading 
    } = useWaitForTransactionReceipt({
        hash: txHash
    })

    useEffect(() => {
        if (txReceipt && isProcessing) {
            setSuccess('Transacción completada correctamente')
            setIsProcessing(false)
            
            emitter.emit('balanceUpdated')
            
            if (onSuccess) {
                onSuccess()
            }
        }
    }, [txReceipt, isProcessing, onSuccess])

    const executeTransaction = async () => {
        try {
            setIsProcessing(true)
            setError(null)
            setSuccess(null)
            
            if (simulateError) {
                console.error("Simulation error:", simulateError)
                setError("Error al simular la transacción")
                throw new Error('Error en la simulación')
            }
            
            if (!simulateData?.request) {
                setError("Error al crear la transacción")
                throw new Error('No se puede simular la transacción')
            }
            
            await writeContractAsync(simulateData.request)
        
        } catch (err) {
            console.error("Transaction error:", err)
            setError('La transacción falló')
            setIsProcessing(false)
            
            if (onError) {
                onError(err)
            }
        }
    }

    return {
        executeTransaction,
        isProcessing,
        isPending,
        isLoading,
        error,
        success,
        setError,
        setSuccess
    }
    
}