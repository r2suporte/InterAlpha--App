'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  ArrowLeft, 
  Edit, 
  User, 
  Smartphone, 
  Wrench, 
  Calendar,
  DollarSign,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { OrdemServico } from '@/types/ordens-servico'
import { OrdemServicoActions } from '@/components/ordens-servico/OrdemServicoActions'
import { formatarMoeda } from '@/types/financeiro'
import { useLoadingState } from '@/components/ui/loading-states'
import { useToast } from '@/components/ui/toast-system'
import { PageLoading } from '@/components/ui/loading'

const STATUS_COLORS = {
  'aberta': 'bg-blue-100 text-blue-800 border-blue-200',
  'em_andamento': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'aguardando_peca': 'bg-orange-100 text-orange-800 border-orange-200',
  'aguardando_aprovacao': 'bg-purple-100 text-purple-800 border-purple-200',
  'aguardando_cliente': 'bg-indigo-100 text-indigo-800 border-indigo-200',
  'em_teste': 'bg-cyan-100 text-cyan-800 border-cyan-200',
  'concluida': 'bg-green-100 text-green-800 border-green-200',
  'entregue': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'cancelada': 'bg-red-100 text-red-800 border-red-200'
}

const STATUS_LABELS = {
  'aberta': 'Aberta',
  'em_andamento': 'Em Andamento',
  'aguardando_peca': 'Aguardando Peça',
  'aguardando_aprovacao': 'Aguardando Aprovação',
  'aguardando_cliente': 'Aguardando Cliente',
  'em_teste': 'Em Teste',
  'concluida': 'Concluída',
  'entregue': 'Entregue',
  'cancelada': 'Cancelada'
}

const PRIORIDADE_COLORS = {
  'baixa': 'bg-gray-100 text-gray-800 border-gray-200',
  'media': 'bg-blue-100 text-blue-800 border-blue-200',
  'alta': 'bg-orange-100 text-orange-800 border-orange-200',
  'urgente': 'bg-red-100 text-red-800 border-red-200'
}

const PRIORIDADE_LABELS = {
  'baixa': 'Baixa',
  'media': 'Média',
  'alta': 'Alta',
  'urgente': 'Urgente'
}

export default function OrdemServicoDetalhePage() {
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

  const handleOrdemUpdate = (ordemAtualizada: OrdemServico) => {
    setOrdem(ordemAtualizada)
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

  const cliente = ordem.cliente || ordem.cliente_portal

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => router.back()}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">
                    OS {ordem.numero_os}
                  </h1>
                  <p className="text-gray-600">{ordem.titulo}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <OrdemServicoActions 
                  ordem={ordem} 
                  onUpdate={handleOrdemUpdate}
                />
                <Button 
                  variant="outline"
                  onClick={() => router.push(`/dashboard/ordem-servico/${ordem.id}/edit`)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              </div>
            </div>

            {/* Status e Prioridade */}
            <div className="flex items-center gap-4">
              <Badge 
                variant="outline" 
                className={STATUS_COLORS[ordem.status]}
              >
                {STATUS_LABELS[ordem.status]}
              </Badge>
              <Badge 
                variant="outline" 
                className={PRIORIDADE_COLORS[ordem.prioridade]}
              >
                Prioridade: {PRIORIDADE_LABELS[ordem.prioridade]}
              </Badge>
              {ordem.tecnico_nome && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  Técnico: {ordem.tecnico_nome}
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Coluna Principal */}
              <div className="lg:col-span-2 space-y-6">
                {/* Informações do Cliente */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5 text-blue-600" />
                      Cliente
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {cliente ? (
                      <div className="space-y-2">
                        <p className="font-medium">{cliente.nome}</p>
                        <p className="text-gray-600">{cliente.email}</p>
                        <p className="text-gray-600">{cliente.telefone}</p>
                      </div>
                    ) : (
                      <p className="text-gray-500">Informações do cliente não disponíveis</p>
                    )}
                  </CardContent>
                </Card>

                {/* Informações do Equipamento */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Smartphone className="h-5 w-5 text-blue-600" />
                      Equipamento
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div>
                        <span className="font-medium">Serial Number:</span> {ordem.serial_number}
                      </div>
                      {ordem.imei && (
                        <div>
                          <span className="font-medium">IMEI:</span> {ordem.imei}
                        </div>
                      )}
                      <div>
                        <span className="font-medium">Estado:</span> {ordem.estado_equipamento}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Detalhes do Serviço */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wrench className="h-5 w-5 text-blue-600" />
                      Detalhes do Serviço
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Problema Reportado</h4>
                      <p className="text-gray-700">{ordem.problema_reportado}</p>
                    </div>
                    
                    {ordem.descricao_defeito && (
                      <div>
                        <h4 className="font-medium mb-2">Descrição do Defeito</h4>
                        <p className="text-gray-700">{ordem.descricao_defeito}</p>
                      </div>
                    )}
                    
                    {ordem.diagnostico_inicial && (
                      <div>
                        <h4 className="font-medium mb-2">Diagnóstico Inicial</h4>
                        <p className="text-gray-700">{ordem.diagnostico_inicial}</p>
                      </div>
                    )}
                    
                    {ordem.analise_tecnica && (
                      <div>
                        <h4 className="font-medium mb-2">Análise Técnica</h4>
                        <p className="text-gray-700">{ordem.analise_tecnica}</p>
                      </div>
                    )}
                    
                    {ordem.solucao_aplicada && (
                      <div>
                        <h4 className="font-medium mb-2">Solução Aplicada</h4>
                        <p className="text-gray-700">{ordem.solucao_aplicada}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Observações */}
                {(ordem.observacoes_cliente || ordem.observacoes_tecnico) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-600" />
                        Observações
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {ordem.observacoes_cliente && (
                        <div>
                          <h4 className="font-medium mb-2">Observações do Cliente</h4>
                          <p className="text-gray-700">{ordem.observacoes_cliente}</p>
                        </div>
                      )}
                      
                      {ordem.observacoes_tecnico && (
                        <div>
                          <h4 className="font-medium mb-2">Observações do Técnico</h4>
                          <p className="text-gray-700">{ordem.observacoes_tecnico}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Valores */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      Valores
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span>Serviço:</span>
                      <span className="font-medium">{formatarMoeda(ordem.valor_servico)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Peças:</span>
                      <span className="font-medium">{formatarMoeda(ordem.valor_pecas)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Total:</span>
                      <span>{formatarMoeda(ordem.valor_total)}</span>
                    </div>
                    {ordem.valor_aprovado_cliente && (
                      <>
                        <Separator />
                        <div className="flex justify-between text-green-600">
                          <span>Aprovado:</span>
                          <span className="font-medium">{formatarMoeda(ordem.valor_aprovado_cliente)}</span>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Datas */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      Cronograma
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <span className="text-sm text-gray-500">Abertura:</span>
                      <p className="font-medium">{new Date(ordem.data_abertura).toLocaleDateString('pt-BR')}</p>
                    </div>
                    
                    {ordem.data_inicio && (
                      <div>
                        <span className="text-sm text-gray-500">Início:</span>
                        <p className="font-medium">{new Date(ordem.data_inicio).toLocaleDateString('pt-BR')}</p>
                      </div>
                    )}
                    
                    {ordem.data_previsao_conclusao && (
                      <div>
                        <span className="text-sm text-gray-500">Previsão:</span>
                        <p className="font-medium">{new Date(ordem.data_previsao_conclusao).toLocaleDateString('pt-BR')}</p>
                      </div>
                    )}
                    
                    {ordem.data_conclusao && (
                      <div>
                        <span className="text-sm text-gray-500">Conclusão:</span>
                        <p className="font-medium">{new Date(ordem.data_conclusao).toLocaleDateString('pt-BR')}</p>
                      </div>
                    )}
                    
                    {ordem.data_entrega && (
                      <div>
                        <span className="text-sm text-gray-500">Entrega:</span>
                        <p className="font-medium">{new Date(ordem.data_entrega).toLocaleDateString('pt-BR')}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Garantia */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      Garantia
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span>Serviço:</span>
                      <span className="font-medium">{ordem.garantia_servico_dias} dias</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Peças:</span>
                      <span className="font-medium">{ordem.garantia_pecas_dias} dias</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Status de Aprovação */}
                {ordem.aprovacao_cliente && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        Aprovação
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span className="font-medium">Aprovado pelo cliente</span>
                      </div>
                      {ordem.data_aprovacao_cliente && (
                        <p className="text-sm text-gray-500 mt-1">
                          Em {new Date(ordem.data_aprovacao_cliente).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}