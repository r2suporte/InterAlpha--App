'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { OrdemServicoAppleForm } from '@/components/ordens-servico/OrdemServicoAppleForm'
import { GarantiaCard } from '@/components/ordens-servico/GarantiaCard'
import { ImpressaoOS } from '@/components/ordens-servico/ImpressaoOS'
import { OrdemServicoApple } from '@/types/ordem-servico-apple'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Apple, 
  Edit, 
  Printer, 
  Share, 
  Clock, 
  User, 
  Smartphone,
  DollarSign,
  Calendar
} from 'lucide-react'
import { toast } from 'sonner'

interface OrdemServicoApplePageProps {
  params: Promise<{ id: string }>
}

export default function OrdemServicoApplePage({ params }: OrdemServicoApplePageProps) {
  const router = useRouter()
  const [ordem, setOrdem] = useState<OrdemServicoApple | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const loadOrdem = async () => {
      try {
        const { id } = await params
        const response = await fetch(`/api/ordens-servico/apple/${id}`)
        
        if (!response.ok) {
          throw new Error('Ordem de serviço não encontrada')
        }
        
        const data = await response.json()
        setOrdem(data)
      } catch (error) {
        console.error('Erro ao carregar ordem:', error)
        toast.error('Erro ao carregar ordem de serviço')
        router.push('/ordens-servico')
      } finally {
        setLoading(false)
      }
    }

    loadOrdem()
  }, [params, router])

  const handleSave = async (ordemAtualizada: OrdemServicoApple) => {
    setSaving(true)
    try {
      const { id } = await params
      
      const response = await fetch(`/api/ordens-servico/apple/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...ordemAtualizada,
          updatedAt: new Date(),
          atualizadoPor: 'current-user' // TODO: Pegar do contexto
        }),
      })

      if (!response.ok) {
        throw new Error('Erro ao atualizar ordem de serviço')
      }

      const result = await response.json()
      setOrdem(result)
      setEditing(false)
      toast.success('Ordem de Serviço Apple atualizada com sucesso!')
      
    } catch (error) {
      console.error('Erro ao salvar:', error)
      toast.error('Erro ao salvar alterações. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleShare = async () => {
    try {
      await navigator.share({
        title: `O.S. Apple ${ordem?.numero}`,
        text: `Ordem de Serviço Apple - ${ordem?.dispositivo.modelo}`,
        url: window.location.href
      })
    } catch (error) {
      // Fallback para copiar URL
      navigator.clipboard.writeText(window.location.href)
      toast.success('Link copiado para a área de transferência!')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando Ordem de Serviço Apple...</p>
        </div>
      </div>
    )
  }

  if (!ordem) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Apple className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Ordem de Serviço não encontrada</h2>
          <p className="text-gray-600 mb-4">A ordem de serviço solicitada não existe ou foi removida.</p>
          <Button onClick={() => router.push('/ordens-servico')}>
            Voltar para Ordens de Serviço
          </Button>
        </div>
      </div>
    )
  }

  if (editing) {
    return (
      <div className="min-h-screen bg-gray-50">
        <OrdemServicoAppleForm
          ordem={ordem}
          onSave={handleSave}
          onCancel={() => setEditing(false)}
        />
        
        {saving && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span>Salvando alterações...</span>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Apple className="h-8 w-8 text-gray-700" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Ordem de Serviço Apple
              </h1>
              <p className="text-gray-600">
                {ordem.numero} • {ordem.dispositivo.modelo}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge 
              variant={ordem.status === 'Concluído' ? 'default' : 'secondary'}
              className="text-sm"
            >
              {ordem.status}
            </Badge>
            <Badge 
              variant={ordem.prioridade === 'Urgente' ? 'destructive' : 'outline'}
              className="text-sm"
            >
              {ordem.prioridade}
            </Badge>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button onClick={() => setEditing(true)} className="flex items-center gap-2">
            <Edit className="h-4 w-4" />
            Editar
          </Button>
          
          {/* Botões de Impressão */}
          <ImpressaoOS ordem={ordem} tipo="entrada" />
          <ImpressaoOS ordem={ordem} tipo="saida" />
          
          <Button variant="outline" onClick={handleShare} className="flex items-center gap-2">
            <Share className="h-4 w-4" />
            Compartilhar
          </Button>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informações do Cliente */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Cliente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Nome</label>
                    <p className="text-sm">{ordem.cliente.nome}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Email</label>
                    <p className="text-sm">{ordem.cliente.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Telefone</label>
                    <p className="text-sm">{ordem.cliente.telefone}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Endereço</label>
                    <p className="text-sm">{ordem.cliente.endereco}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Informações do Dispositivo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  Dispositivo Apple
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Modelo</label>
                    <p className="text-sm font-semibold">{ordem.dispositivo.modelo}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Número de Série</label>
                    <p className="text-sm font-mono">{ordem.dispositivo.numeroSerie}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Capacidade</label>
                    <p className="text-sm">{ordem.dispositivo.capacidade}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Cor</label>
                    <p className="text-sm">{ordem.dispositivo.cor}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Estado Físico</label>
                    <Badge variant="outline">{ordem.dispositivo.estadoFisico}</Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">iOS</label>
                    <p className="text-sm">{ordem.dispositivo.versaoiOS || 'Não informado'}</p>
                  </div>
                </div>
                
                {ordem.dispositivo.acessorios.length > 0 && (
                  <div className="mt-4">
                    <label className="text-sm font-medium text-gray-600">Acessórios</label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {ordem.dispositivo.acessorios.map((acessorio, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {acessorio}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Problema Relatado */}
            <Card>
              <CardHeader>
                <CardTitle>Problema Relatado</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-3">{ordem.problema.descricao}</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="font-medium text-gray-600">Frequência:</label>
                    <span className="ml-2">{ordem.problema.frequencia}</span>
                  </div>
                  <div>
                    <label className="font-medium text-gray-600">Condições:</label>
                    <span className="ml-2">{ordem.problema.condicoes}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Valores */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Valores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Peças:</span>
                    <span>R$ {ordem.valorPecas.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mão de Obra:</span>
                    <span>R$ {ordem.valorMaoDeObra.toFixed(2)}</span>
                  </div>
                  {ordem.desconto && ordem.desconto > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Desconto:</span>
                      <span>- R$ {ordem.desconto.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t pt-3">
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total:</span>
                      <span className="text-green-600">R$ {ordem.valorTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Coluna Lateral */}
          <div className="space-y-6">
            {/* Garantia */}
            <GarantiaCard garantia={ordem.garantia} />

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div>
                    <p className="font-medium">Recebido</p>
                    <p className="text-gray-600">{ordem.dataRecebimento.toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
                
                {ordem.dataPrevisao && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">Previsão</p>
                      <p className="text-gray-600">{ordem.dataPrevisao.toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                )}
                
                {ordem.dataConclusao && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">Concluído</p>
                      <p className="text-gray-600">{ordem.dataConclusao.toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                )}
                
                {ordem.dataEntrega && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">Entregue</p>
                      <p className="text-gray-600">{ordem.dataEntrega.toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Resumo de Ações */}
            {ordem.acoes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Ações Realizadas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span>Total de Ações:</span>
                      <span className="font-medium">{ordem.acoes.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tempo Total:</span>
                      <span className="font-medium">
                        {ordem.acoes.reduce((total, acao) => total + acao.tempo, 0)} min
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sucessos:</span>
                      <span className="font-medium text-green-600">
                        {ordem.acoes.filter(a => a.resultado === 'Sucesso').length}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Resumo de Peças */}
            {ordem.pecasSubstituidas.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Peças Substituídas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span>Total de Peças:</span>
                      <span className="font-medium">{ordem.pecasSubstituidas.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Valor Total:</span>
                      <span className="font-medium text-green-600">
                        R$ {ordem.pecasSubstituidas.reduce((total, peca) => total + peca.preco, 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}