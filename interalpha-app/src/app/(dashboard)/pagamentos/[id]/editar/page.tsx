import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import PagamentoForm from '@/components/pagamentos/PagamentoForm'

interface EditarPagamentoPageProps {
  params: Promise<{ id: string }>
}

async function getPagamento(id: string) {
  try {
    const pagamento = await prisma.pagamento.findUnique({
      where: { id },
      select: {
        id: true,
        valor: true,
        status: true,
        metodo: true,
        descricao: true,
        dataVencimento: true,
        dataPagamento: true,
        ordemServicoId: true,
      },
    })

    return pagamento
  } catch (error) {
    return null
  }
}

export default async function EditarPagamentoPage({ params }: EditarPagamentoPageProps) {
  const { id } = await params
  const pagamento = await getPagamento(id)

  if (!pagamento) {
    notFound()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/pagamentos/${id}`}>
          <Button variant="ghost" size="sm" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Editar Pagamento</h1>
          <p className="text-gray-600 mt-2">
            Atualize as informações do pagamento
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg border p-6">
        <PagamentoForm pagamento={pagamento} isEditing={true} />
      </div>
    </div>
  )
}