// src/components/AaveWidget.tsx
import { useEffect, useState } from 'react'

export const AaveComponent = () => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Lend & Borrow</h2>
      <iframe
        src="https://app.aave.com/markets/?marketName=proto_sepolia_v3"
        height="500px"
        width="100%"
        style={{
          border: "none",
          borderRadius: "12px",
          position: 'relative',
          zIndex: 10
        }}
      />
    </div>
  )
}