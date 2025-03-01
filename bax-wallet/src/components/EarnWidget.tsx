// src/components/USDCEarnWidget.tsx
import { useAccount, useReadContract } from 'wagmi'
import { ethers } from 'ethers'

const AAVE_POOL_ADDRESS = '0x794a61358D6845594F94dc1DB02A252b5b4814aD'
const USDC_ADDRESS = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'

const AAVE_POOL_ABI = [
  'function getReserveData(address asset) view returns (tuple(uint256 configuration, uint128 liquidityIndex, uint128 variableBorrowIndex, uint128 currentLiquidityRate, uint128 currentVariableBorrowRate, uint128 currentStableBorrowRate, uint40 lastUpdateTimestamp, address aTokenAddress, address stableDebtTokenAddress, address variableDebtTokenAddress, address interestRateStrategyAddress, uint8 id))'
]

export const AaveComponent = () => {
  const { address, isConnected } = useAccount()

  const { data: reserveData, isLoading } = useReadContract({
    address: AAVE_POOL_ADDRESS,
    abi: AAVE_POOL_ABI,
    functionName: 'getReserveData',
    args: [USDC_ADDRESS],
    query: { enabled: Boolean(address) }
  })

  let apy: string | null = null
  if (reserveData && reserveData.currentLiquidityRate) {
    const rate: bigint = reserveData.currentLiquidityRate
    // APY = (liquidityRate / 1e27)*100
    apy = (parseFloat(ethers.formatUnits(rate, 27)) * 100).toFixed(2)
  }

  if (!isConnected) return <div>Please connect your wallet.</div>

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">USDC Earn</h2>

      <div className="mb-4">
        <span className="text-gray-600">Current APY: </span>
        {isLoading ? <span>Loading...</span> : <span className="font-bold">{apy}%</span>}
      </div>

      <div className="mb-4">
        <button
          onClick={() => console.log('Deposit USDC button pressed')}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Deposit USDC
        </button>
      </div>

      <div>
        <button
          onClick={() => console.log('Withdraw USDC button pressed')}
          className="w-full py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Withdraw USDC
        </button>
      </div>
    </div>
  )
}
