/**
 * Componente ProductSearch - Busca de produtos com debounce
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface ProductSearchProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  debounceMs?: number
  className?: string
}

export function ProductSearch({
  value,
  onChange,
  placeholder = 'Buscar produtos...',
  debounceMs = 300,
  className = ''
}: ProductSearchProps) {
  const [localValue, setLocalValue] = useState(value)

  // Debounce da busca
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue)
      }
    }, debounceMs)

    return () => clearTimeout(timeoutId)
  }, [localValue, value, onChange, debounceMs])

  // Sincronizar com valor externo
  useEffect(() => {
    setLocalValue(value)
  }, [value])

  const handleClear = useCallback(() => {
    setLocalValue('')
    onChange('')
  }, [onChange])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClear()
    }
  }, [handleClear])

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          type="text"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="pl-10 pr-10"
        />
        {localValue && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>
    </div>
  )
}