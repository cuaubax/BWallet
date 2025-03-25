import { useAccount, useBalance, useChainId, useReadContracts } from 'wagmi'
import { useEffect, useState } from 'react'
import { Address, erc20Abi } from 'viem'
import { formatUnits } from 'ethers'
import { emitter } from '../utils/eventBus'
import axios from 'axios'

// bitcoin, tether, ethereum

const chainToExplorerUrlAddress: { [chainId: number]: string } = {
  137: "https://polygonscan.com/address/{address}",
  42161: "https://arbiscan.io/address/{address}",
  11155111: "https://sepolia.etherscan.io/address/{address}",
  11155420: "https://sepolia.optimistic.etherscan.io/address/{address}",
  421614: "https://sepolia.arbiscan.io/address/{address}",
  80002: "https://amoy.polygonscan.com/address/{address}",
}

function getExplorerUrl(chainId: number, walletAddress: string): string {
  const urlTemplate = chainToExplorerUrlAddress[chainId];
  return urlTemplate ? urlTemplate.replace("{address}", walletAddress) : "";
}

function formatPesos(value: number): string {
    return value.toLocaleString("en-US", {
	minimumFractionDigits: 2,
	maximumFractionDigits: 2,
    })
}


export const WalletBalance = () => {
    const [mounted, setMounted] = useState(false)
    const { address, isConnected } = useAccount()
    const [balanceUSDC, setBalanceUSDC] = useState<string | null>(null)
    const [balanceWETH, setBalanceWETH] = useState<string | null>(null)
    const [balanceWBTC, setBalanceWBTC] = useState<string | null>(null)
    const [priceWBTC, setPriceWBTC] = useState<string | null>(null)
    const [priceETH, setPriceETH] = useState<string | null>(null)
    const [priceUSDT, setPriceUSDT] = useState<string | null>(null)
    const [valueETH, setValueETH] = useState<string | null>(null)
    const [valueUSDT, setValueUSDT] = useState<string | null>(null)
    const [valueWBTC, setValueWBTC] = useState<string | null>(null)
    const [portfolioValue, setPortfolioValue] = useState<string | null>('0')
    const [expanded, setExpanded] = useState(false)
    const { data: balance , refetch: refetchNativeBalance} = useBalance({
	address,
    })
    const chainId = useChainId()

    const walletURL = getExplorerUrl(chainId, address as string)

    const { data: balanceData, refetch} = useReadContracts({
      contracts: [
        {
          // Hard coded USDT arbitrum address
          address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
          abi: erc20Abi,
          functionName: "balanceOf",
          chainId: 42161,
          args: [address as Address]
        },
        {
          // Hard coded arbitrum MEXA address
          address: '0xDF617aA28bbdC3F1004291e1dEC24c617A4AE3aD',
          abi: erc20Abi,
          functionName: "balanceOf",
          chainId: 42161,
          args: [address as Address]
        },
        {
          // hard coded WBTC in arbitrum
          address: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f',
          abi: erc20Abi,
          chainId: 42161,
          functionName: "balanceOf",
          args: [address as Address]
        }
      ]
    })

    async function getCryptoMXNPrice() {
      try {
        const response = await axios.get("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin%2Ctether%2Cethereum&vs_currencies=mxn&include_market_cap=false&include_24hr_vol=false&include_24hr_change=false&include_last_updated_at=false", 
          {
            headers: {
              "Content-Type": "application/json",
              "x-cg-demo-api-key": "CG-fJarKx5YRsi4SPEk1dfKVeik"
            }
          }
        )

        if (response?.data) {
          setPriceETH(response.data.ethereum?.mxn?.toString() || null)
          setPriceUSDT(response.data.tether?.mxn?.toString() || null)
          setPriceWBTC(response.data.bitcoin?.mxn?.toString() || null)
      }
      
      } catch (error) {
        console.log("Some error")
      }
    }
    
  
    // Prevent hydration errors by only rendering after mount
    useEffect(() => {
      setMounted(true)
      getCryptoMXNPrice()
    }, [])

    useEffect(() => {
      const handleBalanceUpdate = () => {
        refetch()
        refetchNativeBalance()
        getCryptoMXNPrice()
      }
    
      emitter.on('balanceUpdated', handleBalanceUpdate);
      return () => {
        emitter.off('balanceUpdated', handleBalanceUpdate);
      }
    }, [refetch, refetchNativeBalance])

    useEffect(() => {
	if (priceETH && priceUSDT && priceWBTC && balance && balanceUSDC && balanceWBTC && balanceWETH) {
            const valueETH = parseFloat(priceETH) * parseFloat(balance.formatted ?? "0")
            const valueUSDT = parseFloat(priceUSDT) * parseFloat(balanceUSDC ?? "0")
            const valueWBTC = parseFloat(priceWBTC) * parseFloat(balanceWBTC ?? "0")
            const totalPorfolioValue = valueETH + valueUSDT + valueWBTC + parseFloat(balanceWETH ?? "0")
            setValueETH(formatPesos(valueETH))
            setValueUSDT(formatPesos(valueUSDT))
            setValueWBTC(formatPesos(valueWBTC))
            setPortfolioValue(formatPesos(totalPorfolioValue))
	}
    }, [priceETH, priceUSDT, priceWBTC, balance, balanceUSDC, balanceWBTC, balanceWETH])

    useEffect(() => {
      if (!balanceData) {
        refetch()
        return
      }
      
      const rawBalanceUSDC = balanceData[0]?.result
      const rawBalanceWETH = balanceData[1]?.result
      const rawBalanceWBTC = balanceData[2]?.result
      
      if (rawBalanceUSDC != null && rawBalanceWETH != null && rawBalanceWBTC != null) {
        // Hardcoded both decimal places
        setBalanceUSDC(formatUnits(rawBalanceUSDC, 6))
        setBalanceWETH(formatUnits(rawBalanceWETH, 6))
        // For WBTC decimals change
        setBalanceWBTC(formatUnits(rawBalanceWBTC,8))
      }
    }, [balanceData, refetch]);

    useEffect(() => {
      if (balance && balanceUSDC && balanceWBTC && balanceWETH) {

      }
    })
  
    if (!mounted) return null
    if (!isConnected) return null
  
    return (
	<div className="bg-sectionBackground rounded-xl p-5 shadow-sm border border-gray-100 mb-8">
            {/* Header with title and wallet link */}
            <div className="flex items-center justify-between mb-6">
		<div className="flex items-center">
		    <button
			onClick={() => window.open(walletURL, '_blank')}
			className="text-xl font-semibold flex items-center hover:text-gray-700 transition-colors"
		    >
			<span>
			    Balance ≈ {portfolioValue ? Number(portfolioValue).toFixed(2) : "—"} MXN
			</span>
			<svg className="w-4 h-4 ml-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
			    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
			</svg>
		    </button>
		</div>
    </div>
	    
            <div className="space-y-3">
		{/* MEXA */}
		<div className="bg-itemBackground rounded-xl p-4 flex items-center justify-between hover:bg-gray-100 transition-colors">
		    <div className="flex items-center space-x-3">
			<div className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm p-1">
			    <img
				src="/icons/MEXAS.svg"
				alt="MEXA"
				className="h-7 w-7"
			    />
			</div>
			<span className="font-medium">MEX</span>
		    </div>
		    <span className="text-lg">
			<span className="font-bold">{balanceWETH ? balanceWETH : "—"}</span> 
			<span className="text-gray-600"> ≈ {balanceWETH ? balanceWETH : "—"} MXN</span>
		    </span>
		</div>

		{/* Dropdown Toggle */}
		<button
		    onClick={() => setExpanded(!expanded)}
		    className="flex items-center text-sm font-medium text-black"
		>
		    <span>{expanded ? "Ocultar" : "Mostrar resto"}</span>
		    <svg
			className="w-4 h-4 ml-1 transform transition-transform duration-200"
			style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
		    >
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
		    </svg>
		</button>

		
		{expanded && (
		    <>
			{/* Native Token (e.g., ETH) */}
			<div className="bg-itemBackground rounded-xl p-4 flex items-center justify-between hover:bg-gray-100 transition-colors">
			    <div className="flex items-center space-x-3">
				<div className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm p-1">
				    <img
					src="https://cryptologos.cc/logos/ethereum-eth-logo.png?v=040"
					     alt="ETH"
					     className="h-7 w-7"
				    />
				</div>
				<span className="font-medium">ETH</span>
			    </div>
			    <span className="text-lg">
				<span className="font-bold">{balance?.formatted}</span> 
				<span className="text-gray-600"> ≈ {valueETH ? valueETH : "—"} MXN</span>
			    </span>
			</div>
			
			{/* WBTC */}
			<div className="bg-itemBackground rounded-xl p-4 flex items-center justify-between hover:bg-gray-100 transition-colors">
			    <div className="flex items-center space-x-3">
				<div className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm p-1">
				    <img
					src="https://res.coinpaper.com/coinpaper/wrapped_bitcoin_wbtc_logo_5318368b91.svg"
					     alt="WBTC"
					     className="h-7 w-7"
				    />
				</div>
				<span className="font-medium">WBTC</span>
			    </div>
			    <span className="text-lg">
				<span className="font-bold">{balanceWBTC ? balanceWBTC : '—'}</span> 
				<span className="text-gray-600"> ≈ {valueWBTC ? valueWBTC : "—"} MXN</span>
			    </span>
			</div>
			
			{/* USDT */}
			<div className="bg-itemBackground rounded-xl p-4 flex items-center justify-between hover:bg-gray-100 transition-colors">
			    <div className="flex items-center space-x-3">
				<div className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm p-1">
				    <img
					src="https://cryptologos.cc/logos/tether-usdt-logo.svg?v=040"
					     alt="USDT"
					     className="h-7 w-7"
				    />
				</div>
				<span className="font-medium">USDT</span>
			    </div>
			    <span className="text-lg">
				<span className="font-bold">{balanceUSDC ? balanceUSDC : '—'}</span> 
				<span className="text-gray-600"> ≈ {valueUSDT ? valueUSDT : "—"} MXN</span>
			    </span>
			</div>
		    </>
		)}
            </div>
	</div>
    )
}
  
