import React from 'react'
import Link from 'next/link'
import { Plus, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import EstatisticasClientes from '@/components/clientes/EstatisticasClientes'
import ClientesTable from '@/components/clientes/ClientesTable'
import FiltrosClientes from '@/components/clientes/FiltrosClientes'

interface ClientesPageProps {
  searchParams: Promise<{ q?: string }>
}

export default async function ClientesPage({ searchParams }: ClientesPageProps) {
  const { q } = await searchParams
  
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Gestão de Clientes 👥
            </h1>
            <p className="text-xl text-gray-600 mt-2">
              Gerencie seus clientes e relacionamentos comerciais
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200/50 rounded-xl">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">Dados em tempo real</span>
            </div>
            <Link href="/clientes/novo">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg border-0">
                <Plus className="h-4 w-4 mr-2" />
                Novo Cliente
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      <EstatisticasClientes />

      {/* Filtros */}
      <div className="bg-white/50 backdrop-blur-sm border border-gray-200/50 rounded-xl p-6 shadow-lg">
        <FiltrosClientes initialQuery={q} />
      </div>

      {/* Tabela */}
      <div className="bg-white/50 backdrop-blur-sm border border-gray-200/50 rounded-xl shadow-lg overflow-hidden">
        <ClientesTable query={q} />
      </div>
    </div>
  )
}