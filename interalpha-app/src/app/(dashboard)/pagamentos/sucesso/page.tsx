import { Suspense } from 'react'
import Link from 'next/link'
import { CheckCircle, ArrowRight, Receipt } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { prisma } from '@/lib/prisma'

interface PagamentoSucessoPageProps {
  searchParams: Promise<{ session_id?: string }>
}

export default async function PagamentoSucessoPage({ searchParams }: PagamentoSucessoPageProps) {
  const { session_id } = await searchParams

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <Suspense fallback={<SucessoSkeleton />}>
          <SucessoContent sessionId={session_id} />
        </Suspense>
      </div>
    </div>
  )
}

async function SucessoContent({ sessionId }: { sessionId?: string }) {
  let pagamento = null

  if (sessionId) {
    try {
      pagamento = await prisma.pagamento.findFirst({
        where: { stripePaymentId: sessionId },
        include: {
          ordemServico: {
            select: {
              id: true,
              titulo: true,
              cliente: {
                select: {
                  nome: true,
                },
              },
            },
          },
        },
      })
    } catch (error) {
      console.error('Erro ao buscar pagamento:', error)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  return (
    <Card className="text-center">
      <CardHeader className="pb-4">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <CardTitle className="text-2xl text-green-600">
          Pagamento Realizado!
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {pagamento ? (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Valor Pago</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(pagamento.valor)}
              </p>
            </div>

            {pagamento.ordemServico && (
              <div className="bg-gray-50 p-4 rounded-lg text-left">
                <p className="text-sm text-gray-500 mb-1">Serviço</p>
                <p className="font-medium">{pagamento.ordemServico.titulo}</p>
                <p className="text-sm text-gray-600">
                  Cliente: {pagamento.ordemServico.cliente.nome}
                </p>
              </div>
            )}

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">ID do Pagamento</p>
              <p className="font-mono text-sm">#{pagamento.id.slice(-8)}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-600">
              Seu pagamento foi processado com sucesso!
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">
                Os detalhes do pagamento serão atualizados em breve.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-3 pt-4">
          <Link href="/pagamentos" className="block">
            <Button className="w-full">
              <Receipt className="w-4 h-4 mr-2" />
              Ver Todos os Pagamentos
            </Button>
          </Link>

          {pagamento?.ordemServico && (
            <Link href={`/ordens-servico/${pagamento.ordemServico.id}`} className="block">
              <Button variant="outline" className="w-full">
                Ver Ordem de Serviço
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          )}

          <Link href="/dashboard" className="block">
            <Button variant="ghost" className="w-full">
              Voltar ao Dashboard
            </Button>
          </Link>
        </div>

        <div className="pt-4 border-t">
          <p className="text-xs text-gray-500">
            Um recibo foi enviado para o seu email.
            <br />
            Obrigado por usar nossos serviços!
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function SucessoSkeleton() {
  return (
    <Card className="text-center">
      <CardHeader className="pb-4">
        <div className="mx-auto w-16 h-16 bg-gray-200 rounded-full animate-pulse mb-4"></div>
        <div className="h-8 bg-gray-200 rounded w-48 mx-auto animate-pulse"></div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="h-20 bg-gray-100 rounded-lg animate-pulse"></div>
          <div className="h-16 bg-gray-100 rounded-lg animate-pulse"></div>
          <div className="h-12 bg-gray-100 rounded-lg animate-pulse"></div>
        </div>
        <div className="space-y-3 pt-4">
          <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </CardContent>
    </Card>
  )
}