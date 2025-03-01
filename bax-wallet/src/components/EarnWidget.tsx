// src/components/EarnWidget.tsx
import { useEffect, useState } from 'react'
import { useAccount, useReadContract } from 'wagmi'
import { ethers } from 'ethers'

// Aave V3 Data Provider address on Polygon (example address)
const AAVE_DATA_PROVIDER_ADDRESS = '0x68100bD5345eA474D93577127C11F39FF8463e93'
// Official USDC address on Polygon
const USDC_ADDRESS = ''

// JSON ABI for getReserveData (using the official view contract format)
const AAVE_DATA_PROVIDER_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "asset",
        "type": "address"
      }
    ],
    "name": "getReserveData",
    "outputs": [
      {
        "components": [
          { "internalType": "uint256", "name": "unbacked", "type": "uint256" },
          { "internalType": "uint256", "name": "accruedToTreasuryScaled", "type": "uint256" },
          { "internalType": "uint256", "name": "totalAToken", "type": "uint256" },
          { "internalType": "uint256", "name": "totalStableDebt", "type": "uint256" },
          { "internalType": "uint256", "name": "totalVariableDebt", "type": "uint256" },
          { "internalType": "uint256", "name": "liquidityRate", "type": "uint256" },
          { "internalType": "uint256", "name": "variableBorrowRate", "type": "uint256" },
          { "internalType": "uint256", "name": "stableBorrowRate", "type": "uint256" },
          { "internalType": "uint256", "name": "averageStableBorrowRate", "type": "uint256" },
          { "internalType": "uint256", "name": "liquidityIndex", "type": "uint256" },
          { "internalType": "uint256", "name": "variableBorrowIndex", "type": "uint256" },
          { "internalType": "uint40", "name": "lastUpdateTimestamp", "type": "uint40" }
        ],
        "internalType": "struct DataTypes.ReserveData",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// Define the tuple type returned by getReserveData
type ReserveDataTuple = [
  unbacked: bigint,
  accruedToTreasuryScaled: bigint,
  totalAToken: bigint,
  totalStableDebt: bigint,
  totalVariableDebt: bigint,
  liquidityRate: bigint,
  variableBorrowRate: bigint,
  stableBorrowRate: bigint,
  averageStableBorrowRate: bigint,
  liquidityIndex: bigint,
  variableBorrowIndex: bigint,
  lastUpdateTimestamp: bigint
];

function calculateAPY(liquidityRate: bigint): string {
  // liquidityRate is in ray (1e27). Convert to APR and compound per second over one year.
  const apr = Number(liquidityRate) / 1e27
  const secondsPerYear = 31536000
  const apy = (Math.pow(1 + apr / secondsPerYear, secondsPerYear) - 1) * 100
  return apy.toFixed(2)
}

export const AaveComponent = () => {
  const { address, isConnected } = useAccount()
  const [apy, setApy] = useState<string | null>(null)

  const { data, isLoading, error } = useReadContract({
    address: AAVE_DATA_PROVIDER_ADDRESS,
    abi: AAVE_DATA_PROVIDER_ABI,
    functionName: 'getReserveData',
    args: [USDC_ADDRESS],
    // Optionally, specify chainId: 137 for Polygon.
  })

  useEffect(() => {
    if (data) {
      // Cast the returned data to our ReserveDataTuple type.
      const reserveData = data as ReserveDataTuple
      const liquidityRate = reserveData[5]
      console.log('Liquidity Rate (ray):', liquidityRate.toString())
      setApy(calculateAPY(liquidityRate))
    } else if (error) {
      console.error('Error reading reserve data:', error)
    }
  }, [data, error])

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

export default AaveComponent
