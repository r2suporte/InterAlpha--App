'use client'

import { useState } from 'react'
import { Calendar } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useRouter, useSearchParams } from 'next/navigation'

interface FiltrosRelatorioProps {
  mesAtual: number
  anoAtual: number
}

export default function FiltrosRelatorio({ mesAtual, anoAtual }: FiltrosRelatorioProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mes, setMes] = useState(mesAtual.toString())
  const [ano, setAno] = useState(anoAtual.toString())

  const handleMesChange = (novoMes: string) => {
    setMes(novoMes)
    const params = new URLSearchParams(searchParams.toString())
    params.set('mes', novoMes)
    params.set('ano', ano)
    router.push(`/relatorios?${params.toString()}`)
  }

  const handleAnoChange = (novoAno: string) => {
    setAno(novoAno)
    const params = new URLSearchParams(searchParams.toString())
    params.set('mes', mes)
    params.set('ano', novoAno)
    router.push(`/relatorios?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-gray-400" />
        <span className="text-sm font-medium text-gray-600">Período:</span>
      </div>
      
      <div className="flex items-center gap-3">
        <Select value={mes} onValueChange={handleMesChange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Selecione o mês" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Janeiro</SelectItem>
            <SelectItem value="2">Fevereiro</SelectItem>
            <SelectItem value="3">Março</SelectItem>
            <SelectItem value="4">Abril</SelectItem>
            <SelectItem value="5">Maio</SelectItem>
            <SelectItem value="6">Junho</SelectItem>
            <SelectItem value="7">Julho</SelectItem>
            <SelectItem value="8">Agosto</SelectItem>
            <SelectItem value="9">Setembro</SelectItem>
            <SelectItem value="10">Outubro</SelectItem>
            <SelectItem value="11">Novembro</SelectItem>
            <SelectItem value="12">Dezembro</SelectItem>
          </SelectContent>
        </Select>

        <Select value={ano} onValueChange={handleAnoChange}>
          <SelectTrigger className="w-24">
            <SelectValue placeholder="Ano" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2024">2024</SelectItem>
            <SelectItem value="2025">2025</SelectItem>
            <SelectItem value="2026">2026</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}