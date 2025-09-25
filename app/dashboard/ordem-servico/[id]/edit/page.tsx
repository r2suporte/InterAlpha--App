'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { ArrowLeft, AlertCircle } from 'lucide-react'
import { OrdemServico, OrdemServicoFormData } from '@/types/ordens-servico'
import OrdemServicoForm from '@/components/OrdemServicoForm'
import { useLoadingState } from '@/components/ui/loading-states'
import { useToast } from '@/components/ui/toast-system'
import { PageLoading } from '@/components/ui/loading'

// Função para converter OrdemServico para OrdemServicoFormData
const convertToFormData = (ordem: OrdemServico): OrdemServicoFormData => {
  return {
    numero_os: ordem.numero_os,
    cliente_id: ordem.cliente_id,
    cliente_portal_id: ordem.cliente_portal_id,
    equipamento_id: ordem.equipamento_id,
    serial_number: ordem.serial_number,
    imei: ordem.imei || '', // Converte undefined para string vazia
    tipo_servico: ordem.tipo_servico || '',
    titulo: ordem.titulo,
    descricao: ordem.descricao,
    problema_reportado: ordem.problema_reportado,
    descricao_defeito: ordem.descricao_defeito,
    estado_equipamento: ordem.estado_equipamento,
    diagnostico_inicial: ordem.diagnostico_inicial || '',
    analise_tecnica: ordem.analise_tecnica || '',
    status: ordem.status,
    prioridade: ordem.prioridade,
    tecnico_id: ordem.tecnico_id || '',
    valor_servico: ordem.valor_servico.toString(),
    valor_pecas: ordem.valor_pecas.toString(),
    data_inicio: ordem.data_inicio || '',
    data_previsao_conclusao: ordem.data_previsao_conclusao || '',
    observacoes_cliente: ordem.observacoes_cliente || '',
    observacoes_tecnico: ordem.observacoes_tecnico || '',
    garantia_servico_dias: ordem.garantia_servico_dias.toString(),
    garantia_pecas_dias: ordem.garantia_pecas_dias.toString()
  }
}

export default function EditOrdemServicoPage() {
  const params = useParams()
  const router = useRouter()
  const [ordem, setOrdem] = useState<OrdemServico | null>(null)
  const { isLoading, startLoading, stopLoading } = useLoadingState()
  const { error: showError } = useToast()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOrdem = async () => {
      try {
        startLoading()
        const response = await fetch(`/api/ordens-servico/${params.id}`)
        
        if (!response.ok) {
          throw new Error('Ordem de serviço não encontrada')
        }
        
        const data = await response.json()
        setOrdem(data)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar ordem de serviço'
        setError(errorMessage)
        showError('Erro ao carregar ordem de serviço', errorMessage)
      } finally {
        stopLoading()
      }
    }

    if (params.id) {
      fetchOrdem()
    }
  }, [params.id, startLoading, stopLoading, showError])

  const handleSave = (dados: OrdemServicoFormData) => {
    // Aqui você pode implementar a lógica de salvamento
    console.log('Dados salvos:', dados)
    router.push(`/dashboard/ordem-servico/${params.id}`)
  }

  const handleCancel = () => {
    router.back()
  }

  if (isLoading) {
    return (
      <SidebarProvider>
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col items-center justify-center">
            <PageLoading text="Carregando ordem de serviço..." />
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  if (error || !ordem) {
    return (
      <SidebarProvider>
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col items-center justify-center">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Erro ao carregar</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-6 p-6">
            {/* Header */}
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleCancel}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  Editar OS {ordem.numero_os}
                </h1>
                <p className="text-gray-600">{ordem.titulo}</p>
              </div>
            </div>

            {/* Formulário */}
            <div className="max-w-4xl">
              <OrdemServicoForm
                ordemServico={convertToFormData(ordem)}
                onSave={handleSave}
                onCancel={handleCancel}
              />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}