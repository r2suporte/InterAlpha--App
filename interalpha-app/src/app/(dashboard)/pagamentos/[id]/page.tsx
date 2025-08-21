import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Edit, Calendar, DollarSign, CreditCard, FileText } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import StatusPagamentoBadge from '@/components/pagamentos/StatusPagamentoBadge'
import MetodoPagamentoBadge from '@/components/pagamentos/MetodoPagamentoBadge'

interface PagamentoPageProps {
  params: Promise<{ id: string }>
}

async function getPagamento(id: string) {
  try {
    const pagamento = await prisma.pagamento.findUnique({
      where: { id },
      include: {
        ordemServico: {
          select: {
            id: true,
            titulo: true,
            status: true,
            valor: true,
            cliente: {
              select: {
                id: true,
                nome: true,
                email: true,
                telefone: true,
              },
            },
          },
        },
      },
    })

    return pagamento
  } catch (error) {
    return null
  }
}

export default async function PagamentoPage({ params }: PagamentoPageProps) {
  const { id } = await params
  const pagamento = await getPagamento(id)

  if (!pagamento) {
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
          <Link href="/pagamentos">
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Pagamento {formatCurrency(pagamento.valor)}
            </h1>
            <p className="text-gray-600 mt-2">
              ID: #{pagamento.id.slice(-8)}
            </p>
          </div>
        </div>
        <Link href={`/pagamentos/${pagamento.id}/editar`}>
          <Button className="flex items-center gap-2">
            <Edit className="h-4 w-4" />
            Editar
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informações Principais */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status e Método */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Informações do Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Status</p>
                  <StatusPagamentoBadge status={pagamento.status} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Método</p>
                  <MetodoPagamentoBadge metodo={pagamento.metodo} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Valor</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(pagamento.valor)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Stripe Payment ID</p>
                  <p className="text-sm font-mono">
                    {pagamento.stripePaymentId || 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Descrição */}
          {pagamento.descricao && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Descrição
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {pagamento.descricao}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Ordem de Serviço Relacionada */}
          {pagamento.ordemServico && (
            <Card>
              <CardHeader>
                <CardTitle>Ordem de Serviço Relacionada</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Link
                      href={`/ordens-servico/${pagamento.ordemServico.id}`}
                      className="font-medium text-blue-600 hover:text-blue-800"
                    >
                      {pagamento.ordemServico.titulo}
                    </Link>
                    <p className="text-sm text-gray-500 mt-1">
                      Cliente: {pagamento.ordemServico.cliente.nome}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {pagamento.ordemServico.valor 
                        ? formatCurrency(pagamento.ordemServico.valor)
                        : 'Valor não definido'
                      }
                    </p>
                    <p className="text-sm text-gray-500">
                      Status: {pagamento.ordemServico.status}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Datas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Datas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Data de Vencimento</p>
                <p className="font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {formatDate(pagamento.dataVencimento)}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Data de Pagamento</p>
                <p className="font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {formatDate(pagamento.dataPagamento)}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Criado em</p>
                <p className="font-medium">
                  {formatDateTime(pagamento.createdAt)}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Atualizado em</p>
                <p className="font-medium">
                  {formatDateTime(pagamento.updatedAt)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Informações do Cliente */}
          {pagamento.ordemServico?.cliente && (
            <Card>
              <CardHeader>
                <CardTitle>Cliente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Link
                    href={`/clientes/${pagamento.ordemServico.cliente.id}`}
                    className="font-medium text-blue-600 hover:text-blue-800"
                  >
                    {pagamento.ordemServico.cliente.nome}
                  </Link>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="text-sm">{pagamento.ordemServico.cliente.email}</p>
                </div>

                {pagamento.ordemServico.cliente.telefone && (
                  <div>
                    <p className="text-sm text-gray-500">Telefone</p>
                    <p className="text-sm">{pagamento.ordemServico.cliente.telefone}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Ações Rápidas */}
          <Card>
            <CardHeader>
              <CardTitle>Ações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pagamento.ordemServico && (
                <Link
                  href={`/ordens-servico/${pagamento.ordemServico.id}`}
                  className="block w-full"
                >
                  <Button variant="outline" className="w-full justify-start">
                    Ver Ordem de Serviço
                  </Button>
                </Link>
              )}

              {pagamento.ordemServico?.cliente && (
                <Link
                  href={`/clientes/${pagamento.ordemServico.cliente.id}`}
                  className="block w-full"
                >
                  <Button variant="outline" className="w-full justify-start">
                    Ver Cliente
                  </Button>
                </Link>
              )}

              <Link
                href={`/pagamentos/${pagamento.id}/editar`}
                className="block w-full"
              >
                <Button className="w-full justify-start">
                  <Edit className="h-4 w-4 mr-2" />
                  Editar Pagamento
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}