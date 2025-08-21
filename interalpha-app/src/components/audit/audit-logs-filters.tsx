'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, Search, X } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'

export function AuditLogsFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [filters, setFilters] = useState({
    userId: searchParams.get('userId') || '',
    userType: searchParams.get('userType') || '',
    action: searchParams.get('action') || '',
    resource: searchParams.get('resource') || '',
    result: searchParams.get('result') || '',
    ipAddress: searchParams.get('ipAddress') || '',
    startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
    endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
  })

  const handleFilterChange = (key: string, value: string | Date | undefined) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const applyFilters = () => {
    const params = new URLSearchParams()
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        if (value instanceof Date) {
          params.set(key, value.toISOString())
        } else {
          params.set(key, value.toString())
        }
      }
    })

    router.push(`/auditoria/logs?${params.toString()}`)
  }

  const clearFilters = () => {
    setFilters({
      userId: '',
      userType: '',
      action: '',
      resource: '',
      result: '',
      ipAddress: '',
      startDate: undefined,
      endDate: undefined,
    })
    router.push('/auditoria/logs')
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* User ID */}
        <div className="space-y-2">
          <Label htmlFor="userId">ID do Usuário</Label>
          <Input
            id="userId"
            placeholder="Digite o ID do usuário"
            value={filters.userId}
            onChange={(e) => handleFilterChange('userId', e.target.value)}
          />
        </div>

        {/* User Type */}
        <div className="space-y-2">
          <Label>Tipo de Usuário</Label>
          <Select value={filters.userType} onValueChange={(value) => handleFilterChange('userType', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              <SelectItem value="employee">Funcionário</SelectItem>
              <SelectItem value="client">Cliente</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Action */}
        <div className="space-y-2">
          <Label htmlFor="action">Ação</Label>
          <Input
            id="action"
            placeholder="Ex: create_client, update_order"
            value={filters.action}
            onChange={(e) => handleFilterChange('action', e.target.value)}
          />
        </div>

        {/* Resource */}
        <div className="space-y-2">
          <Label htmlFor="resource">Recurso</Label>
          <Input
            id="resource"
            placeholder="Ex: clients, orders, payments"
            value={filters.resource}
            onChange={(e) => handleFilterChange('resource', e.target.value)}
          />
        </div>

        {/* Result */}
        <div className="space-y-2">
          <Label>Resultado</Label>
          <Select value={filters.result} onValueChange={(value) => handleFilterChange('result', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o resultado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              <SelectItem value="success">Sucesso</SelectItem>
              <SelectItem value="failure">Falha</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* IP Address */}
        <div className="space-y-2">
          <Label htmlFor="ipAddress">Endereço IP</Label>
          <Input
            id="ipAddress"
            placeholder="Ex: 192.168.1.100"
            value={filters.ipAddress}
            onChange={(e) => handleFilterChange('ipAddress', e.target.value)}
          />
        </div>
      </div>

      {/* Date Range */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Data Inicial</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !filters.startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.startDate ? (
                  format(filters.startDate, "PPP", { locale: ptBR })
                ) : (
                  <span>Selecione a data inicial</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={filters.startDate}
                onSelect={(date) => handleFilterChange('startDate', date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>Data Final</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !filters.endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.endDate ? (
                  format(filters.endDate, "PPP", { locale: ptBR })
                ) : (
                  <span>Selecione a data final</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={filters.endDate}
                onSelect={(date) => handleFilterChange('endDate', date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Action Buttons */}
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