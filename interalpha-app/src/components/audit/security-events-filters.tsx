'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, X } from 'lucide-react'

export function SecurityEventsFilters() {
  const [filters, setFilters] = useState({
    type: '',
    severity: '',
    userId: '',
    resolved: '',
  })

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const applyFilters = () => {
    // Implementar aplicação de filtros
    console.log('Applying filters:', filters)
  }

  const clearFilters = () => {
    setFilters({
      type: '',
      severity: '',
      userId: '',
      resolved: '',
    })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label>Tipo de Evento</Label>
          <Select value={filters.type} onValueChange={(value) => handleFilterChange('type', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              <SelectItem value="MULTIPLE_FAILED_ATTEMPTS">Múltiplas tentativas falhadas</SelectItem>
              <SelectItem value="UNUSUAL_ACCESS_PATTERN">Padrão de acesso incomum</SelectItem>
              <SelectItem value="SUSPICIOUS_LOGIN">Login suspeito</SelectItem>
              <SelectItem value="BRUTE_FORCE_ATTACK">Ataque de força bruta</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Severidade</Label>
          <Select value={filters.severity} onValueChange={(value) => handleFilterChange('severity', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a severidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas</SelectItem>
              <SelectItem value="low">Baixa</SelectItem>
              <SelectItem value="medium">Média</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="critical">Crítica</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="userId">ID do Usuário</Label>
          <Input
            id="userId"
            placeholder="Digite o ID do usuário"
            value={filters.userId}
            onChange={(e) => handleFilterChange('userId', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={filters.resolved} onValueChange={(value) => handleFilterChange('resolved', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              <SelectItem value="false">Pendente</SelectItem>
              <SelectItem value="true">Resolvido</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Button onClick={applyFilters}>
          <Search className="mr-2 h-4 w-4" />
          Aplicar Filtros
        </Button>
        <Button variant="outline" onClick={clearFilters}>
          <X className="mr-2 h-4 w-4" />
          Limpar Filtros
        </Button>
      </div>
    </div>
  )
}