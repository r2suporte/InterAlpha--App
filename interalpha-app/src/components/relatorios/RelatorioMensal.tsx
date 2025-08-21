'use client'

import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, DollarSign, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface RelatorioMensalProps {
  mes: number
  ano: number
}

interface RelatorioData {
  receita: number
  totalPagamentos: number
  porMetodo: Array<{
    metodo: string
    _count: number
    _sum: { valor: number }
  }>
  porDia: Array<{
    dia: number
    valor: number
    quantidade: number
  }>
}

export default function RelatorioMensal({ mes, ano }: RelatorioMensalProps) {
  const [relatorio, setRelatorio] = useState<RelatorioData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchRelatorio() {
      try {
        setIsLoading(true)
        setError(null)
        
        const params = new URLSearchParams()
        params.set('ano', ano.toString())
        params.set('mes', mes.toString())

        const response = await fetch(`/api/relatorios/mensal?${params.toString()}`, {
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
          }
        })

        if (!response.ok) {
          throw new Error(`Erro ao carregar relatório: ${response.status}`)
        }

        const result = await response.json()
        
        if (result.success) {
          setRelatorio(result.data)
        } else {
          throw new Error(result.error || 'Erro desconhecido')
        }
      } catch (err) {
        console.error('Erro ao buscar relatório:', err)
        setError(err instanceof Error ? err.message : 'Erro ao carregar relatório')
        setRelatorio(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchRelatorio()
  }, [mes, ano])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const nomesMeses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]

  const nomesMetodos = {
    DINHEIRO: 'Dinheiro',
    PIX: 'PIX',
    CARTAO_CREDITO: 'Cartão de Crédito',
    CARTAO_DEBITO: 'Cartão de Débito',
    TRANSFERENCIA: 'Transferência',
    BOLETO: 'Boleto',
  }

  if (isLoading) {
    return <RelatorioSkeleton />
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <BarChart3 className="mx-auto h-12 w-12 text-red-400 mb-4" />
            <h3 className="text-lg font-medium text-red-900 mb-2">Erro ao carregar relatório</h3>
            <p className="mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!relatorio) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p>Nenhum dado encontrado para o período selecionado</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="h-5 w-5 text-blue-600" />
        <h2 className="text-xl font-semibold">
          Relatório de {nomesMeses[mes - 1]} {ano}
        </h2>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-green-50/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(relatorio.receita)}
            </div>
            <p className="text-xs text-gray-500">no período</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-blue-50/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Pagamentos</CardTitle>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{relatorio.totalPagamentos}</div>
            <p className="text-xs text-gray-500">pagamentos recebidos</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-purple-50/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {relatorio.totalPagamentos > 0 
                ? formatCurrency(relatorio.receita / relatorio.totalPagamentos)
                : formatCurrency(0)
              }
            </div>
            <p className="text-xs text-gray-500">por pagamento</p>
          </CardContent>
        </Card>
      </div>

      {/* Pagamentos por Método */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg"></div>
            Pagamentos por Método
          </CardTitle>
        </CardHeader>
        <CardContent>
          {relatorio.porMetodo.length > 0 ? (
            <div className="space-y-4">
              {relatorio.porMetodo.map((item) => (
                <div key={item.metodo} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50/50 to-transparent rounded-xl border border-gray-100/50">
                  <div>
                    <p className="font-medium">
                      {nomesMetodos[item.metodo as keyof typeof nomesMetodos] || item.metodo}
                    </p>
                    <p className="text-sm text-gray-500">
                      {item._count} pagamento{item._count !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">
                      {formatCurrency(item._sum.valor || 0)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {relatorio.receita > 0 
                        ? `${(((item._sum.valor || 0) / relatorio.receita) * 100).toFixed(1)}%`
                        : '0%'
                      }
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">Nenhum pagamento registrado</p>
              <p className="text-sm text-gray-400">no período selecionado</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function RelatorioSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-5 h-5 bg-gray-200 rounded animate-pulse" />
        <div className="h-6 bg-gray-200 rounded w-48 animate-pulse" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
              <div className="w-10 h-10 bg-gray-200 rounded-xl animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-20 animate-pulse mb-2" />
              <div className="h-3 bg-gray-200 rounded w-16 animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-48 animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}