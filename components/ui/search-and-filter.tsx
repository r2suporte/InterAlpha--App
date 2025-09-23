'use client'

import React, { useState } from 'react'
import { Search, Filter, X } from 'lucide-react'
import { Input } from './input'
import { Button } from './button'
import { Card, CardContent } from './card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './popover'

interface FilterOption {
  value: string
  label: string
}

interface FilterConfig {
  key: string
  label: string
  options: FilterOption[]
}

interface SearchAndFilterProps {
  searchValue: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  filters: Record<string, any>
  onFiltersChange: (filters: Record<string, any>) => void
  filterOptions: FilterConfig[]
  className?: string
}

export function SearchAndFilter({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Pesquisar...",
  filters,
  onFiltersChange,
  filterOptions,
  className = ""
}: SearchAndFilterProps) {
  const [showFilters, setShowFilters] = useState(false)

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters }
    if (value === 'all' || !value) {
      delete newFilters[key]
    } else {
      newFilters[key] = value
    }
    onFiltersChange(newFilters)
  }

  const clearAllFilters = () => {
    onFiltersChange({})
    onSearchChange('')
  }

  const activeFiltersCount = Object.keys(filters).length + (searchValue ? 1 : 0)

  return (
    <Card className={className}>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Barra de Pesquisa */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 pr-20"
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
              <Popover open={showFilters} onOpenChange={setShowFilters}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-2"
                  >
                    <Filter className="h-4 w-4" />
                    {activeFiltersCount > 0 && (
                      <span className="ml-1 bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 text-xs">
                        {activeFiltersCount}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Filtros</h4>
                      {activeFiltersCount > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearAllFilters}
                          className="h-8 px-2 text-muted-foreground"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Limpar
                        </Button>
                      )}
                    </div>
                    
                    {filterOptions.map((filterConfig) => (
                      <div key={filterConfig.key} className="space-y-2">
                        <label className="text-sm font-medium">
                          {filterConfig.label}
                        </label>
                        <Select
                          value={filters[filterConfig.key] || 'all'}
                          onValueChange={(value) => handleFilterChange(filterConfig.key, value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {filterConfig.options.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Filtros Ativos */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap gap-2">
              {searchValue && (
                <div className="flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-sm">
                  <span>Busca: "{searchValue}"</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onSearchChange('')}
                    className="h-4 w-4 p-0 hover:bg-transparent"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
              
              {Object.entries(filters).map(([key, value]) => {
                const filterConfig = filterOptions.find(f => f.key === key)
                const option = filterConfig?.options.find(o => o.value === value)
                
                if (!filterConfig || !option) return null
                
                return (
                  <div
                    key={key}
                    className="flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-sm"
                  >
                    <span>{filterConfig.label}: {option.label}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleFilterChange(key, 'all')}
                      className="h-4 w-4 p-0 hover:bg-transparent"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}