import { useState } from 'react'

// Basic Contact Type
interface Contact {
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
  
  return (
      <div className="bg-sectionBackground rounded-xl p-5 shadow-sm border border-gray-100">
	  <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Contactos</h2>
              <button 
		  className="bg-black text-white px-4 py-2 rounded-xl text-sm font-medium"
		  onClick={() => {
		      setCurrentContact(null)
		      setShowAddModal(true)
		  }}
              >
		  Agregar Contacto
              </button>
	  </div>
	  
	  {contacts.length > 0 ? (
              <div className="space-y-3">
		  {/* Contact list will go here */}
              </div>
	  ) : (
              <div className="text-center py-10 bg-itemBackground rounded-xl">
		  <p className="text-gray-500">No hay contactos para mostrar</p>
		  <button 
		      className="mt-4 bg-gray-100 text-gray-800 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-200"
		      onClick={() => {
			  setCurrentContact(null)
			  setShowAddModal(true)
		      }}
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
			      />
			  </div>
		      </div>
		      
		      {/* Modal Actions */}
		      <div className="flex justify-end mt-6 space-x-3">
			  <button
			      className="bg-white text-black border border-gray-300 rounded-xl px-4 py-2.5 font-medium hover:bg-gray-50 transition-colors"
			      onClick={() => setShowAddModal(false)}
			  >
			      Cancelar
			  </button>
			  
			  <button
			      className="bg-black text-white rounded-xl px-4 py-2.5 font-medium transition-colors"
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
