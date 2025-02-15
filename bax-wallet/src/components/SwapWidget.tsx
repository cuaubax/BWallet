import { useAccount } from 'wagmi'
import { useEffect, useState, useRef } from 'react'
import { createCowSwapWidget, CowSwapWidgetParams, TradeType } from '@cowprotocol/widget-lib'

export const SwapWidget = () => {
  const [mounted, setMounted] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (containerRef.current && mounted && window.ethereum) {
      const params: CowSwapWidgetParams = {
        appCode: "BaxB-Wallet",
        width: "100%",
        height: "500px",
        chainId: 11155111,
        tokenLists: [
          "https://files.cow.fi/tokens/CoinGecko.json",
          "https://files.cow.fi/tokens/CowSwap.json"
        ],
        tradeType: TradeType.SWAP,
        standaloneMode: true,
        theme: "dark",
      }

      createCowSwapWidget(containerRef.current, { 
        params, 
        provider: window.ethereum 
      })
    }
  }, [mounted])

  if (!mounted) return null

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Swap Tokens</h2>
      <div 
        ref={containerRef} 
        style={{
          height: '500px',
          position: 'relative',
          zIndex: 10
        }}
      />
    </div>
  )
}