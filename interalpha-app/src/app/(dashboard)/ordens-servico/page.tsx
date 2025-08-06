import { Suspense } from 'react'
import Link from 'next/link'
import { Plus, Search, Wrench, Filter } from 'lucide-react'
import { buscarOrdensServico, obterEstatisticasOrdens } from '@/app/actions/ordens-servico'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import OrdemServicoActions from '@/components/ordens-servico/OrdemServicoActions'
import StatusBadge from '@/components/ordens-servico/StatusBadge'
import PrioridadeBadge from '@/components/ordens-servico/PrioridadeBadge'

interface OrdensServicoPageProps {
  searchParams: Promise<{ q?: string; status?: string }>
}

export default async function OrdensServicoPage({ searchParams }: OrdensServicoPageProps) {
  const { q, status } = await searchParams
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ordens de Serviço</h1>
          <p className="text-gray-600 mt-2">
            Gerencie suas ordens de serviço e acompanhe o progresso
          </p>
        </div>
        <Link href="/ordens-servico/nova">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nova O.S.
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
          <form action="/ordens-servico" method="GET">
            <Input
              name="q"
              placeholder="Buscar ordens de serviço..."
              defaultValue={q}
              className="pl-10"
            />
            {status && <input type="hidden" name="status" value={status} />}
          </form>
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <form action="/ordens-servico" method="GET">
            <Select
              name="status"
              defaultValue={status || ''}
              onChange={(e) => {
                const form = e.target.form!
                const formData = new FormData(form)
                const params = new URLSearchParams()
                if (q) params.set('q', q)
                if (e.target.value) params.set('status', e.target.value)
                window.location.href = `/ordens-servico?${params.toString()}`
              }}
            >
              <option value="">Todos os status</option>
              <option value="PENDENTE">Pendente</option>
              <option value="EM_ANDAMENTO">Em Andamento</option>
              <option value="CONCLUIDA">Concluída</option>
              <option value="CANCELADA">Cancelada</option>
            </Select>
            {q && <input type="hidden" name="q" value={q} />}
          </form>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border">
        <Suspense fallback={<OrdensServicoTableSkeleton />}>
          <OrdensServicoTable query={q} status={status} />
        </Suspense>
      </div>
    </div>
  )
}

async function EstatisticasCards() {
  const stats = await obterEstatisticasOrdens()

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total</CardTitle>
          <Wrench className="h-4 w-4 text-gray-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
          <div className="h-2 w-2 bg-yellow-500 rounded-full" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.pendentes}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
          <div className="h-2 w-2 bg-blue-500 rounded-full" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.emAndamento}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
          <div className="h-2 w-2 bg-green-500 rounded-full" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.concluidas}</div>
        </CardContent>
      </Card>
    </div>
  )
}

async function OrdensServicoTable({ query, status }: { query?: string; status?: string }) {
  const ordensServico = await buscarOrdensServico(query, status)

  if (ordensServico.length === 0) {
    return (
      <div className="text-center py-12">
        <Wrench className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          {query || status ? 'Nenhuma ordem encontrada' : 'Nenhuma ordem de serviço cadastrada'}
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          {query || status 
            ? 'Tente buscar com outros termos ou filtros.' 
            : 'Comece criando uma nova ordem de serviço.'
          }
        </p>
        {!query && !status && (
          <div className="mt-6">
            <Link href="/ordens-servico/nova">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova O.S.
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
          <TableHead>Título</TableHead>
          <TableHead>Cliente</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Prioridade</TableHead>
          <TableHead>Valor</TableHead>
          <TableHead>Data Início</TableHead>
          <TableHead className="w-[100px]">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {ordensServico.map((ordem) => (
          <TableRow key={ordem.id}>
            <TableCell className="font-medium">
              <Link 
                href={`/ordens-servico/${ordem.id}`}
                className="text-blue-600 hover:text-blue-800"
              >
                {ordem.titulo}
              </Link>
            </TableCell>
            <TableCell>
              <Link 
                href={`/clientes/${ordem.cliente.id}`}
                className="text-gray-900 hover:text-blue-600"
              >
                {ordem.cliente.nome}
              </Link>
            </TableCell>
            <TableCell>
              <StatusBadge status={ordem.status} />
            </TableCell>
            <TableCell>
              <PrioridadeBadge prioridade={ordem.prioridade} />
            </TableCell>
            <TableCell>
              {ordem.valor ? `R$ ${ordem.valor.toFixed(2)}` : '-'}
            </TableCell>
            <TableCell>
              {ordem.dataInicio 
                ? new Date(ordem.dataInicio).toLocaleDateString('pt-BR')
                : '-'
              }
            </TableCell>
            <TableCell>
              <OrdemServicoActions ordemId={ordem.id} />
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
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function OrdensServicoTableSkeleton() {
  return (
    <div className="p-6">
      <div className="animate-pulse space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex space-x-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/6"></div>
            <div className="h-4 bg-gray-200 rounded w-1/8"></div>
            <div className="h-4 bg-gray-200 rounded w-1/8"></div>
            <div className="h-4 bg-gray-200 rounded w-1/6"></div>
            <div className="h-4 bg-gray-200 rounded w-1/6"></div>
          </div>
        ))}
      </div>
    </div>
  )
}