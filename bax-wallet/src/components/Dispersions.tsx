import { useAccount, useWalletClient, useChainId} from 'wagmi'
import { useEffect, useState } from 'react'
import { writeContract } from '@wagmi/core'
import { config } from '../config/web3'
import { ethers } from 'ethers'

const BATCH_TRANSFER_ABI = [
  {
    inputs: [
      { internalType: 'address[]', name: 'recipients', type: 'address[]' },
      { internalType: 'uint256[]', name: 'amounts', type: 'uint256[]' }
    ],
    name: 'batchTransferETH',
    outputs: [],
    stateMutability: 'payable',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'contract IERC20', name: 'token', type: 'address' },
      { internalType: 'address[]', name: 'recipients', type: 'address[]' },
      { internalType: 'uint256[]', name: 'amounts', type: 'uint256[]' }
    ],
    name: 'batchTransferERC20',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  }
]

// Need to change it depending on the network. We use Sepolia's contract address for POC 
const BATCH_TRANSFER_ADDRESS = '0x09579e61a95792be2440fe2da011ec47fbfc9861' as `0x${string}`
const SEPOLIA = 11155111

export const BatchTransfer = () => {
  const [mounted, setMounted] = useState(false)
  const [recipients, setRecipients] = useState<string[]>([])
  const [amounts, setAmounts] = useState<string[]>([])
  const [isERC20, setIsERC20] = useState(false)
  const [tokenAddress, setTokenAddress] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const { address, isConnected } = useAccount()
  const { data: walletClient } = useWalletClient()
  const chainId = useChainId()


  useEffect(() => {
    setMounted(true)
  }, [])

  async function getSigner() {
    if (!walletClient) {
      throw new Error('No wallet client found. Connect your wallet first!')
    }
    const { transport } = walletClient
    const provider = new ethers.BrowserProvider(transport)
    return provider.getSigner()
  }

  const approveToken = async (tokenAddr: string, totalAmount: string) => {
    try {
        const signer = await getSigner()
        const token = new ethers.Contract(
        tokenAddr,
        ["function approve(address spender, uint256 amount) public returns (bool)"],
        signer
        )
        const tx = await token.approve(BATCH_TRANSFER_ADDRESS, totalAmount)
        await tx.wait()
    } catch (error: any) {
        if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
            console.log('User rejected the transaction.')
        } else {
            console.error('Transfer failed:', error)
        }
    } finally {
        setIsLoading(false)
    }
}

  const handleTransfer = async () => {
    try {
      setIsLoading(true)

      if (isERC20) {
        // Also needs some work, decimal places will vary form
        // token to token and from chain to chain
        const parsedAmounts = amounts.map(amt =>
            ethers.parseUnits(amt.trim(), 18).toString()
          )
        
          const totalAmount = parsedAmounts
          .map(BigInt)
          .reduce((acc, cur) => acc + cur, BigInt(0))
          .toString()

        await approveToken(tokenAddress, totalAmount)

        // This would also need to be inside a try-catch block
        await writeContract(config, {
          address: BATCH_TRANSFER_ADDRESS,
          abi: BATCH_TRANSFER_ABI,
          functionName: 'batchTransferERC20',
          args: [tokenAddress, recipients, parsedAmounts]
        })
      } else {
        
        const parsedAmounts = amounts.map((amt) =>
          ethers.parseEther(amt.trim()).toString()
        )
        
        const totalValue = parsedAmounts.reduce(
          (acc, cur) => BigInt(acc) + BigInt(cur),
          BigInt(0)
        )

        await writeContract(config, {
          address: BATCH_TRANSFER_ADDRESS,
          abi: BATCH_TRANSFER_ABI,
          functionName: 'batchTransferETH',
          args: [recipients, parsedAmounts],
          value: totalValue
        })
      }
    } catch (error) {
      console.error('Transfer failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!mounted) return null

  if (chainId === SEPOLIA) {
    return (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-6">Batch Transfer</h2>
    
          {/* Token Type Selection */}
          <div className="mb-4">
            <div className="flex space-x-4">
              <button
                className={`px-4 py-2 rounded ${
                  !isERC20 ? 'bg-blue-500 text-white' : 'bg-gray-200'
                }`}
                onClick={() => setIsERC20(false)}
              >
                ETH
              </button>
              <button
                className={`px-4 py-2 rounded ${
                  isERC20 ? 'bg-blue-500 text-white' : 'bg-gray-200'
                }`}
                onClick={() => setIsERC20(true)}
              >
                ERC20
              </button>
            </div>
          </div>
    
          {/* ERC20 Token Address Input */}
          {isERC20 && (
            <div className="mb-4">
              <input
                type="text"
                placeholder="Token Address"
                className="w-full p-2 border rounded"
                value={tokenAddress}
                onChange={(e) => setTokenAddress(e.target.value)}
              />
            </div>
          )}
    
          {/* Recipients Input */}
          <div className="mb-4">
            <textarea
              placeholder="Enter addresses (one per line)"
              className="w-full p-2 border rounded"
              rows={5}
              onChange={(e) =>
                setRecipients(e.target.value.split('\n').filter((line) => line.trim()))
              }
            />
          </div>
    
          {/* Amounts Input */}
          <div className="mb-4">
            <textarea
              placeholder="Enter amounts (one per line)"
              className="w-full p-2 border rounded"
              rows={5}
              onChange={(e) =>
                setAmounts(e.target.value.split('\n').filter((line) => line.trim()))
              }
            />
          </div>
    
          {/* Transfer Button */}
          <button
            className="w-full bg-blue-500 text-white py-2 px-4 rounded disabled:bg-gray-300"
            onClick={handleTransfer}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Transfer'}
          </button>
        </div>
      )
  } else {
    return (
        <div className="w-full p-6 bg-red-600 text-white text-lg font-semibold text-center rounded-lg shadow-lg">
            🚫 This feature is unavailable on the current network. Please switch to the correct network.
        </div>
    )
  }

}
