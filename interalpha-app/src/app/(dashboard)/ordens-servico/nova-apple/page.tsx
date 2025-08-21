'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { OrdemServicoAppleForm } from '@/components/ordens-servico/OrdemServicoAppleForm'
import { OrdemServicoApple } from '@/types/ordem-servico-apple'
import { toast } from 'sonner'

export default function NovaOrdemServicoApplePage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  const handleSave = async (ordem: OrdemServicoApple) => {
    setSaving(true)
    try {
      // Calcular valor total
      const valorTotal = (ordem.valorPecas || 0) + (ordem.valorMaoDeObra || 0) - (ordem.desconto || 0)
      
      const ordemCompleta = {
        ...ordem,
        valorTotal,
        createdAt: new Date(),
        updatedAt: new Date(),
        criadoPor: 'current-user', // TODO: Pegar do contexto de autenticação
        atualizadoPor: 'current-user'
      }

      // Fazer chamada para API
      const response = await fetch('/api/ordens-servico/apple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ordemCompleta),
      })

      if (!response.ok) {
        throw new Error('Erro ao salvar ordem de serviço')
      }

      const result = await response.json()
      
      toast.success('Ordem de Serviço Apple criada com sucesso!')
      router.push(`/ordens-servico/${result.id}`)
      
    } catch (error) {
      console.error('Erro ao salvar:', error)
      toast.error('Erro ao salvar ordem de serviço. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    router.push('/ordens-servico')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <OrdemServicoAppleForm
        onSave={handleSave}
        onCancel={handleCancel}
      />
      
      {saving && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span>Salvando Ordem de Serviço Apple...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}