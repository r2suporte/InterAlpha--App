'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Filter } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface FiltrosPagamentosProps {
  initialQuery?: string
  initialStatus?: string
  initialMetodo?: string
}

export default function FiltrosPagamentos({ 
  initialQuery, 
  initialStatus, 
  initialMetodo 
}: FiltrosPagamentosProps) {
  const router = useRouter()
  const [query, setQuery] = useState(initialQuery || '')
  const [status, setStatus] = useState(initialStatus || 'all')
  const [metodo, setMetodo] = useState(initialMetodo || 'all')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateURL(query, status, metodo)
  }

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus)
    updateURL(query, newStatus, metodo)
  }

  const handleMetodoChange = (newMetodo: string) => {
    setMetodo(newMetodo)
    updateURL(query, status, newMetodo)
  }

  const updateURL = (searchQuery: string, statusFilter: string, metodoFilter: string) => {
    try {
      const params = new URLSearchParams()
      
      if (searchQuery.trim()) {
        params.set('q', searchQuery.trim())
      }
      
      if (statusFilter && statusFilter !== 'all') {
        params.set('status', statusFilter)
      }

      if (metodoFilter && metodoFilter !== 'all') {
        params.set('metodo', metodoFilter)
      }

      const queryString = params.toString()
      const newURL = queryString ? `/pagamentos?${queryString}` : '/pagamentos'
      
      router.push(newURL)
    } catch (error) {
      console.error('Erro ao atualizar URL:', error)
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <form onSubmit={handleSearch}>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar pagamentos..."
            className="pl-10"
          />
        </form>
      </div>
      
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-gray-400" />
        <Select
          value={status}
          onValueChange={handleStatusChange}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Todos os status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="PENDENTE">Pendente</SelectItem>
            <SelectItem value="PAGO">Pago</SelectItem>
            <SelectItem value="CANCELADO">Cancelado</SelectItem>
            <SelectItem value="ESTORNADO">Estornado</SelectItem>
          </SelectContent>
        </Select>
        
        <Select
          value={metodo}
          onValueChange={handleMetodoChange}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Todos os métodos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os métodos</SelectItem>
            <SelectItem value="DINHEIRO">Dinheiro</SelectItem>
            <SelectItem value="PIX">PIX</SelectItem>
            <SelectItem value="CARTAO_CREDITO">Cartão de Crédito</SelectItem>
            <SelectItem value="CARTAO_DEBITO">Cartão de Débito</SelectItem>
            <SelectItem value="TRANSFERENCIA">Transferência</SelectItem>
            <SelectItem value="BOLETO">Boleto</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}