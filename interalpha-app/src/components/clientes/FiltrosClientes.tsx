'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useRouter, useSearchParams } from 'next/navigation'

interface FiltrosClientesProps {
  initialQuery?: string
}

export default function FiltrosClientes({ initialQuery }: FiltrosClientesProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(initialQuery || '')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    
    const params = new URLSearchParams(searchParams.toString())
    
    if (query.trim()) {
      params.set('q', query.trim())
    } else {
      params.delete('q')
    }
    
    router.push(`/clientes?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-gray-400" />
        <span className="text-sm font-medium text-gray-600">Buscar:</span>
      </div>
      
      <form onSubmit={handleSearch} className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Nome, email, documento ou cidade..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </form>
    </div>
  )
}