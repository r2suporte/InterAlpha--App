import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Edit, Calendar, User, DollarSign, Clock, Plus } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import StatusBadge from '@/components/ordens-servico/StatusBadge'
import PrioridadeBadge from '@/components/ordens-servico/PrioridadeBadge'

interface OrdemServicoPageProps {
  params: Promise<{ id: string }>
}

async function getOrdemServico(id: string) {
  try {
    const ordemServico = await prisma.ordemServico.findUnique({
      where: { id },
      include: {
        cliente: {
          select: {
            id: true,
            nome: true,
            email: true,
            telefone: true,
            documento: true,
            tipoDocumento: true,
            cidade: true,
            estado: true,
          },
        },
        pagamentos: {
          select: {
            id: true,
            valor: true,
            status: true,
            metodo: true,
            dataPagamento: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { pagamentos: true },
        },
      },
    })

    return ordemServico
  } catch (error) {
    return null
  }
}

export default async function OrdemServicoPage({ params }: OrdemServicoPageProps) {
  const { id } = await params
  const ordemServico = await getOrdemServico(id)

  if (!ordemServico) {
    notFound()
  }

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

  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString('pt-BR')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/ordens-servico">
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{ordemServico.titulo}</h1>
            <p className="text-gray-600 mt-2">
              Ordem de Serviço #{ordemServico.id.slice(-8)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/pagamentos/novo?ordemServicoId=${ordemServico.id}`}>
            <Button variant="outline" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Novo Pagamento
            </Button>
          </Link>
          <Link href={`/ordens-servico/${ordemServico.id}/editar`}>
            <Button className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Editar
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informações Principais */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status e Prioridade */}
          <Card>
            <CardHeader>
              <CardTitle>Status da Ordem</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Status</p>
                  <StatusBadge status={ordemServico.status} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Prioridade</p>
                  <PrioridadeBadge prioridade={ordemServico.prioridade} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Descrição */}
          {ordemServico.descricao && (
            <Card>
              <CardHeader>
                <CardTitle>Descrição</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {ordemServico.descricao}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Pagamentos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Pagamentos ({ordemServico._count.pagamentos})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {ordemServico.pagamentos.length > 0 ? (
                <div className="space-y-3">
                  {ordemServico.pagamentos.map((pagamento) => (
                    <div
                      key={pagamento.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{formatCurrency(pagamento.valor)}</p>
                        <p className="text-sm text-gray-500">
                          {pagamento.metodo} • {formatDateTime(pagamento.createdAt)}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          pagamento.status === 'PAGO'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {pagamento.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  Nenhum pagamento registrado
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Informações Gerais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Informações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Valor</p>
                <p className="font-medium">
                  {ordemServico.valor ? formatCurrency(ordemServico.valor) : 'Não definido'}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Data de Início</p>
                <p className="font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {formatDate(ordemServico.dataInicio)}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Data de Fim</p>
                <p className="font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {formatDate(ordemServico.dataFim)}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Criado em</p>
                <p className="font-medium">
                  {formatDateTime(ordemServico.createdAt)}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Atualizado em</p>
                <p className="font-medium">
                  {formatDateTime(ordemServico.updatedAt)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Informações do Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Link
                  href={`/clientes/${ordemServico.cliente.id}`}
                  className="font-medium text-blue-600 hover:text-blue-800"
                >
                  {ordemServico.cliente.nome}
                </Link>
              </div>

              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="text-sm">{ordemServico.cliente.email}</p>
              </div>

              {ordemServico.cliente.telefone && (
                <div>
                  <p className="text-sm text-gray-500">Telefone</p>
                  <p className="text-sm">{ordemServico.cliente.telefone}</p>
                </div>
              )}

              <div>
                <p className="text-sm text-gray-500">Documento</p>
                <p className="text-sm">
                  {ordemServico.cliente.tipoDocumento}: {ordemServico.cliente.documento}
                </p>
              </div>

              {ordemServico.cliente.cidade && (
                <div>
                  <p className="text-sm text-gray-500">Localização</p>
                  <p className="text-sm">
                    {ordemServico.cliente.cidade}, {ordemServico.cliente.estado}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}