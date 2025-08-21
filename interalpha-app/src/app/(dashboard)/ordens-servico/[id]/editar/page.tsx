import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import OrdemServicoForm from '@/components/ordens-servico/OrdemServicoForm'

interface EditarOrdemServicoPageProps {
  params: Promise<{ id: string }>
}

async function getOrdemServico(id: string) {
  try {
    const ordemServico = await prisma.ordemServico.findUnique({
      where: { id },
      select: {
        id: true,
        titulo: true,
        descricao: true,
        status: true,
        prioridade: true,
        valor: true,
        dataInicio: true,
        dataFim: true,
        clienteId: true,
      },
    })

    return ordemServico
  } catch (error) {
    return null
  }
}

export default async function EditarOrdemServicoPage({ params }: EditarOrdemServicoPageProps) {
  const { id } = await params
  const ordemServico = await getOrdemServico(id)

  if (!ordemServico) {
    notFound()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/ordens-servico/${id}`}>
          <Button variant="ghost" size="sm" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Editar Ordem de Serviço</h1>
          <p className="text-gray-600 mt-2">
            Atualize as informações da ordem de serviço
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg border p-6">
        <OrdemServicoForm ordemServico={ordemServico} isEditing={true} />
      </div>
    </div>
  )
}