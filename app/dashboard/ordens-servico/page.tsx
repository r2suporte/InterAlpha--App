'use client'

import { ServiceOrderForm } from '@/components/service-order-form'

export default function OrdensServicoPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Ordens de Serviço
          </h1>
          <p className="text-gray-600 mt-2">
            Autorizada Apple - Criação de ordem de serviço para dispositivos Apple
          </p>
        </div>
        
        <ServiceOrderForm />
      </div>
    </div>
  )
}