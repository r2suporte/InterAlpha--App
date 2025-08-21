import React from 'react'
import Link from 'next/link'
import { Plus, Wrench } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import EstatisticasCards from '@/components/ordens-servico/EstatisticasCards'
import FiltrosSection from '@/components/ordens-servico/FiltrosSection'
import OrdensServicoTable from '@/components/ordens-servico/OrdensServicoTable'

interface OrdensServicoPageProps {
  searchParams: Promise<{ q?: string; status?: string }>
}

export default async function OrdensServicoPage({ searchParams }: OrdensServicoPageProps) {
  const { q, status } = await searchParams
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ordens de Serviço</h1>
          <p className="text-gray-600 mt-2">
            Gerencie suas ordens de serviço e acompanhe o progresso
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/ordens-servico/nova-apple">
            <Button className="flex items-center gap-2 bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-900 hover:to-black">
              <Plus className="h-4 w-4" />
              Nova O.S
            </Button>
          </Link>
        </div>
      </div>

      {/* Estatísticas */}
      <EstatisticasCards />

      {/* Filtros */}
      <FiltrosSection initialQuery={q} initialStatus={status} />

      {/* Table */}
      <div className="bg-white rounded-lg border">
        <OrdensServicoTable query={q} status={status} />
      </div>
    </div>
  )
}

