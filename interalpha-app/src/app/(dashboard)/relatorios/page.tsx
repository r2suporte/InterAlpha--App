import { Suspense } from 'react'
import { BarChart3, TrendingUp, Calendar, DollarSign } from 'lucide-react'
import { obterRelatorioMensal } from '@/app/actions/pagamentos'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select } from '@/components/ui/select'

interface RelatoriosPageProps {
  searchParams: Promise<{ mes?: string; ano?: string }>
}

export default async function RelatoriosPage({ searchParams }: RelatoriosPageProps) {
  const { mes, ano } = await searchParams
  
  const mesAtual = mes ? parseInt(mes) : new Date().getMonth() + 1
  const anoAtual = ano ? parseInt(ano) : new Date().getFullYear()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-gray-600 mt-2">
            Análise financeira e estatísticas do negócio
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          <form action="/relatorios" method="GET">
            <Select
              name="mes"
              defaultValue={mesAtual.toString()}
              onChange={(e) => {
                const form = e.target.form!
                const params = new URLSearchParams()
                params.set('mes', e.target.value)
                params.set('ano', anoAtual.toString())
                window.location.href = `/relatorios?${params.toString()}`
              }}
            >
              <option value="1">Janeiro</option>
              <option value="2">Fevereiro</option>
              <option value="3">Março</option>
              <option value="4">Abril</option>
              <option value="5">Maio</option>
              <option value="6">Junho</option>
              <option value="7">Julho</option>
              <option value="8">Agosto</option>
              <option value="9">Setembro</option>
              <option value="10">Outubro</option>
              <option value="11">Novembro</option>
              <option value="12">Dezembro</option>
            </Select>
            <input type="hidden" name="ano" value={anoAtual} />
          </form>
          
          <form action="/relatorios" method="GET">
            <Select
              name="ano"
              defaultValue={anoAtual.toString()}
              onChange={(e) => {
                const form = e.target.form!
                const params = new URLSearchParams()
                params.set('mes', mesAtual.toString())
                params.set('ano', e.target.value)
                window.location.href = `/relatorios?${params.toString()}`
              }}
            >
              <option value="2024">2024</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
            </Select>
            <input type="hidden" name="mes" value={mesAtual} />
          </form>
        </div>
      </div>

      {/* Relatório Mensal */}
      <Suspense fallback={<RelatorioSkeleton />}>
        <RelatorioMensal mes={mesAtual} ano={anoAtual} />
      </Suspense>
    </div>
  )
}

async function RelatorioMensal({ mes, ano }: { mes: number; ano: number }) {
  const relatorio = await obterRelatorioMensal(ano, mes)

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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(relatorio.receita)}
            </div>
            <p className="text-xs text-gray-500">no período</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Pagamentos</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{relatorio.totalPagamentos}</div>
            <p className="text-xs text-gray-500">pagamentos recebidos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <BarChart3 className="h-4 w-4 text-purple-600" />
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
      <Card>
        <CardHeader>
          <CardTitle>Pagamentos por Método</CardTitle>
        </CardHeader>
        <CardContent>
          {relatorio.porMetodo.length > 0 ? (
            <div className="space-y-4">
              {relatorio.porMetodo.map((item) => (
                <div key={item.metodo} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
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
            <p className="text-center text-gray-500 py-8">
              Nenhum pagamento registrado no período
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function RelatorioSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-20 animate-pulse" />
              <div className="h-3 bg-gray-200 rounded w-16 mt-1 animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Card>
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-48 animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}