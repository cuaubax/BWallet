import { WalletConnect } from './WalletConnect'

export const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modern Nav Bar */}
      <nav className="bg-white border-b fixed w-full z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex-shrink-0 flex items-center">
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                BaxB Wallet
              </span>
            </div>
            <div className="flex items-center">
              <WalletConnect />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}