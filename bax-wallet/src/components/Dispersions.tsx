import { useWalletClient, useChainId} from 'wagmi'
import { useEffect, useState } from 'react'
import { writeContract } from '@wagmi/core'
import { config } from '../config/web3'
import { ethers } from 'ethers'
import Papa from 'papaparse'

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

// Need to change it depending on the network. We use Arbitrum mainnet contract address 
const BATCH_TRANSFER_ADDRESS = '0xE21ecd1683cd23F9EA46F26449a6fe11721Ce7aD' as `0x${string}`
const SEPOLIA = 11155111
const ARBITRUM = 42161 

const tokensList = [
  {
    symbol: 'ETH',
    address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
    decimals: 18,
    logoUrl: "https://cryptologos.cc/logos/ethereum-eth-logo.png?v=040"
  },
  {
    symbol: 'USDT',
    address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', 
    decimals: 6,
    logoUrl: 'https://cryptologos.cc/logos/tether-usdt-logo.svg?v=040'
  },
  {
    symbol: 'MEX',
    address: '0xDF617aA28bbdC3F1004291e1dEC24c617A4AE3aD',
    decimals: 6,
    logoUrl: "/icons/MEXAS.svg"
  },
  {
    symbol: 'WBTC',
    address: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f',
    decimals: 8,
    logoUrl: "https://res.coinpaper.com/coinpaper/wrapped_bitcoin_wbtc_logo_5318368b91.svg"
  }
]

interface Contact {
    id: string;
    name: string;
    walletAddress: string;
    email: string;
    phone: string;
}

export const BatchTransfer = () => {
  const [mounted, setMounted] = useState(false)
  const [recipients, setRecipients] = useState<string[]>([])
  const [amounts, setAmounts] = useState<string[]>([])
  const [csvInput, setCsvInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isERC20, setIsERC20] = useState(false)
  const [tokenAddress, setTokenAddress] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedToken, setSelectedToken] = useState(tokensList[0])

  // Contacts state
    const [contacts, setContacts] = useState<Contact[]>([])
    const [showContactsModal, setShowContactsModal] = useState(false)
    const [selectedContacts, setSelectedContacts] = useState<Contact[]>([])
    
    

  const { data: walletClient } = useWalletClient()
  const chainId = useChainId()

  useEffect(() => {
    setMounted(true)
  }, [])

    useEffect(() => {
	const savedContacts = localStorage.getItem("wallet-contacts")
	if (savedContacts) {
	    try {
		const parsedContacts = JSON.parse(savedContacts)
		setContacts(Object.values(parsedContacts))
	    } catch (err) {
		console.log("Failed to parse contacts:", err)
	    }
	}
    }, [])

    const handleSelectContact = (contact: Contact) => {

	const isSelected = selectedContacts.some(c => c.id === contact.id)

	if (isSelected) {
	    setSelectedContacts(selectedContacts.filter(c => c.id !== contact.id))
	} else {
	    // Add to selection
	    setSelectedContacts([...selectedContacts, contact])
	}
    }

    const addSelectedContactsToRecipients = () => {
	const contactsCSV = selectedContacts.map(contact => `${contact.walletAddress},0`).join('\n')

	const newCSV = csvInput ? `${csvInput}\n${contactsCSV}` : contactsCSV

	setCsvInput(newCSV)
	processInputAreaData(newCSV)

	setShowContactsModal(false)
	setSelectedContacts([])
    }

    async function getSigner() {
    if (!walletClient) {
      throw new Error('No wallet client found. Connect your wallet first!')
    }
    const { transport } = walletClient
    const provider = new ethers.BrowserProvider(transport)
    return provider.getSigner()
  }

  const processInputAreaData = (input: string) => {
    try {

      setError(null)

      // There should be a better way to do this
      // we should not allow empty inputs
      if (!input.trim()) {
        setRecipients([])
        setAmounts([])
        return
      }

      const parsedData = Papa.parse(input, {
        skipEmptyLines: true,
        delimiter: ','
      })
      const lines = parsedData.data as string[][]
      if (lines.length == 0) {
        setError('Archivo vacío')
        return 
      }
      
      const newRecipients: string[] = []
      const newAmounts: string[] = []

      lines.forEach((line, _) => {

        if (line.length >= 2) {
          
          const address = line[0].trim()
          const amount = line[1].trim()

          if (ethers.isAddress(address) && amount) {
            newRecipients.push(address)
            newAmounts.push(amount)
          }
        }
      })

      if (newRecipients.length === 0) {
        setError(`No se encontraron direcciones válidas. Por favor, compruebe el formato.`);
        return;
      }

      setRecipients(newRecipients)
      setAmounts (newAmounts)

    } catch (error) {
      console.log("Error input area: ", error)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
  
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setCsvInput(content);
      processInputAreaData(content);
    };
    reader.readAsText(file);
  }

  const handleTokenChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = tokensList.find(token => token.address === event.target.value) || tokensList[0];
    setSelectedToken(selected);
    
    if (selected.address === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
      setIsERC20(false);
      setTokenAddress('')
    } else {
      setIsERC20(true);
      setTokenAddress(selected.address);
    }
  };
  
  

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        const decimals = selectedToken.decimals
        const parsedAmounts = amounts.map(amt =>
            ethers.parseUnits(amt.trim(), decimals).toString()
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

        // TODO: same here, needs to be inside a 
        // try catch block
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

  if (chainId === SEPOLIA || chainId === ARBITRUM) {
    return (
	<div className="bg-sectionBackground rounded-xl p-5 shadow-sm">
            <h2 className="text-xl font-semibold mb-6">Dispersión Múltiple</h2>
	    
            {/* Token Selection Dropdown */}
            <div className="mb-5">
		<label className="block text-sm text-gray-600 font-medium mb-2">
		    Selecciona Token
		</label>
		
		<div className="relative">
		    <div className="flex items-center absolute left-0 top-0 h-full ml-4 pointer-events-none">
			<img 
			    src={selectedToken.logoUrl} 
			    alt={selectedToken.symbol} 
			    className="w-5 h-5 rounded-full" 
			/>
		    </div>
		    
		    <select
			className="w-full bg-itemBackground border border-gray-200 rounded-xl pl-12 pr-10 py-3 appearance-none focus:outline-none focus:ring-2 focus:ring-gray-200"
				   value={selectedToken.address}
				   onChange={handleTokenChange}
		    >
			{tokensList.map((token) => (
			    <option key={token.address} value={token.address}>
				{token.symbol}
			    </option>
			))}
		    </select>
		    
		    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
			<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
			    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"></path>
			</svg>
		    </div>
		</div>
	    </div>

            
            {/* CSV File Upload */}
            <div className="mb-5">
		<label className="block text-sm text-gray-600 font-medium mb-2">
		    Cargar archivo CSV
		</label>
		<div className="flex items-center justify-center w-full">
		    <label className="flex flex-col w-full h-32 border-2 border-gray-200 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
			<div className="bg-itemBackground flex flex-col items-center justify-center pt-7">
			    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
			    </svg>
			    <p className="pt-1 text-sm tracking-wider text-gray-400 group-hover:text-gray-600">
				Selecciona un archivo CSV
			    </p>
			    <p className="text-xs text-gray-500 mt-1">
				Formato: dirección,monto (una por línea)
			    </p>
			</div>
			<input 
			    type="file" 
			    className="opacity-0" 
			    accept=".csv"
			    onChange={handleFileUpload}
			/>
		    </label>
		</div>
            </div>

	    {/* Contacts selection button */}
	    <div className="mb-5">
		<button 
		    className="w-full bg-gray-100 text-gray-800 py-3 px-4 rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center justify-center"
		    onClick={() => setShowContactsModal(true)}
		>
		    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
		    </svg>
		    Seleccionar Contactos
		</button>
	    </div>
            
            {/* Manual Input Area */}
            <div className="mb-5">
		<label className="block text-sm text-gray-600 font-medium mb-2">
		    Direcciones y montos
		</label>
		<textarea
		    placeholder="0x1234...5678,0.1&#10;0x8765...4321,0.2&#10;..."
		    className="w-full bg-itemBackground border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-200"
		    rows={6}
		    value={csvInput}
		    onChange={(e) => {
			setCsvInput(e.target.value);
			processInputAreaData(e.target.value);
		    }}
		/>
		<p className="mt-1 text-xs text-gray-500">
		    Formato: dirección,monto (una por línea)
		</p>
            </div>
	    
            {/* Recipients Summary */}
            {recipients.length > 0 && (
		<div className="mb-5 bg-gray-50 rounded-xl p-4 border border-gray-200">
		    <div className="flex justify-between items-center">
			<span className="text-sm font-medium">Destinatarios:</span>
			<span className="text-sm font-bold">{recipients.length}</span>
		    </div>
		    <div className="flex justify-between items-center mt-2">
			<span className="text-sm font-medium">Total a enviar:</span>
			<span className="text-sm font-bold">
			    {amounts.reduce((acc, amt) => acc + parseFloat(amt), 0).toFixed(4)} {selectedToken.symbol}
			</span>
		    </div>
		</div>
            )}
            
            {/* Error Display */}
            {error && (
		<div className="mb-5 p-4 bg-gray-50 rounded-xl text-sm border border-gray-200">
		    <div className="flex items-start">
			<svg className="w-5 h-5 text-gray-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
			    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
			</svg>
			<span>{error}</span>
		    </div>
		</div>
            )}
	    
            {/* Transfer Button */}
            <button
		className="w-full bg-black text-white py-3.5 px-4 rounded-xl font-medium disabled:bg-gray-300 disabled:text-gray-500 transition-colors"
			   onClick={handleTransfer}
			   disabled={isLoading || recipients.length === 0}
            >
		{isLoading ? (
		    <div className="flex items-center justify-center">
			<svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
			    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
			    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
			</svg>
			Procesando...
		    </div>
		) : (
		    'Transferir'
		)}
            </button>

	    {/* Contacts Selection Modal */}
	    {showContactsModal && (
		<div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
		    <div className="bg-white p-6 rounded-xl shadow-lg max-w-lg w-full">
			<h2 className="text-lg font-semibold mb-5">
			    Seleccionar Contactos
			</h2>
			
			{contacts.length > 0 ? (
			    <div className="max-h-96 overflow-y-auto">
				<div className="space-y-2">
				    {contacts.map((contact) => (
					<div 
					    key={contact.id} 
					    className={`p-3 rounded-xl cursor-pointer flex items-center justify-between transition-colors ${
                  selectedContacts.some(c => c.id === contact.id) 
                    ? 'bg-black text-white' 
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
					    onClick={() => handleSelectContact(contact)}
					>
					    <div className="flex items-center">
						<div className="font-medium">{contact.name}</div>
						<div className="text-sm ml-2 opacity-70">
						    {contact.walletAddress.slice(0, 6)}...{contact.walletAddress.slice(-4)}
						</div>
					    </div>
					    
					    <div>
						{selectedContacts.some(c => c.id === contact.id) && (
						    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
						    </svg>
						)}
					    </div>
					</div>
				    ))}
				</div>
			    </div>
			) : (
			    <div className="text-center py-8">
				<p className="text-gray-500">No hay contactos guardados</p>
			    </div>
			)}
			
			{/* Modal Actions */}
			<div className="flex justify-end mt-6 space-x-3">
			    <button
				className="bg-white text-black border border-gray-300 rounded-xl px-4 py-2.5 font-medium hover:bg-gray-50 transition-colors"
				onClick={() => {
				    setShowContactsModal(false)
				    setSelectedContacts([])
				}}
			    >
				Cancelar
			    </button>
			    
			    <button
				className="bg-black text-white rounded-xl px-4 py-2.5 font-medium transition-colors"
				onClick={addSelectedContactsToRecipients}
				disabled={selectedContacts.length === 0}
			    >
				Agregar {selectedContacts.length > 0 ? `(${selectedContacts.length})` : ''}
			    </button>
			</div>
		    </div>
		</div>
	    )}

	    
	</div>
    );
  } else {
    return (
      <div className="w-full p-6 bg-gray-50 text-gray-800 text-lg font-semibold text-center rounded-xl shadow-sm border border-gray-200">
        <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        Función no disponible en esta red
      </div>
    )

}
}
