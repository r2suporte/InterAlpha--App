import { useState } from 'react'
import { OrdemServicoFormData, OrdemServico } from '@/types/ordens-servico'

interface UseOrdemServicoUpdateReturn {
  updateOrdemServico: (id: string, data: Partial<OrdemServicoFormData>) => Promise<OrdemServico | null>
  loading: boolean
  error: string | null
}

export function useOrdemServicoUpdate(): UseOrdemServicoUpdateReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateOrdemServico = async (
    id: string, 
    data: Partial<OrdemServicoFormData>
  ): Promise<OrdemServico | null> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/ordens-servico/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao atualizar ordem de serviço')
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Erro ao atualizar ordem de serviço')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      console.error('Erro ao atualizar ordem de serviço:', err)
      return null
    } finally {
      setLoading(false)
    }
  }

  return {
    updateOrdemServico,
    loading,
    error
  }
}