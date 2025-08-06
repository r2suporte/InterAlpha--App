import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import OrdemServicoForm from '@/components/ordens-servico/OrdemServicoForm'

interface NovaOrdemServicoPageProps {
  searchParams: Promise<{ clienteId?: string }>
}

export default async function NovaOrdemServicoPage({ searchParams }: NovaOrdemServicoPageProps) {
  const { clienteId } = await searchParams
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/ordens-servico">
          <Button variant="ghost" size="sm" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nova Ordem de Serviço</h1>
          <p className="text-gray-600 mt-2">
            Preencha as informações da ordem de serviço
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg border p-6">
        <OrdemServicoForm preSelectedClienteId={clienteId} />
      </div>
    </div>
  )
}