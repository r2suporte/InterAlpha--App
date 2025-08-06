import { Suspense } from 'react'
import Link from 'next/link'
import { Plus, Search, Users } from 'lucide-react'
import { buscarClientes } from '@/app/actions/clientes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { formatCPF, formatCNPJ, formatPhone } from '@/lib/utils'
import ClientesActions from '@/components/clientes/ClientesActions'

interface ClientesPageProps {
  searchParams: Promise<{ q?: string }>
}

export default async function ClientesPage({ searchParams }: ClientesPageProps) {
  const { q } = await searchParams
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-600 mt-2">
            Gerencie seus clientes e informações de contato
          </p>
        </div>
        <Link href="/clientes/novo">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Novo Cliente
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <form action="/clientes" method="GET">
            <Input
              name="q"
              placeholder="Buscar clientes..."
              defaultValue={q}
              className="pl-10"
            />
          </form>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border">
        <Suspense fallback={<ClientesTableSkeleton />}>
          <ClientesTable query={q} />
        </Suspense>
      </div>
    </div>
  )
}

async function ClientesTable({ query }: { query?: string }) {
  const clientes = await buscarClientes(query)

  if (clientes.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          {query ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          {query 
            ? 'Tente buscar com outros termos.' 
            : 'Comece criando um novo cliente.'
          }
        </p>
        {!query && (
          <div className="mt-6">
            <Link href="/clientes/novo">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Cliente
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
          <TableHead>Nome</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Telefone</TableHead>
          <TableHead>Documento</TableHead>
          <TableHead>Cidade</TableHead>
          <TableHead>O.S.</TableHead>
          <TableHead className="w-[100px]">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {clientes.map((cliente) => (
          <TableRow key={cliente.id}>
            <TableCell className="font-medium">
              <Link 
                href={`/clientes/${cliente.id}`}
                className="text-blue-600 hover:text-blue-800"
              >
                {cliente.nome}
              </Link>
            </TableCell>
            <TableCell>{cliente.email}</TableCell>
            <TableCell>
              {cliente.telefone ? formatPhone(cliente.telefone) : '-'}
            </TableCell>
            <TableCell>
              {cliente.tipoDocumento === 'CPF' 
                ? formatCPF(cliente.documento)
                : formatCNPJ(cliente.documento)
              }
            </TableCell>
            <TableCell>{cliente.cidade || '-'}</TableCell>
            <TableCell>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {cliente._count.ordensServico}
              </span>
            </TableCell>
            <TableCell>
              <ClientesActions clienteId={cliente.id} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function ClientesTableSkeleton() {
  return (
    <div className="p-6">
      <div className="animate-pulse space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex space-x-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/6"></div>
            <div className="h-4 bg-gray-200 rounded w-1/6"></div>
            <div className="h-4 bg-gray-200 rounded w-1/6"></div>
          </div>
        ))}
      </div>
    </div>
  )
}