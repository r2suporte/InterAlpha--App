import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import PagamentoForm from '@/components/pagamentos/PagamentoForm'

interface NovoPagamentoPageProps {
  searchParams: Promise<{ ordemServicoId?: string }>
}

export default async function NovoPagamentoPage({ searchParams }: NovoPagamentoPageProps) {
  const { ordemServicoId } = await searchParams

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/pagamentos">
          <Button variant="ghost" size="sm" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Novo Pagamento</h1>
          <p className="text-gray-600 mt-2">
            Registre um novo pagamento no sistema
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg border p-6">
        <PagamentoForm preSelectedOrdemServicoId={ordemServicoId} />
      </div>
    </div>
  )
}