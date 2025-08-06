import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Edit, Phone, Mail, MapPin, FileText, Plus } from 'lucide-react'
import prisma from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import StatusBadge from '@/components/ordens-servico/StatusBadge'
import PrioridadeBadge from '@/components/ordens-servico/PrioridadeBadge'
import { formatCPF, formatCNPJ, formatPhone } from '@/lib/utils'

interface ClientePageProps {
  params: Promise<{ id: string }>
}

async function getCliente(id: string) {
  try {
    const cliente = await prisma.cliente.findUnique({
      where: { id },
      include: {
        ordensServico: {
          select: {
            id: true,
            titulo: true,
            status: true,
            prioridade: true,
            valor: true,
            dataInicio: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { ordensServico: true },
        },
      },
    })

    return cliente
  } catch (error) {
    return null
  }
}

export default async function ClientePage({ params }: ClientePageProps) {
  const { id } = await params
  const cliente = await getCliente(id)

  if (!cliente) {
    notFound()
  }

  const formatCurrency = (value: number | null) => {
    if (!value) return '-'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const formatDate = (date: Date | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('pt-BR')
  }

  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString('pt-BR')
  }

  const totalValorOrdens = cliente.ordensServico.reduce((total, ordem) => {
    return total + (ordem.valor || 0)
  }, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/clientes">
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{cliente.nome}</h1>
            <p className="text-gray-600 mt-2">
              Cliente desde {formatDateTime(cliente.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/ordens-servico/nova?clienteId=${cliente.id}`}>
            <Button variant="outline" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nova O.S.
            </Button>
          </Link>
          <Link href={`/pagamentos/novo`}>
            <Button variant="outline" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Novo Pagamento
            </Button>
          </Link>
          <Link href={`/clientes/${cliente.id}/editar`}>
            <Button className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Editar
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informações do Cliente */}
        <div className="space-y-6">
          {/* Contato */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Contato
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <a 
                    href={`mailto:${cliente.email}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {cliente.email}
                  </a>
                </div>
              </div>

              {cliente.telefone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Telefone</p>
                    <a 
                      href={`tel:${cliente.telefone}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {formatPhone(cliente.telefone)}
                    </a>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Documento</p>
                  <p className="font-medium">
                    {cliente.tipoDocumento === 'CPF' 
                      ? formatCPF(cliente.documento)
                      : formatCNPJ(cliente.documento)
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Endereço */}
          {(cliente.endereco || cliente.cidade) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Endereço
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {cliente.endereco && (
                  <p className="text-sm">{cliente.endereco}</p>
                )}
                {cliente.cidade && (
                  <p className="text-sm">
                    {cliente.cidade}{cliente.estado && `, ${cliente.estado}`}
                  </p>
                )}
                {cliente.cep && (
                  <p className="text-sm text-gray-500">CEP: {cliente.cep}</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Observações */}
          {cliente.observacoes && (
            <Card>
              <CardHeader>
                <CardTitle>Observações</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {cliente.observacoes}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Estatísticas */}
          <Card>
            <CardHeader>
              <CardTitle>Estatísticas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Total de O.S.</span>
                <span className="font-medium">{cliente._count.ordensServico}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Valor Total</span>
                <span className="font-medium">{formatCurrency(totalValorOrdens)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ordens de Serviço */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Ordens de Serviço ({cliente._count.ordensServico})</CardTitle>
              <Link href={`/ordens-servico/nova?clienteId=${cliente.id}`}>
                <Button size="sm" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Nova O.S.
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {cliente.ordensServico.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Título</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Prioridade</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Data Início</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cliente.ordensServico.map((ordem) => (
                      <TableRow key={ordem.id}>
                        <TableCell>
                          <Link 
                            href={`/ordens-servico/${ordem.id}`}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            {ordem.titulo}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={ordem.status} />
                        </TableCell>
                        <TableCell>
                          <PrioridadeBadge prioridade={ordem.prioridade} />
                        </TableCell>
                        <TableCell>
                          {formatCurrency(ordem.valor)}
                        </TableCell>
                        <TableCell>
                          {formatDate(ordem.dataInicio)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    Nenhuma ordem de serviço
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Este cliente ainda não possui ordens de serviço.
                  </p>
                  <div className="mt-6">
                    <Link href={`/ordens-servico/nova?clienteId=${cliente.id}`}>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Criar primeira O.S.
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}