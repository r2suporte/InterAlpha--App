'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Filter } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface FiltrosSectionProps {
  initialQuery?: string
  initialStatus?: string
}

export default function FiltrosSection({ initialQuery, initialStatus }: FiltrosSectionProps) {
  const router = useRouter()
  const [query, setQuery] = useState(initialQuery || '')
  const [status, setStatus] = useState(initialStatus || 'all')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateURL(query, status)
  }

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus)
    updateURL(query, newStatus)
  }

  const updateURL = (searchQuery: string, statusFilter: string) => {
    try {
      const params = new URLSearchParams()
      
      if (searchQuery.trim()) {
        params.set('q', searchQuery.trim())
      }
      
      if (statusFilter && statusFilter !== 'all') {
        params.set('status', statusFilter)
      }

      const queryString = params.toString()
      const newURL = queryString ? `/ordens-servico?${queryString}` : '/ordens-servico'
      
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
            placeholder="Buscar ordens de serviço..."
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
            <SelectItem value="EM_ANDAMENTO">Em Andamento</SelectItem>
            <SelectItem value="CONCLUIDA">Concluída</SelectItem>
            <SelectItem value="CANCELADA">Cancelada</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}