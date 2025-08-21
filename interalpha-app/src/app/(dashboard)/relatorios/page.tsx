import React from 'react'
import { BarChart3, Sparkles } from 'lucide-react'
import FiltrosRelatorio from '@/components/relatorios/FiltrosRelatorio'
import RelatorioMensal from '@/components/relatorios/RelatorioMensal'

interface RelatoriosPageProps {
  searchParams: Promise<{ mes?: string; ano?: string }>
}

export default async function RelatoriosPage({ searchParams }: RelatoriosPageProps) {
  const { mes, ano } = await searchParams
  
  const mesAtual = mes ? parseInt(mes) : new Date().getMonth() + 1
  const anoAtual = ano ? parseInt(ano) : new Date().getFullYear()

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Relatórios Financeiros 📊
            </h1>
            <p className="text-xl text-gray-600 mt-2">
              Análise completa do desempenho do seu negócio
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200/50 rounded-xl">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">Dados em tempo real</span>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white/50 backdrop-blur-sm border border-gray-200/50 rounded-xl p-6 shadow-lg">
        <FiltrosRelatorio mesAtual={mesAtual} anoAtual={anoAtual} />
      </div>

      {/* Relatório Mensal */}
      <RelatorioMensal mes={mesAtual} ano={anoAtual} />
    </div>
  )
}