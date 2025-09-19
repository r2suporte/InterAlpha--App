'use client'

import React, { useState } from 'react'
import EquipamentoForm from '@/components/equipamentos/EquipamentoForm'
import { EquipamentoFormData } from '@/types/equipamentos'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function EquipamentosPage() {
  const [equipamentos, setEquipamentos] = useState<EquipamentoFormData[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (data: EquipamentoFormData) => {
    setIsLoading(true)
    
    try {
      // Simular salvamento
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setEquipamentos(prev => [...prev, { ...data, id: Date.now().toString() }])
      
      console.log('Equipamento cadastrado:', data)
      alert('Equipamento cadastrado com sucesso!')
    } catch (error) {
      console.error('Erro ao cadastrar equipamento:', error)
      alert('Erro ao cadastrar equipamento')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Sistema de Cadastro de Equipamentos Apple</h1>
        <p className="text-gray-600">
          Cadastro completo para empresa autorizada Apple - MacBook, iMac, iPad e mais
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <EquipamentoForm 
            onSubmit={handleSubmit}
            isLoading={isLoading}
          />
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Equipamentos Cadastrados ({equipamentos.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {equipamentos.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  Nenhum equipamento cadastrado ainda
                </p>
              ) : (
                <div className="space-y-3">
                  {equipamentos.slice(-5).map((equipamento, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="font-medium">
                        {equipamento.tipo.replace('_', ' ').toUpperCase()} - {equipamento.modelo}
                      </div>
                      <div className="text-sm text-gray-600">
                        Serial: {equipamento.serial_number}
                      </div>
                      <div className="text-sm text-gray-600">
                        Garantia: {equipamento.status_garantia}
                      </div>
                    </div>
                  ))}
                  {equipamentos.length > 5 && (
                    <p className="text-xs text-gray-500 text-center">
                      ... e mais {equipamentos.length - 5} equipamentos
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}