// src/components/EarnWidget.tsx
import { useEffect, useState } from 'react'
import { useAccount, useReadContract } from 'wagmi'
import { ethers } from 'ethers'


// Aave Pool address provider
const AAVE_POOL_ADDRESS_PROVIDER = '0xa97684ead0e402dC232d5A977953DF7ECBaB3CDb'
// Aave V3 Data Provider address on Polygon (example address)
const AAVE_DATA_PROVIDER_ADDRESS = '0x68100bD5345eA474D93577127C11F39FF8463e93'
// Official USDC address on Polygon
const USDC_ADDRESS = '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359'

// JSON ABI for getReserveData (using the official view contract format)
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
];

function calculateAPY(liquidityRate: bigint): string {
  const apr = Number(liquidityRate) / 1e27;
  const secondsPerYear = 31536000;
  const apy = (Math.pow(1 + apr / secondsPerYear, secondsPerYear) - 1) * 100;
  return apy.toFixed(2);
}

export const AaveComponent = () => {
  const { address, isConnected } = useAccount()
  const [apy, setApy] = useState<string | null>(null)

  const { data, isLoading, error } = useReadContract({
    address: AAVE_DATA_PROVIDER_ADDRESS,
    abi: UI_POOL_DATA_PROVIDER_ABI,
    functionName: 'getReservesData',
    args: [AAVE_POOL_ADDRESS_PROVIDER]
  })

  useEffect(() => {
    if (data) {
      console.log('ok')
      console.log(typeof data)
      console.log(data[0][0])
      console.log(Object.keys(data[0][0]))

      const usdcReserve = data[0].find(
        (reserve: any) => reserve.underlyingAsset.toLowerCase() === USDC_ADDRESS.toLowerCase()
      )
      // Cast the returned data to our ReserveDataTuple type.
      /*
      const reserveData = data as ReserveDataTuple
      const liquidityRate = reserveData[5]
      console.log('Liquidity Rate (ray):', liquidityRate.toString())
      setApy(calculateAPY(liquidityRate))
      */

      if (usdcReserve) {
        console.log('USDC Reserve:', usdcReserve);
        const liquidityRate = usdcReserve.liquidityRate;
        console.log('Liquidity Rate (ray):', liquidityRate.toString());
        const computedAPY = calculateAPY(liquidityRate);
        setApy(computedAPY);
      } else {
        console.error('USDC reserve not found');
      }
    } else if (error) {
      console.error('Error reading reserve data:', error)
    }
  }, [data, error])

  if (!isConnected) return <div>Please connect your wallet.</div>

  const placeholderBalance = '4.61'

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Supply</h2>
      <table className="w-full text-left">
        <thead>
          <tr className="border-b">
            <th className="py-2">Asset</th>
            <th className="py-2">Wallet balance</th>
            <th className="py-2">APY</th>
            <th className="py-2"></th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b">
            {/* Asset column */}
            <td className="py-2">
              <div className="flex items-center">
                {/* If you have a local USDC icon, reference it here. Otherwise, remove the img. */}
                <img src="/usdc-icon.png" alt="USDC" className="h-6 w-6 mr-2" />
                <span className="font-medium">USDC</span>
              </div>
            </td>

            {/* Placeholder wallet balance column */}
            <td className="py-2">{placeholderBalance}</td>

            {/* APY column */}
            <td className="py-2">{apy ? `${apy}%` : 'Loading...'}</td>

            {/* Supply button column */}
            <td className="py-2 text-right">
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={() => console.log('Supply button pressed')}
              >
                Supply
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

export default AaveComponent
