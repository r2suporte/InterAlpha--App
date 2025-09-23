'use client'

import React, { useState } from 'react'
import EquipamentoForm from '@/components/equipamentos/EquipamentoForm'
import { EquipamentoFormData, StatusGarantia } from '@/types/equipamentos'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataField, DataCard } from '@/components/ui/data-display'
import { StatusBadge, StatusType } from '@/components/ui/status-badge'
import { Laptop, Hash, Shield } from 'lucide-react'

// Função para mapear status de garantia para StatusType
const mapGarantiaToStatus = (status: StatusGarantia): StatusType => {
  switch (status) {
    case 'ativa_apple':
      return 'success'
    case 'ativa_loja':
      return 'warning'
    case 'verificando':
      return 'pending'
    case 'expirada':
      return 'error'
    default:
      return 'info'
  }
}

// Função para obter texto legível do status
const getGarantiaText = (status: StatusGarantia): string => {
  switch (status) {
    case 'ativa_apple':
      return 'Garantia Apple'
    case 'ativa_loja':
      return 'Garantia Loja'
    case 'verificando':
      return 'Verificando'
    case 'expirada':
      return 'Expirada'
    default:
      return status
  }
}

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
                <div className="space-y-4">
                  {equipamentos.slice(-5).map((equipamento, index) => (
                    <DataCard 
                      key={index}
                      title={`${equipamento.tipo.replace('_', ' ').toUpperCase()} - ${equipamento.modelo}`}
                      className="border-l-4 border-l-blue-500"
                    >
                      <div className="space-y-2">
                        <DataField
                          label="Número de Série"
                          value={equipamento.serial_number}
                          icon={Hash}
                          copyable
                        />
                        <DataField
                          label="Status da Garantia"
                          value={
                            <StatusBadge 
                              status={mapGarantiaToStatus(equipamento.status_garantia)}
                              text={getGarantiaText(equipamento.status_garantia)}
                            />
                          }
                          icon={Shield}
                        />
                        <DataField
                          label="Tipo"
                          value={equipamento.tipo.replace('_', ' ').toUpperCase()}
                          icon={Laptop}
                        />
                      </div>
                    </DataCard>
                  ))}
                  {equipamentos.length > 5 && (
                    <p className="text-xs text-gray-500 text-center mt-4">
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