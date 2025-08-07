import { Suspense } from 'react'
import Link from 'next/link'
import { Plus, Search, CreditCard, Filter, TrendingUp, DollarSign } from 'lucide-react'
import { buscarPagamentos, obterEstatisticasPagamentos } from '@/app/actions/pagamentos'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import PagamentoActions from '@/components/pagamentos/PagamentoActions'
import StatusPagamentoBadge from '@/components/pagamentos/StatusPagamentoBadge'
import MetodoPagamentoBadge from '@/components/pagamentos/MetodoPagamentoBadge'

interface PagamentosPageProps {
  searchParams: Promise<{ q?: string; status?: string; metodo?: string }>
}

export default async function PagamentosPage({ searchParams }: PagamentosPageProps) {
  const { q, status, metodo } = await searchParams
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pagamentos</h1>
          <p className="text-gray-600 mt-2">
            Gerencie pagamentos e controle financeiro
          </p>
        </div>
        <Link href="/pagamentos/novo">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Novo Pagamento
          </Button>
        </Link>
      </div>

      {/* Estatísticas */}
      <Suspense fallback={<EstatisticasSkeleton />}>
        <EstatisticasCards />
      </Suspense>

      {/* Filtros */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <form action="/pagamentos" method="GET">
            <Input
              name="q"
              placeholder="Buscar pagamentos..."
              defaultValue={q}
              className="pl-10"
            />
            {status && <input type="hidden" name="status" value={status} />}
            {metodo && <input type="hidden" name="metodo" value={metodo} />}
          </form>
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <Select
            defaultValue={status || ''}
            onValueChange={(value) => {
              const params = new URLSearchParams()
              if (q) params.set('q', q)
              if (value) params.set('status', value)
              if (metodo) params.set('metodo', metodo)
              window.location.href = `/pagamentos?${params.toString()}`
            }}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Todos os status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos os status</SelectItem>
              <SelectItem value="PENDENTE">Pendente</SelectItem>
              <SelectItem value="PAGO">Pago</SelectItem>
              <SelectItem value="CANCELADO">Cancelado</SelectItem>
              <SelectItem value="ESTORNADO">Estornado</SelectItem>
            </SelectContent>
          </Select>
          
          <Select
            defaultValue={metodo || ''}
            onValueChange={(value) => {
              const params = new URLSearchParams()
              if (q) params.set('q', q)
              if (status) params.set('status', status)
              if (value) params.set('metodo', value)
              window.location.href = `/pagamentos?${params.toString()}`
            }}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Todos os métodos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos os métodos</SelectItem>
              <SelectItem value="DINHEIRO">Dinheiro</SelectItem>
              <SelectItem value="PIX">PIX</SelectItem>
              <SelectItem value="CARTAO_CREDITO">Cartão de Crédito</SelectItem>
              <SelectItem value="CARTAO_DEBITO">Cartão de Débito</SelectItem>
              <SelectItem value="TRANSFERENCIA">Transferência</SelectItem>
              <SelectItem value="BOLETO">Boleto</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border">
        <Suspense fallback={<PagamentosTableSkeleton />}>
          <PagamentosTable query={q} status={status} metodo={metodo} />
        </Suspense>
      </div>
    </div>
  )
}

async function EstatisticasCards() {
  const stats = await obterEstatisticasPagamentos()

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total</CardTitle>
          <CreditCard className="h-4 w-4 text-gray-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-xs text-gray-500">pagamentos</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
          <div className="h-2 w-2 bg-yellow-500 rounded-full" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.pendentes}</div>
          <p className="text-xs text-gray-500">
            {formatCurrency(stats.valorPendente)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pagos</CardTitle>
          <div className="h-2 w-2 bg-green-500 rounded-full" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.pagos}</div>
          <p className="text-xs text-gray-500">confirmados</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(stats.valorTotal)}
          </div>
          <p className="text-xs text-gray-500">recebido</p>
        </CardContent>
      </Card>
    </div>
  )
}

async function PagamentosTable({ query, status, metodo }: { query?: string; status?: string; metodo?: string }) {
  const pagamentos = await buscarPagamentos(query, status, metodo)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const formatDate = (date: Date | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('pt-BR')
  }

  if (pagamentos.length === 0) {
    return (
      <div className="text-center py-12">
        <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          {query || status || metodo ? 'Nenhum pagamento encontrado' : 'Nenhum pagamento cadastrado'}
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          {query || status || metodo 
            ? 'Tente buscar com outros termos ou filtros.' 
            : 'Comece registrando um novo pagamento.'
          }
        </p>
        {!query && !status && !metodo && (
          <div className="mt-6">
            <Link href="/pagamentos/novo">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Pagamento
              </Button>
            </Link>
          </div>
        )}
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Valor</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Método</TableHead>
          <TableHead>Ordem de Serviço</TableHead>
          <TableHead>Cliente</TableHead>
          <TableHead>Vencimento</TableHead>
          <TableHead>Pagamento</TableHead>
          <TableHead className="w-[100px]">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {pagamentos.map((pagamento) => (
          <TableRow key={pagamento.id}>
            <TableCell className="font-medium">
              {formatCurrency(pagamento.valor)}
            </TableCell>
            <TableCell>
              <StatusPagamentoBadge status={pagamento.status} />
            </TableCell>
            <TableCell>
              <MetodoPagamentoBadge metodo={pagamento.metodo} />
            </TableCell>
            <TableCell>
              {pagamento.ordemServico ? (
                <Link 
                  href={`/ordens-servico/${pagamento.ordemServico.id}`}
                  className="text-blue-600 hover:text-blue-800"
                >
                  {pagamento.ordemServico.titulo}
                </Link>
              ) : (
                <span className="text-gray-500">Avulso</span>
              )}
            </TableCell>
            <TableCell>
              {pagamento.ordemServico?.cliente ? (
                <Link 
                  href={`/clientes/${pagamento.ordemServico.cliente.id}`}
                  className="text-gray-900 hover:text-blue-600"
                >
                  {pagamento.ordemServico.cliente.nome}
                </Link>
              ) : (
                '-'
              )}
            </TableCell>
            <TableCell>
              {formatDate(pagamento.dataVencimento)}
            </TableCell>
            <TableCell>
              {formatDate(pagamento.dataPagamento)}
            </TableCell>
            <TableCell>
              <PagamentoActions pagamentoId={pagamento.id} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function EstatisticasSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
            <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="h-8 bg-gray-200 rounded w-12 animate-pulse" />
            <div className="h-3 bg-gray-200 rounded w-20 mt-1 animate-pulse" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function PagamentosTableSkeleton() {
  return (
    <div className="p-6">
      <div className="animate-pulse space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex space-x-4">
            <div className="h-4 bg-gray-200 rounded w-1/8"></div>
            <div className="h-4 bg-gray-200 rounded w-1/8"></div>
            <div className="h-4 bg-gray-200 rounded w-1/8"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/6"></div>
            <div className="h-4 bg-gray-200 rounded w-1/8"></div>
            <div className="h-4 bg-gray-200 rounded w-1/8"></div>
          </div>
        ))}
      </div>
    </div>
  )
}