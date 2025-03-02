// src/components/EarnWidget.tsx
import { useEffect, useState } from 'react'
import { useAccount, useReadContract, useWriteContract, useSimulateContract, useWaitForTransactionReceipt } from 'wagmi'
import { ethers } from 'ethers'
import { Address, erc20Abi, parseUnits } from 'viem'


// Aave Pool address provider
const AAVE_POOL_ADDRESS_PROVIDER = '0xa97684ead0e402dC232d5A977953DF7ECBaB3CDb'
// Aave V3 Data Provider address on Polygon (example address)
const AAVE_DATA_PROVIDER_ADDRESS = '0x68100bD5345eA474D93577127C11F39FF8463e93'
// USDC address on Polygon
const USDC_ADDRESS = '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359'

const AAVE_POOL_ADDRESS = '0x794a61358D6845594F94dc1DB02A252b5b4814aD'

// JSON ABI for getReserveData (using the official view contract format)
// Can I mis these two into one? 
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

  function openSupplyModal() {
    setIsWithdraw(false)
    setAmount('')
    setShowModal(true)
    setError(null)
  }

  function openWithdrawModal() {
    setIsWithdraw(true)
    setAmount('')
    setShowModal(true)
    setError(null)
  }

  /*
  function handleConfirm() {
    if (!amount || Number(amount) <= 0) {
      console.log('Please enter a valid amount.')
      return
    }
    // For now, just log it. Later, you'd call the Aave Pool contract methods:
    //   pool.supply(asset, amount, onBehalfOf, referralCode)
    //   pool.withdraw(asset, amount, to)
    if (isWithdraw) {
      console.log(`Withdraw ${amount} USDC`)
    } else {
      console.log(`Supply ${amount} USDC`)
    }
    // Close the modal after confirming
    setShowModal(false)
  }
    */


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
    if (data && userData) {
      const usdcReserve = data[0].find(
        (reserve: any) => reserve.underlyingAsset.toLowerCase() === USDC_ADDRESS.toLowerCase()
      )

      if (usdcReserve) {
        console.log('USDC Reserve:', usdcReserve)
        const liquidityRate = usdcReserve.liquidityRate
        console.log('Liquidity Rate (ray):', liquidityRate.toString())
        const computedAPY = calculateAPY(liquidityRate)
        setApy(computedAPY)
      } else {
        console.error('USDC reserve not found');
      }
    } else if (error) {
      console.error('Error reading reserve data:', error)
    }
  }, [data, errorData])

  // Need to figureout how to deal with this errors
  useEffect(() => {
    if (data && userData) {
      // 1. Find USDC in the reservesData
      const usdcReserve = data[0].find(
        (r: any) => r.underlyingAsset.toLowerCase() === USDC_ADDRESS.toLowerCase()
      )
      const liquidityIndex = usdcReserve?.liquidityIndex
  
      // 2. Find USDC in the userReservesData
      const userReserve = userData[0].find(
        (u: any) => u.underlyingAsset.toLowerCase() === USDC_ADDRESS.toLowerCase()
      )
      const scaledBalance = userReserve?.scaledATokenBalance
  
      if (liquidityIndex && scaledBalance) {
        // 3. Convert both from string to BigInt if needed
        const indexBN = BigInt(liquidityIndex.toString())
        const scaledBN = BigInt(scaledBalance.toString())
  
        // 4. Actual USDC deposit
        const userDepositInUSDC = (Number(scaledBN) * (Number(indexBN) / 1e27))/(10 ** 6)
  
        console.log('User deposit in USDC:', userDepositInUSDC)
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

  const getButtonText = () => {
    if (waitingForApproval) return 'Approving...'
    if (isProcessing) return isWithdraw ? 'Withdrawing...' : 'Supplying...'
    if (needsApproval) return 'Approve & Supply'
    return isWithdraw ? 'Withdraw' : 'Supply'
  }

  const handleConfirm = async () => {
    await proceedWithTransaction(true)
  }

  const profitPlaceholder = '0.00'
  const originalBalance = 4.61
  
  if (!isConnected) return <div>Please connect your wallet.</div>

  return (
    <div className="bg-white shadow rounded-lg p-6 relative">
      <h2 className="text-xl font-semibold mb-4">Supply</h2>
      <table className="w-full text-left">
        <thead>
          <tr className="border-b">
            <th className="py-2">Asset</th>
            <th className="py-2">Balance</th>
            <th className="py-2">Position Value</th>
            <th className="py-2">APY</th>
            <th className="py-2"></th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b">
            {/* Asset column */}
            <td className="py-2">
              <div className="flex items-center">
                <img
                  src="https://cryptologos.cc/logos/usd-coin-usdc-logo.png?v=013"
                  alt="USDC"
                  className="h-6 w-6 mr-2"
                />
                <span className="font-medium">USDC</span>
              </div>
            </td>

            {/* Original Balance */}
            <td className="py-2">{originalBalance.toFixed(2)}</td>

            {/* Position Value */}
            <td className="py-2">
              {loadingUserData ? "Loading..." : userPosition}
              {userPosition && parseFloat(userPosition) > 0 && (
                <span className="text-green-600 ml-1">
                  (+{(parseFloat(userPosition) - originalBalance).toFixed(2)})
                </span>
              )}
            </td>

            {/* APY column */}
            <td className="py-2">
              {loadingReserves ? "Loading..." : apy ? `${apy}%` : "0.00%"}
            </td>

            {/* Buttons column */}
            <td className="py-2 text-right">
              <button
                className="mr-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={openSupplyModal}
              >
                Supply
              </button>
              <button
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                onClick={openWithdrawModal}
                disabled={!userPosition || parseFloat(userPosition) <= 0}
              >
                Withdraw
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Modal overlay */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
          <div className="bg-white p-6 rounded shadow-md max-w-sm w-full">
            <h2 className="text-lg font-semibold mb-4">
              {isWithdraw ? 'Withdraw USDC' : 'Supply USDC'}
            </h2>
            
            {/* Amount input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount
              </label>
              <input
                type="number"
                value={amount}
                onChange={handleAmountChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="0.0"
                disabled={isProcessing || waitingForApproval}
              />
              {isWithdraw && userPosition && (
                <div className="text-xs text-gray-500 mt-1">
                  Available: {userPosition} USDC
                </div>
              )}
              {!isWithdraw && (
                <div className="text-xs text-gray-500 mt-1">
                  Balance: {originalBalance.toFixed(2)} USDC
                </div>
              )}
            </div>
            
            {/* Approval notice */}
            {needsApproval && !isWithdraw && (
              <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded text-sm">
                Approval needed for USDC. The supply will execute after approval.
              </div>
            )}
            
            {/* Error message */}
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">
                {error}
              </div>
            )}
            
            {/* Action buttons */}
            <div className="flex justify-end">
              <button
                className="mr-2 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                onClick={() => {
                  setShowModal(false)
                  resetState()
                }}
                disabled={isProcessing || waitingForApproval}
              >
                Cancel
              </button>
              
              <button
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
              onClick={handleConfirm}
              disabled={
                !amount || 
                parseFloat(amount) <= 0 || 
                isProcessing || 
                waitingForApproval ||
                (isWithdraw && !!userPosition && parseFloat(amount) > parseFloat(userPosition))
                }>
                  {getButtonText()}
                  </button>
            </div>
            
            {/* Transaction status */}
            {(isProcessing || waitingForApproval) && (
              <div className="mt-4 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">
                  {waitingForApproval 
                    ? "Please confirm approval in your wallet..." 
                    : isWithdraw 
                      ? "Please confirm withdrawal in your wallet..."
                      : "Please confirm supply in your wallet..."}
                </p>
                
                {txHash && (
                  <a 
                    href={`https://polygonscan.com/tx/${txHash}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline text-sm mt-2 inline-block"
                  >
                    View on PolygonScan
                  </a>
                )}
              </div>
            )}
            
            {/* Success message */}
            {approvalTxReceipt && !waitingForApproval && (
              <div className="mt-4 text-center">
                <div className="text-green-500 text-3xl mb-2">✓</div>
                <p className="text-green-600 font-medium">Transaction successful!</p>
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
