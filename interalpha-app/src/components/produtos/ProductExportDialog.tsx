'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Download, FileText, Database, Settings } from 'lucide-react'
import { useProductExport } from '@/hooks/use-product-export'
import { Separator } from '@/components/ui/separator'

interface ProductExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialFilters?: {
    search?: string
    isActive?: boolean
  }
}

const EXPORT_COLUMNS = [
  { id: 'partNumber', label: 'Part Number', default: true },
  { id: 'description', label: 'Descrição', default: true },
  { id: 'costPrice', label: 'Preço de Custo', default: true },
  { id: 'salePrice', label: 'Preço de Venda', default: true },
  { id: 'margin', label: 'Margem (%)', default: true },
  { id: 'profit', label: 'Lucro (R$)', default: false },
  { id: 'status', label: 'Status', default: true },
  { id: 'createdAt', label: 'Criado em', default: false },
  { id: 'createdBy', label: 'Criado por', default: false },
  { id: 'image', label: 'Imagem', default: false },
  { id: 'timesUsed', label: 'Vezes Usado', default: false }
]

export function ProductExportDialog({ 
  open, 
  onOpenChange, 
  initialFilters = {} 
}: ProductExportDialogProps) {
  const { exportProducts, downloadTemplate, isExporting, exportProgress } = useProductExport()
  
  const [format, setFormat] = useState<'csv' | 'json'>('csv')
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    EXPORT_COLUMNS.filter(col => col.default).map(col => col.id)
  )
  const [filters, setFilters] = useState({
    search: initialFilters.search || '',
    isActive: initialFilters.isActive,
    sortBy: 'partNumber',
    sortOrder: 'asc' as 'asc' | 'desc'
  })
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleExport = async () => {
    const result = await exportProducts({
      format,
      filters: {
        ...filters,
        isActive: filters.isActive
      },
      columns: format === 'csv' ? selectedColumns : undefined
    })

    if (result.success) {
      onOpenChange(false)
    }
  }

  const handleDownloadTemplate = async () => {
    await downloadTemplate(format, true)
  }

  const handleColumnToggle = (columnId: string, checked: boolean) => {
    if (checked) {
      setSelectedColumns(prev => [...prev, columnId])
    } else {
      setSelectedColumns(prev => prev.filter(id => id !== columnId))
    }
  }

  const handleSelectAllColumns = () => {
    setSelectedColumns(EXPORT_COLUMNS.map(col => col.id))
  }

  const handleDeselectAllColumns = () => {
    setSelectedColumns([])
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Exportar Produtos
          </DialogTitle>
          <DialogDescription>
            Configure as opções de exportação e baixe seus produtos em diferentes formatos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Formato */}
          <div className="space-y-2">
            <Label>Formato de Exportação</Label>
            <Select value={format} onValueChange={(value: 'csv' | 'json') => setFormat(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    CSV (Excel)
                  </div>
                </SelectItem>
                <SelectItem value="json">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    JSON (Dados)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filtros Básicos */}
          <div className="space-y-4">
            <Label>Filtros</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Buscar</Label>
                <Input
                  id="search"
                  placeholder="Part number ou descrição..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select 
                  value={filters.isActive === undefined ? 'all' : filters.isActive ? 'active' : 'inactive'} 
                  onValueChange={(value) => setFilters(prev => ({ 
                    ...prev, 
                    isActive: value === 'all' ? undefined : value === 'active' 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Apenas Ativos</SelectItem>
                    <SelectItem value="inactive">Apenas Inativos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Opções Avançadas */}
          <div className="space-y-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              {showAdvanced ? 'Ocultar' : 'Mostrar'} Opções Avançadas
            </Button>

            {showAdvanced && (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                {/* Ordenação */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Ordenar por</Label>
                    <Select 
                      value={filters.sortBy} 
                      onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="partNumber">Part Number</SelectItem>
                        <SelectItem value="description">Descrição</SelectItem>
                        <SelectItem value="salePrice">Preço de Venda</SelectItem>
                        <SelectItem value="createdAt">Data de Criação</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Ordem</Label>
                    <Select 
                      value={filters.sortOrder} 
                      onValueChange={(value: 'asc' | 'desc') => setFilters(prev => ({ ...prev, sortOrder: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asc">Crescente</SelectItem>
                        <SelectItem value="desc">Decrescente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Colunas (apenas para CSV) */}
                {format === 'csv' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Colunas para Exportar</Label>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleSelectAllColumns}
                        >
                          Todas
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleDeselectAllColumns}
                        >
                          Nenhuma
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                      {EXPORT_COLUMNS.map((column) => (
                        <div key={column.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={column.id}
                            checked={selectedColumns.includes(column.id)}
                            onCheckedChange={(checked) => 
                              handleColumnToggle(column.id, checked as boolean)
                            }
                          />
                          <Label htmlFor={column.id} className="text-sm">
                            {column.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Progress Bar */}
          {isExporting && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Exportando produtos...</span>
                <span>{exportProgress}%</span>
              </div>
              <Progress value={exportProgress} className="w-full" />
            </div>
          )}
        </div>

        <Separator />

        <DialogFooter className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handleDownloadTemplate}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Baixar Template
          </Button>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleExport} 
              disabled={isExporting || (format === 'csv' && selectedColumns.length === 0)}
              className="flex items-center gap-2"
            >
              {isExporting ? (
                <>Exportando...</>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Exportar {format.toUpperCase()}
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}