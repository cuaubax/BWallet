// src/components/EarnWidget.tsx
import { useEffect, useState } from 'react'
import { useAccount, useReadContract, useWriteContract, useSimulateContract, useWaitForTransactionReceipt, useReadContracts } from 'wagmi'
import { formatUnits } from 'ethers'
import { Address, erc20Abi, parseUnits } from 'viem'
import { emitter } from '../utils/eventBus'


// Aave Pool address provider
const AAVE_POOL_ADDRESS_PROVIDER = '0xa97684ead0e402dC232d5A977953DF7ECBaB3CDb'
// Aave V3 Data Provider address on Arbitrum
const AAVE_DATA_PROVIDER_ADDRESS = '0x5c5228aC8BC1528482514aF3e27E692495148717'
// USDT address on Arbitrum
const USDC_ADDRESS = '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9'
const aPOLUSDC_ADDRESS = '0x6ab707Aca953eDAeFBc4fD23bA73294241490620'

const AAVE_POOL_ADDRESS = '0x794a61358D6845594F94dc1DB02A252b5b4814aD'

// JSON ABI for getReserveData (using the official view contract format)
// Can I mix these two into one? 
// Move to their own file anyways
const UI_POOL_DATA_PROVIDER_ABI = [
  {
    "inputs": [
      {
        "internalType": "contract IPoolAddressesProvider",
        "name": "provider",
        "type": "address"
      }
    ],
    "name": "getReservesData",
    "outputs": [
      {
        "components": [
          { "internalType": "address", "name": "underlyingAsset", "type": "address" },
          { "internalType": "string", "name": "name", "type": "string" },
          { "internalType": "string", "name": "symbol", "type": "string" },
          { "internalType": "uint256", "name": "decimals", "type": "uint256" },
          { "internalType": "uint256", "name": "baseLTVasCollateral", "type": "uint256" },
          { "internalType": "uint256", "name": "reserveLiquidationThreshold", "type": "uint256" },
          { "internalType": "uint256", "name": "reserveLiquidationBonus", "type": "uint256" },
          { "internalType": "uint256", "name": "reserveFactor", "type": "uint256" },
          { "internalType": "bool", "name": "usageAsCollateralEnabled", "type": "bool" },
          { "internalType": "bool", "name": "borrowingEnabled", "type": "bool" },
          { "internalType": "bool", "name": "isActive", "type": "bool" },
          { "internalType": "bool", "name": "isFrozen", "type": "bool" },
          { "internalType": "uint128", "name": "liquidityIndex", "type": "uint128" },
          { "internalType": "uint128", "name": "variableBorrowIndex", "type": "uint128" },
          { "internalType": "uint128", "name": "liquidityRate", "type": "uint128" },
          { "internalType": "uint128", "name": "variableBorrowRate", "type": "uint128" },
          { "internalType": "uint40", "name": "lastUpdateTimestamp", "type": "uint40" },
          { "internalType": "address", "name": "aTokenAddress", "type": "address" },
          { "internalType": "address", "name": "variableDebtTokenAddress", "type": "address" },
          { "internalType": "address", "name": "interestRateStrategyAddress", "type": "address" },
          { "internalType": "uint256", "name": "availableLiquidity", "type": "uint256" },
          { "internalType": "uint256", "name": "totalScaledVariableDebt", "type": "uint256" },
          { "internalType": "uint256", "name": "priceInMarketReferenceCurrency", "type": "uint256" },
          { "internalType": "address", "name": "priceOracle", "type": "address" },
          { "internalType": "uint256", "name": "variableRateSlope1", "type": "uint256" },
          { "internalType": "uint256", "name": "variableRateSlope2", "type": "uint256" },
          { "internalType": "uint256", "name": "baseVariableBorrowRate", "type": "uint256" },
          { "internalType": "uint256", "name": "optimalUsageRatio", "type": "uint256" },
          { "internalType": "bool", "name": "isPaused", "type": "bool" },
          { "internalType": "bool", "name": "isSiloedBorrowing", "type": "bool" },
          { "internalType": "uint128", "name": "accruedToTreasury", "type": "uint128" },
          { "internalType": "uint128", "name": "unbacked", "type": "uint128" },
          { "internalType": "uint128", "name": "isolationModeTotalDebt", "type": "uint128" },
          { "internalType": "bool", "name": "flashLoanEnabled", "type": "bool" },
          { "internalType": "uint256", "name": "debtCeiling", "type": "uint256" },
          { "internalType": "uint256", "name": "debtCeilingDecimals", "type": "uint256" },
          { "internalType": "uint256", "name": "borrowCap", "type": "uint256" },
          { "internalType": "uint256", "name": "supplyCap", "type": "uint256" },
          { "internalType": "bool", "name": "borrowableInIsolation", "type": "bool" },
          { "internalType": "bool", "name": "virtualAccActive", "type": "bool" },
          { "internalType": "uint128", "name": "virtualUnderlyingBalance", "type": "uint128" }
        ],
        "internalType": "struct IUiPoolDataProviderV3.AggregatedReserveData[]",
        "name": "",
        "type": "tuple[]"
      },
      {
        "components": [
          { "internalType": "uint256", "name": "marketReferenceCurrencyUnit", "type": "uint256" },
          { "internalType": "int256", "name": "marketReferenceCurrencyPriceInUsd", "type": "int256" },
          { "internalType": "int256", "name": "networkBaseTokenPriceInUsd", "type": "int256" },
          { "internalType": "uint8", "name": "networkBaseTokenPriceDecimals", "type": "uint8" }
        ],
        "internalType": "struct IUiPoolDataProviderV3.BaseCurrencyInfo",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
]

const USER_RESERVES_DATA_ABI = [{
  "inputs": [
    {
      "internalType": "contract IPoolAddressesProvider",
      "name": "provider",
      "type": "address"
    },
    {
      "internalType": "address",
      "name": "user",
      "type": "address"
    }
  ],
  "name": "getUserReservesData",
  "outputs": [
    {
      "components": [
        {
          "internalType": "address",
          "name": "underlyingAsset",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "scaledATokenBalance",
          "type": "uint256"
        },
        {
          "internalType": "bool",
          "name": "usageAsCollateralEnabledOnUser",
          "type": "bool"
        },
        {
          "internalType": "uint256",
          "name": "scaledVariableDebt",
          "type": "uint256"
        }
      ],
      "internalType": "struct IUiPoolDataProviderV3.UserReserveData[]",
      "name": "",
      "type": "tuple[]"
    },
    {
      "internalType": "uint8",
      "name": "",
      "type": "uint8"
    }
  ],
  "stateMutability": "view",
  "type": "function"
}]

const AAVE_POOL_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "asset",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "onBehalfOf",
        "type": "address"
      },
      {
        "internalType": "uint16",
        "name": "referralCode",
        "type": "uint16"
      }
    ],
    "name": "supply",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "asset",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      }
    ],
    "name": "withdraw",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  }
]

const MAX_ALLOWANCE = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')

function calculateAPY(liquidityRate: bigint): string {
  const apr = Number(liquidityRate) / 1e27;
  const secondsPerYear = 31536000;
  const apy = (Math.pow(1 + apr / secondsPerYear, secondsPerYear) - 1) * 100;
  return apy.toFixed(2);
}

export const AaveComponent = () => {
  const { address, isConnected } = useAccount()
  const [apy, setApy] = useState<string | null>(null)
  const [userPosition, setUserPosition] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [isWithdraw, setIsWithdraw] = useState(false)
  const [amount, setAmount] = useState('')
  const [error, setError] = useState<string | null>(null)

  const [isProcessing, setIsProcessing] = useState(false)
  const [needsApproval, setNeedsApproval] = useState(false)
  const [waitingForApproval, setWaitingForApproval] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [balanceAPolUSDC, setBalanceAPolUSDC] = useState<string | null>(null)
  const [balanceUSDC, setBalanceUSDC] = useState<string | null>(null)
  const [currentTxType, setCurrentTxType] = useState<'none' | 'approval' | 'main'>('none')

  // Add these state variables to track the fake token
  const [fakeMexBalance, setFakeMexBalance] = useState<string>("123.45") 
  const [fakeMexDeposited, setFakeMexDeposited] = useState<string>("678.90")
  const [fakeMexProcessing, setFakeMexProcessing] = useState<boolean>(false)
  const [fakeMexTxHash, setFakeMexTxHash] = useState<string | null>(null)

  const [currentToken, setCurrentToken] = useState<'USDT' | 'MEX'>('USDT')

  // Function to open deposit modal for MEX token
function openMexSupplyModal() {
  setIsWithdraw(false)
  setAmount('')
  setShowModal(true)
  setError(null)
  // Flag to indicate we're using the fake token
  setCurrentToken('MEX')
}

// Function to open withdraw modal for MEX token
function openMexWithdrawModal() {
  setIsWithdraw(true)
  setAmount('')
  setShowModal(true)
  setError(null)
  // Flag to indicate we're using the fake token
  setCurrentToken('MEX')
}

const handleMexDeposit = async () => {
  if (!amount || parseFloat(amount) <= 0) {
    setError('Por favor ingresa un monto válido')
    return
  }
  
  // Check if user has enough balance
  if (parseFloat(amount) > parseFloat(fakeMexBalance)) {
    setError('Balance insuficiente')
    return
  }
  
  try {
    setFakeMexProcessing(true)
    setError(null)
    
    // Generate a fake transaction hash
    const fakeHash = '0x' + Array(64).fill(0).map(() => 
      Math.floor(Math.random() * 16).toString(16)).join('')
    setFakeMexTxHash(fakeHash)
    
    // Simulate transaction processing time
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Update balances
    const newBalance = (parseFloat(fakeMexBalance) - parseFloat(amount)).toFixed(2)
    const newDeposited = (parseFloat(fakeMexDeposited) + parseFloat(amount)).toFixed(2)
    
    setFakeMexBalance(newBalance)
    setFakeMexDeposited(newDeposited)
    
    // Show success for a moment
    await new Promise(resolve => setTimeout(resolve, 1000))

    setFakeMexProcessing(false)
    setFakeMexTxHash(null)
    setShowModal(false)
    setAmount('')
    setError(null)
  } catch (error) {
    console.error('Transaction failed:', error)
    setError('La transacción falló. Por favor intenta de nuevo.')
    setFakeMexProcessing(false)
    setFakeMexTxHash(null)
  }
}

const handleMexWithdraw = async () => {
  if (!amount || parseFloat(amount) <= 0) {
    setError('Por favor ingresa un monto válido')
    return
  }
  
  // Check if user has enough deposited
  if (parseFloat(amount) > parseFloat(fakeMexDeposited)) {
    setError('Monto depositado insuficiente')
    return
  }
  
  try {
    setFakeMexProcessing(true)
    setError(null)
    
    // Generate a fake transaction hash
    const fakeHash = '0x' + Array(64).fill(0).map(() => 
      Math.floor(Math.random() * 16).toString(16)).join('')
    setFakeMexTxHash(fakeHash)
    
    // Simulate transaction processing time
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Update balances
    const newBalance = (parseFloat(fakeMexBalance) + parseFloat(amount)).toFixed(2)
    const newDeposited = (parseFloat(fakeMexDeposited) - parseFloat(amount)).toFixed(2)
    
    setFakeMexBalance(newBalance)
    setFakeMexDeposited(newDeposited)
    
    // Show success for a moment
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Reset state and close modal
    setFakeMexProcessing(false)
    setFakeMexTxHash(null)
    setShowModal(false)
    setAmount('')
    setError(null)
  } catch (error) {
    console.error('Transaction failed:', error)
    setError('La transacción falló. Por favor intenta de nuevo.')
    setFakeMexProcessing(false)
    setFakeMexTxHash(null)
  }
}


  const { data: balanceAPolUSDCData, refetch: refetchAPolUSDC} = useReadContracts({
    contracts: [
      {
        // Hard coded aPolUSDC arbitrum address
        address: aPOLUSDC_ADDRESS,
        abi: erc20Abi,
        functionName: "balanceOf",
        chainId: 42161,
        args: [address as Address]
      },
      {
        // Hard coded USDC arbitrum address TODO: fix this
        address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
        abi: erc20Abi,
        functionName: "balanceOf",
        chainId: 42161,
        args: [address as Address]
      }
    ]
  })


  function openSupplyModal() {
    setIsWithdraw(false)
    setAmount('')
    setShowModal(true)
    setError(null)
    setCurrentToken("USDT")
  }

  function openWithdrawModal() {
    setIsWithdraw(true)
    setAmount('')
    setShowModal(true)
    setError(null)
    setCurrentToken("USDT")
  }

  const { data, isLoading, error: errorData, isLoading: loadingReserves, refetch: refetchReservesData } = useReadContract({
    address: AAVE_DATA_PROVIDER_ADDRESS,
    abi: UI_POOL_DATA_PROVIDER_ABI,
    functionName: 'getReservesData',
    args: [AAVE_POOL_ADDRESS_PROVIDER]
  })

  const { data: userData, error: userBalanceError, isLoading: loadingUserData, refetch: refetchUserReservesData } = useReadContract({
    address: AAVE_DATA_PROVIDER_ADDRESS,
    abi: USER_RESERVES_DATA_ABI,
    functionName: 'getUserReservesData',
    args: [AAVE_POOL_ADDRESS_PROVIDER, address]
  })

  // check allowance for AAVE pool
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: "allowance",
    args: [address as Address, AAVE_POOL_ADDRESS]
  })

  const { 
    writeContractAsync: executeTransaction,
    isPending: isPendingExecution 
  } = useWriteContract()

  const { data: simulateApproval } = useSimulateContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: "approve",
    args: [AAVE_POOL_ADDRESS, MAX_ALLOWANCE],
  })

  const { data: approvalTxReceipt, isLoading: isWaitingForApproval } = useWaitForTransactionReceipt({
    hash: txHash as `0x${string}` | undefined,
  })
  
  useEffect(() => {
        if (!balanceAPolUSDCData) {
          refetchAPolUSDC()
          return
        }
        
        const rawBalanceAPolUSDC = balanceAPolUSDCData[0]?.result
        const rawBalanceUSDC = balanceAPolUSDCData[1]?.result
        
        if (rawBalanceAPolUSDC != null && rawBalanceUSDC != null) {
          // Hardcoded both decimal places
          setBalanceAPolUSDC(formatUnits(rawBalanceAPolUSDC, 6))
          setBalanceUSDC(formatUnits(rawBalanceUSDC,6))
        }
      }, [balanceAPolUSDCData, refetchAPolUSDC]);

  useEffect(() => {
    if (data && userData) {
      const usdcReserveData = data as any[]
      const usdcReserve = usdcReserveData[0].find(
        (reserve: any) => reserve.underlyingAsset.toLowerCase() === USDC_ADDRESS.toLowerCase()
      )

      if (usdcReserve) {
        console.log('USDC Reserve:', usdcReserve)
        const liquidityRate = usdcReserve.liquidityRate
        console.log('Liquidity Rate (ray):', liquidityRate.toString())
        const computedAPY = calculateAPY(liquidityRate)
        setApy(computedAPY)
      } else {
        console.error('USDT reserve not found');
      }
    } else if (error) {
      console.error('Error reading reserve data:', error)
    }
  }, [data, errorData])

  // Need to figureout how to deal with this errors
  useEffect(() => {
    if (data && userData) {
      // 1. Find USDC in the reservesData
      const usdcReserveData = data as any[]
      const usdcReserve = usdcReserveData[0].find(
        (r: any) => r.underlyingAsset.toLowerCase() === USDC_ADDRESS.toLowerCase()
      )
      const liquidityIndex = usdcReserve?.liquidityIndex
  
      // 2. Find USDC in the userReservesData
      const userReserveData = userData as any[]
      const userReserve = userReserveData[0].find(
        (u: any) => u.underlyingAsset.toLowerCase() === USDC_ADDRESS.toLowerCase()
      )
      const scaledBalance = userReserve?.scaledATokenBalance
  
      if (liquidityIndex && scaledBalance) {
        // 3. Convert both from string to BigInt if needed
        const indexBN = BigInt(liquidityIndex.toString())
        const scaledBN = BigInt(scaledBalance.toString())
  
        // 4. Actual USDC deposit
        const userDepositInUSDC = (Number(scaledBN) * (Number(indexBN) / 1e27))/(10 ** 6)
  
        console.log('User deposit in USDT:', userDepositInUSDC)
        setUserPosition(userDepositInUSDC.toString())
        // e.g., display userDepositInUSDC in the UI
      }
    } else {
      console.log('lol')
    }
  }, [data, userData])

  useEffect(() => {
    console.log("Allowance:", allowance)
    if (amount && parseFloat(amount) > 0 && !isWithdraw && allowance !== undefined) {
      const amountInWei = parseUnits(amount, 6)
      const currentAllowance = allowance ? BigInt(allowance.toString()) : BigInt(0)
      setNeedsApproval(currentAllowance < amountInWei)
      console.log(currentAllowance)
      console.log(amountInWei)
    } else {
      console.log("no approval needed")
      setNeedsApproval(false)
    }
  }, [amount, isWithdraw, allowance])

  useEffect(() => {
    if (approvalTxReceipt) {
      if (waitingForApproval) {
        // Approval completed
        setWaitingForApproval(false)
        refetchAllowance().then(() => {
          // Execute supply after approval
          proceedWithTransaction(false)
        })
      } else {
        // Supply/withdraw completed
        setIsProcessing(false)
        setTxHash(null)
        
        // Refresh data
        refreshData().then(() => {
          setTimeout(() => {
            setShowModal(false)
            resetState()
          }, 3000)
        })
      }
    }
  }, [approvalTxReceipt])

  const proceedWithTransaction = async (checkApproval = true) => {
    if (!amount || parseFloat(amount) <= 0 || !address) {
      setError('Please enter a valid amount')
      return
    }
    
    try {
      setIsProcessing(true)
      setError(null)
      
      const amountInWei = parseUnits(amount, 6)
      
      if (isWithdraw) {
        // Withdraw transaction
        const hash = await executeTransaction({
          address: AAVE_POOL_ADDRESS,
          abi: AAVE_POOL_ABI,
          functionName: 'withdraw',
          args: [USDC_ADDRESS, amountInWei, address],
        })
        
        setTxHash(hash)
      } else {
        // Supply transaction
        // Check if approval is needed first
        if (checkApproval && needsApproval) {
          if (!simulateApproval || !simulateApproval.request) {
            throw new Error('Cannot simulate approval transaction')
          }
          
          setWaitingForApproval(true)
          const hash = await executeTransaction(simulateApproval.request)
          setTxHash(hash)
        } else {
          // Already approved, proceed with supply
          const hash = await executeTransaction({
            address: AAVE_POOL_ADDRESS,
            abi: AAVE_POOL_ABI,
            functionName: 'supply',
            args: [USDC_ADDRESS, amountInWei, address, 0],
          })
          
          setTxHash(hash)
          emitter.emit('balanceUpdated')
          refetchAPolUSDC()
        }
      }
    } catch (error) {
      console.error('Transaction failed:', error)
      setError('Transaction failed. Please try again.')
      setIsProcessing(false)
      setWaitingForApproval(false)
    }
  }

  const resetState = () => {
    setAmount('')
    setError(null)
    setIsProcessing(false)
    setNeedsApproval(false)
    setWaitingForApproval(false)
    setTxHash(null)
    emitter.emit('balanceUpdated')
    refetchAPolUSDC()
  }

  const refreshData = async () => {
    try {
      await Promise.all([
        refetchReservesData(),
        refetchUserReservesData(),
        refetchAllowance()
      ])
    } catch (error) {
      console.error('Error refreshing data:', error)
    }
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value)
    setError(null)
  }

  /*
  const getButtonText = () => {
    if (waitingForApproval) return 'Aprobando...'
    if (isProcessing) return isWithdraw ? 'Retirando...' : 'Depositando...'
    if (needsApproval) return 'Aprueba & Deposita'
    return isWithdraw ? 'Retira' : 'Deposita'
  }
  */

  const getButtonText = () => {
    if (currentToken === 'MEX') {
      if (fakeMexProcessing) return isWithdraw ? 'Retirando...' : 'Depositando...'
      return isWithdraw ? 'Retira' : 'Deposita'
    } else {
      // Original AAVE logic
      if (waitingForApproval) return 'Aprobando...'
      if (isProcessing) return isWithdraw ? 'Retirando...' : 'Depositando...'
      if (needsApproval) return 'Aprueba & Deposita'
      return isWithdraw ? 'Retira' : 'Deposita'
    }
  }

  /*
  const handleConfirm = async () => {
    await proceedWithTransaction(true)
  }
    */

  const handleConfirm = async () => {
    if (currentToken === 'MEX') {
      if (isWithdraw) {
        await handleMexWithdraw()
      } else {
        await handleMexDeposit()
      }
    } else {
      // Original AAVE logic
      await proceedWithTransaction(true)
    }
  }
  

  const profitPlaceholder = '0.00'
  
  if (!isConnected) return <div>Por favor conecta tu wallet.</div>

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <table className="w-full border-separate border-spacing-y-3">
        <thead>
          <tr>
            <th className="text-xs text-gray-500 font-medium text-left pl-3">Moneda</th>
            <th className="text-xs text-gray-500 font-medium text-center">Disponible</th>
            <th className="text-xs text-gray-500 font-medium text-center">Total depositado</th>
            <th className="text-xs text-gray-500 font-medium text-center">APY</th>
            <th className="text-xs text-gray-500 font-medium text-right pr-3"></th>
          </tr>
        </thead>
        <tbody>
          {/* Placeholder row */}
          <tr className="bg-itemBackground rounded-xl">
            <td className="py-4 pl-3 bg-gray-50 rounded-l-xl">
              <div className="flex items-center">
                <img
                src="/icons/MEXAS.svg"
                alt="Placeholder"
                className="h-6 w-6 mr-2 rounded-full"
                />
                <span className="font-medium">MEX</span>
              </div>
            </td>
            <td className="py-4 text-center bg-gray-50">
              <span className="font-medium">{fakeMexBalance}</span>
            </td>
            <td className="py-4 text-center bg-gray-50">
              <span className="font-medium">{fakeMexDeposited}</span>
            </td>
            <td className="py-4 text-center bg-gray-50">
              <span className="font-medium">5.67%</span>
            </td>
            <td className="py-4 pr-3 bg-gray-50 rounded-r-xl">
              <div className="flex justify-end space-x-2">
                <button 
                className="bg-black text-white px-3 py-1.5 rounded-lg text-sm font-medium"
                onClick={openMexSupplyModal}>
                  Depositar
                </button>
                <button 
                className="bg-white text-black border border-gray-300 px-3 py-1.5 rounded-lg text-sm font-medium disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200"
                onClick={openMexWithdrawModal}
                disabled={!fakeMexDeposited || parseFloat(fakeMexDeposited) <= 0}>
                  Retirar
                </button>
              </div>
            </td>
          </tr>
  
          {/* Actual data row */}
          <tr className="bg-itemBackground rounded-xl">
            <td className="py-4 pl-3 bg-gray-50 rounded-l-xl">
              <div className="flex items-center">
                <img
                  src="https://cryptologos.cc/logos/tether-usdt-logo.svg?v=040"
                  alt="USDT"
                  className="h-6 w-6 mr-2 rounded-full"
                />
                <span className="font-medium">USDT</span>
              </div>
            </td>
            <td className="py-4 text-center bg-gray-50">
              <span className="font-medium">
                {balanceUSDC ? parseFloat(balanceUSDC).toFixed(2) : "0.00"}
              </span>
            </td>
            <td className="py-4 text-center bg-gray-50">
              <div>
                <span className="font-medium">
                  {loadingUserData
                    ? "..."
                    : (isNaN(parseFloat(userPosition!))
                        ? "0.00"
                        : parseFloat(userPosition!).toFixed(2))}
                </span>
                {userPosition && parseFloat(userPosition) > 0 && (
                  <span className="text-green-600 text-xs ml-1">
                    (+{(parseFloat(userPosition) - parseFloat(balanceAPolUSDC!)).toFixed(2)})
                  </span>
                )}
              </div>
            </td>
            <td className="py-4 text-center bg-gray-50">
              <span className="font-medium">
                {loadingReserves ? "..." : apy ? `${apy}%` : "0.00%"}
              </span>
            </td>
            <td className="py-4 pr-3 bg-gray-50 rounded-r-xl">
              <div className="flex justify-end space-x-2">
                <button 
                  className="bg-black text-white px-3 py-1.5 rounded-lg text-sm font-medium"
                  onClick={openSupplyModal}>
                  Depositar
                </button>
                <button 
                  className="bg-white text-black border border-gray-300 px-3 py-1.5 rounded-lg text-sm font-medium disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200"
                  onClick={openWithdrawModal}
                  disabled={!userPosition || parseFloat(userPosition) <= 0}>
                  Retirar
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
  
      {/* Modal overlay - redesigned */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg max-w-sm w-full">
            <h2 className="text-lg font-semibold mb-5">
            {isWithdraw 
            ? `Retira ${currentToken}` 
            : `Deposita ${currentToken}`}
            </h2>
            
            {/* Amount input with improved styling */}
            <div className="mb-5">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm text-gray-600 font-medium">
                  Monto
                </label>
                {isWithdraw && (
                  <div className="text-xs text-gray-500">
                    Disponible: 
                    <span className="font-medium">
                      {currentToken === 'MEX' 
                      ? `${fakeMexDeposited} MEX` 
                      : `${userPosition} USDT`}
                    </span>
                  </div>
                )}
                {!isWithdraw && (
                  <div className="text-xs text-gray-500">
                    Disponible: 
                    <span className="font-medium">
                      {currentToken === 'MEX' 
                      ? `${fakeMexBalance} MEX` 
                      : `${parseFloat(balanceUSDC!).toFixed(2)} USDT`}
                    </span>
                  </div>
                )}
              </div>

              
              <div className="flex items-center bg-gray-50 rounded-xl p-3 border border-transparent focus-within:border-gray-200">
                <input
                  type="number"
                  value={amount}
                  onChange={handleAmountChange}
                  className="w-full text-xl font-bold outline-none bg-transparent"
                  placeholder="0.00"
                  min="0"
                  max={
                    isWithdraw 
                      ? currentToken === 'MEX'
                        ? Number(fakeMexDeposited)
                        : Number(userPosition)
                      : currentToken === 'MEX'
                        ? Number(fakeMexBalance)
                        : Number(balanceUSDC)
                  }
                  disabled={isProcessing || waitingForApproval }
                />
                <div className="flex items-center space-x-1 ml-2">
                  <img 
                  src={currentToken === 'MEX' 
                    ? "/icons/MEXAS.svg" 
                    : "https://cryptologos.cc/logos/tether-usdt-logo.svg?v=040"} 
                    alt={currentToken}
                    className="w-5 h-5 rounded-full" 
                    />
                    <span className="font-medium">{currentToken}</span>
                </div>
              </div>
            </div>
            
            {/* Approval notice */}
            {needsApproval && !isWithdraw && (
              <div className="mb-4 p-3 bg-gray-50 rounded-xl text-sm border border-gray-200">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-gray-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Se requiere aprovar el gasto de USDT. El depósito continuará después de esto.</span>
                </div>
              </div>
            )}
            
            {/* Error message */}
            {error && (
              <div className="mb-4 p-3 bg-gray-50 rounded-xl text-sm border border-gray-200">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-gray-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{error}</span>
                </div>
              </div>
            )}
            
            {/* Action buttons */}
            <div className="flex justify-end mt-6 space-x-3">
              <button
                className="bg-white text-black border border-gray-300 rounded-xl px-4 py-2.5 font-medium hover:bg-gray-50 transition-colors"
                onClick={() => {
                  setShowModal(false)
                  resetState()
                }}
                disabled={isProcessing || waitingForApproval}
              >
                Cancelar
              </button>
              
              <button
                className="bg-black text-white rounded-xl px-4 py-2.5 font-medium disabled:bg-gray-300 disabled:text-gray-500 transition-colors"
                onClick={handleConfirm}
                disabled={
                  !amount || 
                  parseFloat(amount) <= 0 || 
                  (currentToken === 'USDT' ? (isProcessing || waitingForApproval) : fakeMexProcessing) ||
                  (isWithdraw && (
                    (currentToken === 'USDT' && !!userPosition && parseFloat(amount) > parseFloat(userPosition)) ||
                    (currentToken === 'MEX' && parseFloat(amount) > parseFloat(fakeMexDeposited))
                  ))}>
                {getButtonText()}
              </button>
            </div>
            
            {/* Transaction status */}
            {(isProcessing || waitingForApproval) && (
              <div className="mt-5 flex flex-col items-center">
                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>
                    {waitingForApproval 
                      ? "Por favor aprueba en tu wallet..." 
                      : isWithdraw 
                        ? "Por favor confirma el retiro en tu wallet..."
                        : "Por favor confirma el depósito en tu wallet..."
                    }
                  </span>
                </div>
                {txHash && (
                  <a 
                    href={`https://arbiscan.io/tx/${txHash}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-black text-sm mt-1 inline-flex items-center"
                  >
                    <span>Ver en el explorador</span>
                    <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
              </div>
            )}
            
            {/* Success message */}
            {approvalTxReceipt && !waitingForApproval && (
              <div className="mt-5 flex flex-col items-center">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                  <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-gray-900 font-medium">¡Transacción Exitosa!</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default AaveComponent

// 4.610151723441871
