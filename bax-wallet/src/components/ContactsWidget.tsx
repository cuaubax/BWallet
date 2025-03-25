import { useState, useEffect } from 'react'
import { create } from "@web3-storage/w3up-client"

// Basic Contact Type
interface Contact {
  // re think this id 
  id: string;
  name: string;
  walletAddress: string;
  email: string;
  phone: string;
}

export const Contacts = () => {
    const [contacts, setContacts] = useState<Contact[]>([])
    const [showAddModal, setShowAddModal] = useState(false)
    const [currentContact, setCurrentContact] = useState<Contact | null>(null)
    const [name, setName] = useState('')
    const [walletAddress, setWalletAddress] = useState('')
    const [email, setEmail] = useState('')
    const [phone, setPhone] = useState('')
    const [error, setError] = useState('')

    useEffect(() => {
	const savedContacts = localStorage.getItem('wallet-contacts')

	if (savedContacts) {
	    try {
		const parsedContacts = JSON.parse(savedContacts)
		setContacts(Object.values(parsedContacts))
	    } catch (err) {
		console.log('Failed to parse contacts:', err)
	    }
	}
    }, [])

    useEffect(() => {
	if (contacts.length > 0) {
	    const contactsObject = contacts.reduce((acc, contact) => {
		acc[contact.walletAddress] = contact
		return acc
	    }, {} as Record<string, Contact>)

	    localStorage.setItem('wallet-contacts', JSON.stringify(contactsObject))
	}
    }, [contacts])

    const handleSaveContact = () => {

	if (!name.trim() || !walletAddress.trim()) {
	    setError('Se require nombre y wallet de contacto')
	    return 
	}

	// Check if wallet address already exists
	if (contacts.some(c => c.walletAddress.toLowerCase() === walletAddress.toLowerCase())) {
	    setError('Ya existe un contacto con esta dirección de wallet')
	    return
	}

	const newContact: Contact = {
	    id: Date.now().toString(),
	    name,
	    walletAddress,
	    email,
	    phone
	}

	setContacts([...contacts, newContact])
	resetForm()
	setShowAddModal(false)
	
    }

    const handleEditContact = () => {
	console.log('Edit contact')
    }

    const handleDeleteContact = () => {
	console.log('Remove contact')
    }

    const handleCloseModal = () => {
	resetForm()
	setShowAddModal(false)
    }

    const resetForm = () => {
	setName('')
	setWalletAddress('')
	setEmail('')
	setPhone('')
	setError('')
    }
    
    
    return (
	<div className="bg-sectionBackground rounded-xl p-5 shadow-sm border border-gray-100">
	    <div className="flex justify-between items-center mb-6">
		<h2 className="text-xl font-semibold">Contactos</h2>
		<button 
		    className="bg-black text-white px-4 py-2 rounded-xl text-sm font-medium"
		    onClick={() => {
			resetForm()
			setShowAddModal(true)
		    }}
		>
		    Agregar Contacto
		</button>
	    </div>
	    
	    {contacts.length > 0 ? (
		<div>
		    {/* Header row */}
		    <div className="flex items-center justify-between px-3 py-2 mb-2">
			<div className="w-1/4 text-xs text-gray-500 font-medium">Nombre</div>
			<div className="w-1/4 text-xs text-gray-500 font-medium">Dirección de Wallet</div>
			<div className="w-1/4 text-xs text-gray-500 font-medium">Email / Teléfono</div>
			<div className="w-1/4 text-xs text-gray-500 font-medium text-right">Acciones</div>
		    </div>
		    
		    {/* Contact cards */}
		    <div className="space-y-3">
			{contacts.map((contact) => (
			    <div key={contact.id} className="bg-itemBackground rounded-xl p-3 hover:bg-gray-100 transition-colors">
				<div className="flex items-center justify-between">
				    {/* Name */}
				    <div className="w-1/4 text-sm font-medium">{contact.name}</div>
				    
				    {/* Wallet Address */}
				    <div className="w-1/4 text-sm text-gray-700">
					{contact.walletAddress.slice(0, 6)}...{contact.walletAddress.slice(-4)}
				    </div>
				    
				    {/* Email/Phone */}
				    <div className="w-1/4 text-sm text-gray-600">
					{contact.email || contact.phone || '-'}
				    </div>
				    
				    {/* Actions */}
				    <div className="w-1/4 flex justify-end space-x-2">
					<button 
					    className="p-2 text-gray-600 hover:text-black rounded-lg hover:bg-gray-200"
					    onClick={handleEditContact}
					>
					    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
					    </svg>
					</button>
					<button 
					    className="p-2 text-gray-600 hover:text-red-500 rounded-lg hover:bg-gray-200"
					    onClick={handleDeleteContact}
					>
					    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
					    </svg>
					</button>
				    </div>
				</div>
			    </div>
			))}
		    </div>
		</div>
	    ) : (
		<div className="text-center py-10 bg-gray-50 rounded-xl">
		    <p className="text-gray-500">No hay contactos para mostrar</p>
		    <button 
			className="mt-4 bg-gray-100 text-gray-800 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-200"
			onClick={() => setShowAddModal(true)}
		    >
			Agregar tu primer contacto
		    </button>
		</div>
	    )}
	    
	    {/* Add/Edit Contact Modal */}
	    {showAddModal && (
		<div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
		    <div className="bg-white p-6 rounded-xl shadow-lg max-w-md w-full">
			<h2 className="text-lg font-semibold mb-5">
			    {currentContact ? 'Editar Contacto' : 'Agregar Contacto'}
			</h2>
			
			<div className="space-y-4">
			    {/* Name Field */}
			    <div>
				<label className="block text-sm text-gray-600 font-medium mb-2">
				    Nombre
				</label>
				<input
				    type="text"
				    placeholder="Nombre del contacto"
				    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-200"
				    value={name}
				    onChange={(e) => setName(e.target.value)}
				/>
			    </div>
			    
			    {/* Wallet Address Field */}
			    <div>
				<label className="block text-sm text-gray-600 font-medium mb-2">
				    Dirección de Wallet
				</label>
				<input
				    type="text"
				    placeholder="0x..."
				    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-200"
				    value={walletAddress}
				    onChange={(e) => setWalletAddress(e.target.value)}
				    disabled={!!currentContact} // Disable editing of wallet address for existing contacts
				/>
			    </div>
			    
			    {/* Email Field */}
			    <div>
				<label className="block text-sm text-gray-600 font-medium mb-2">
				    Email
				</label>
				<input
				    type="email"
				    placeholder="ejemplo@mail.com"
				    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-200"
				    value={email}
				    onChange={(e) => setEmail(e.target.value)}
				/>
			    </div>
			    
			    {/* Phone Field */}
			    <div>
				<label className="block text-sm text-gray-600 font-medium mb-2">
				    Teléfono
				</label>
				<input
				    type="tel"
				    placeholder="+52 123 456 7890"
				    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-200"
				    value={phone}
				    onChange={(e) => setPhone(e.target.value)}
				/>
			    </div>
			    
			    {/* Error message */}
			    {error && (
				<div className="p-3 bg-gray-50 rounded-xl text-sm border border-gray-200 text-red-500">
				    {error}
				</div>
			    )}
			</div>
			
			{/* Modal Actions */}
			<div className="flex justify-end mt-6 space-x-3">
			    <button
				className="bg-white text-black border border-gray-300 rounded-xl px-4 py-2.5 font-medium hover:bg-gray-50 transition-colors"
				onClick={handleCloseModal}
			    >
				Cancelar
			    </button>
			    
			    <button
				className="bg-black text-white rounded-xl px-4 py-2.5 font-medium transition-colors"
				onClick={handleSaveContact}
			    >
				{currentContact ? 'Guardar Cambios' : 'Agregar Contacto'}
			    </button>
			</div>
		    </div>
		</div>
	    )}
	</div>
    )
}
