'use client'

import { ServiceOrderForm } from '@/components/service-order-form'

export default function TestServiceOrderPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Teste - Ordem de Serviço Apple
          </h1>
          <p className="text-gray-600 mt-2">
            Página de teste para o formulário de ordem de serviço
          </p>
        </div>
        
        <ServiceOrderForm />
      </div>
    </div>
  )
}