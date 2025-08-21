import React from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import EstatisticasPagamentos from '@/components/pagamentos/EstatisticasPagamentos'
import FiltrosPagamentos from '@/components/pagamentos/FiltrosPagamentos'
import PagamentosTable from '@/components/pagamentos/PagamentosTable'

interface PagamentosPageProps {
  searchParams: Promise<{ q?: string; status?: string; metodo?: string }>
}

export default async function PagamentosPage({ searchParams }: PagamentosPageProps) {
  const { q, status, metodo } = await searchParams
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pagamentos</h1>
          <p className="text-gray-600 mt-2">
            Gerencie pagamentos e controle financeiro
          </p>
        </div>
        <Link href="/pagamentos/novo">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Novo Pagamento
          </Button>
        </Link>
      </div>

      {/* Estatísticas */}
      <EstatisticasPagamentos />

      {/* Filtros */}
      <FiltrosPagamentos initialQuery={q} initialStatus={status} initialMetodo={metodo} />

      {/* Table */}
      <div className="bg-white rounded-lg border">
        <PagamentosTable query={q} status={status} metodo={metodo} />
      </div>
    </div>
  )
}

