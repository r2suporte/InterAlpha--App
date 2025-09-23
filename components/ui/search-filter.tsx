"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { 
  Search, 
  Filter, 
  X, 
  SlidersHorizontal,
  Calendar,
  ChevronDown
} from "lucide-react"

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  onClear?: () => void
}

export function SearchBar({ 
  value, 
  onChange, 
  placeholder = "Pesquisar...",
  className,
  onClear 
}: SearchBarProps) {
  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-10 pr-10"
      />
      {value && onClear && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 p-0"
          onClick={onClear}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}

interface FilterOption {
  value: string
  label: string
  count?: number
}

interface FilterSelectProps {
  value: string
  onChange: (value: string) => void
  options: FilterOption[]
  placeholder?: string
  label?: string
  className?: string
}

export function FilterSelect({ 
  value, 
  onChange, 
  options, 
  placeholder = "Selecionar...",
  label,
  className 
}: FilterSelectProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">Todos</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex items-center justify-between w-full">
                <span>{option.label}</span>
                {option.count !== undefined && (
                  <Badge variant="secondary" className="ml-2">
                    {option.count}
                  </Badge>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

interface ActiveFilter {
  key: string
  label: string
  value: string
  displayValue: string
}

interface ActiveFiltersProps {
  filters: ActiveFilter[]
  onRemoveFilter: (key: string) => void
  onClearAll: () => void
  className?: string
}

export function ActiveFilters({ 
  filters, 
  onRemoveFilter, 
  onClearAll,
  className 
}: ActiveFiltersProps) {
  if (filters.length === 0) return null

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <span className="text-sm text-muted-foreground">Filtros ativos:</span>
      {filters.map((filter) => (
        <Badge 
          key={filter.key} 
          variant="secondary" 
          className="flex items-center gap-1"
        >
          <span className="text-xs">{filter.label}:</span>
          <span>{filter.displayValue}</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-4 w-4 p-0 hover:bg-transparent"
            onClick={() => onRemoveFilter(filter.key)}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      ))}
      {filters.length > 1 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="h-6 text-xs text-muted-foreground hover:text-foreground"
        >
          Limpar todos
        </Button>
      )}
    </div>
  )
}

interface FilterPanelProps {
  children: React.ReactNode
  title?: string
  className?: string
  trigger?: React.ReactNode
}

export function FilterPanel({ 
  children, 
  title = "Filtros",
  className,
  trigger 
}: FilterPanelProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            {title}
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className={cn("w-80", className)} align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">{title}</h4>
          </div>
          <Separator />
          {children}
        </div>
      </PopoverContent>
    </Popover>
  )
}

interface DateRangeFilterProps {
  startDate: string
  endDate: string
  onStartDateChange: (date: string) => void
  onEndDateChange: (date: string) => void
  label?: string
  className?: string
}

export function DateRangeFilter({ 
  startDate, 
  endDate, 
  onStartDateChange, 
  onEndDateChange,
  label = "Período",
  className 
}: DateRangeFilterProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <label className="text-sm font-medium text-foreground">
        {label}
      </label>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">De</label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Até</label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
          />
        </div>
      </div>
    </div>
  )
}

// Componente completo que combina search e filtros
interface SearchAndFilterProps {
  searchValue: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  filters?: React.ReactNode
  activeFilters?: ActiveFilter[]
  onRemoveFilter?: (key: string) => void
  onClearAllFilters?: () => void
  className?: string
  actions?: React.ReactNode
}

export function SearchAndFilter({
  searchValue,
  onSearchChange,
  searchPlaceholder,
  filters,
  activeFilters = [],
  onRemoveFilter,
  onClearAllFilters,
  className,
  actions
}: SearchAndFilterProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 max-w-md">
          <SearchBar
            value={searchValue}
            onChange={onSearchChange}
            placeholder={searchPlaceholder}
            onClear={() => onSearchChange("")}
          />
        </div>
        
        <div className="flex items-center gap-2">
          {filters}
          {actions}
        </div>
      </div>

      {activeFilters.length > 0 && onRemoveFilter && onClearAllFilters && (
        <ActiveFilters
          filters={activeFilters}
          onRemoveFilter={onRemoveFilter}
          onClearAll={onClearAllFilters}
        />
      )}
    </div>
  )
}