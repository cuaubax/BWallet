import React, { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSimulateContract } from 'wagmi'
import { emitter } from '../utils/eventBus'
import { parseUnits, erc20Abi } from 'viem'

const FEE_PERCENTAGE = 0.015
const MEXA = {
  symbol: "MEX",
  // Used USDT address for testing purposes. Using MEXA for deployment
  // address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
  address: '0xDF617aA28bbdC3F1004291e1dEC24c617A4AE3aD',
  decimals: 6,
  logoUrl: "/icons/MEXAS.svg"
}

type ServiceType = 'phone' | 'internet' | 'water' | 'power'

interface ServiceInfo {
  id: ServiceType
  name: string
  icon: string
}

const services: ServiceInfo[] = [
    {
      id: 'phone',
      name: 'Teléfono',
      icon: "/icons/Phone.svg"
    },
    {
      id: 'internet',
      name: 'Internet',
      icon: "/icons/Wifi.svg"
    },
    {
      id: 'water',
      name: 'Agua',
      icon: "/icons/WaterDrop.svg"
    },
    {
      id: 'power',
      name: 'Electricidad',
      icon: "/icons/Lightning.svg"
    }
  ]


export const ServiciosWidget = () => {
    const [mounted, setMounted] = useState(false)
    const [modalOpen, setModalOpen] = useState(false)
    const [selectedService, setSelectedService] = useState<ServiceInfo | null>(null)
    const [referenceNumber, setReferenceNumber] = useState('')
    const [amount, setAmount] = useState('')
    const [error, setError] = useState<string | null>(null)

    const { address } = useAccount()
    
    useEffect(() => {
        setMounted(true)
    }, [])

    const handleServiceClick = (service: ServiceInfo) => {
        setSelectedService(service)
        setModalOpen(true)
        setReferenceNumber('')
        setAmount('')
        setError(null)
      }
    
    const handleCloseModal = () => {
        setModalOpen(false)
        setSelectedService(null)
      }
    
    const handleReferenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setReferenceNumber(e.target.value)
        setError(null)
      }
    
    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        if (/^\d*\.?\d*$/.test(value) || value === '') {
          setAmount(value)
          setError(null)
        }
      }

    const handleSubmit = () => {
        // WIP add metamask functions
        console.log("clicked")
    }
    

    return (
        <div className="bg-sectionBackground rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-lg font-medium mb-4">Pago de Servicios</h2>
          
          <div className="grid grid-cols-2 gap-4">
            {services.map((service) => (
              <div 
                key={service.id}
                className={"bg-itemBackground rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:shadow-md transition-shadow h-32"}
                onClick={() => handleServiceClick(service)}
              >
                <div className="bg-white p-3 rounded-full mb-2">
                  <img src={service.icon} alt={service.name} className="w-6 h-6" />
                </div>
                <span className="font-medium text-gray-800">{service.name}</span>
              </div>
            ))}
          </div>
          
          {/* Payment Modal */}
          {modalOpen && selectedService && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-5 max-w-md w-full mx-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">Pago de {selectedService.name}</h3>
                  <button 
                    onClick={handleCloseModal}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                {/* Reference Number Input */}
                <div className="mb-4">
                  <label className="block text-sm text-gray-600 mb-1">Número de Referencia</label>
                  <input
                    type="text"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200"
                    value={referenceNumber}
                    onChange={handleReferenceChange}
                    placeholder="Ingresa el número de referencia"
                  />
                </div>
                
                {/* Amount Input */}
                <div className="mb-5">
                  <label className="block text-sm text-gray-600 mb-1">Monto</label>
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200"
                      value={amount}
                      onChange={handleAmountChange}
                      placeholder="0.00"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      MXN
                    </div>
                  </div>
                </div>
                
                {/* Error Display */}
                {error && (
                  <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                    {error}
                  </div>
                )}
                
                {/* Submit Button */}
                <button
                  className="w-full bg-black text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-800 transition-colors"
                  onClick={handleSubmit}
                >
                  Pagar
                </button>
              </div>
            </div>
          )}
        </div>
      )
}