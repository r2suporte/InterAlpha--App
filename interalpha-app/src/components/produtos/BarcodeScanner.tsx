'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Scan, 
  Camera, 
  Search, 
  Package, 
  DollarSign, 
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  History
} from 'lucide-react'
import { useBarcodeScanner } from '@/hooks/use-barcode-scanner'
import { formatCurrency, formatPercentage } from '@/lib/utils/product-utils'

interface BarcodeScannerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onProductFound?: (product: any) => void
}

export function BarcodeScanner({ 
  open, 
  onOpenChange, 
  onProductFound 
}: BarcodeScannerProps) {
  const { 
    scanProduct, 
    generateBarcode, 
    startCameraScanner, 
    clearHistory, 
    isScanning, 
    lastScanResult, 
    scanHistory 
  } = useBarcodeScanner()
  
  const [manualInput, setManualInput] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Focar no input quando abrir o dialog
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
    }
  }, [open])

  const handleManualScan = async () => {
    if (!manualInput.trim()) return
    
    const result = await scanProduct(manualInput.trim())
    
    if (result.success && result.product) {
      onProductFound?.(result.product)
    }
    
    setManualInput('')
  }

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleManualScan()
    }
  }

  const handleCameraScan = async () => {
    const success = await startCameraScanner()
    if (!success) {
      // Fallback para input manual
      inputRef.current?.focus()
    }
  }

  const handleHistoryItemClick = (historyItem: any) => {
    if (historyItem.success && historyItem.product) {
      onProductFound?.(historyItem.product)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scan className="h-5 w-5" />
            Scanner de Código de Barras
          </DialogTitle>
          <DialogDescription>
            Escaneie ou digite o código de barras para buscar produtos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Métodos de Entrada */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Scanner Manual */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Entrada Manual
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="manual-input">Part Number</Label>
                  <Input
                    ref={inputRef}
                    id="manual-input"
                    placeholder="Digite ou escaneie o código..."
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={isScanning}
                  />
                </div>
                <Button 
                  onClick={handleManualScan} 
                  disabled={!manualInput.trim() || isScanning}
                  className="w-full"
                >
                  {isScanning ? 'Buscando...' : 'Buscar Produto'}
                </Button>
              </CardContent>
            </Card>

            {/* Scanner de Câmera */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  Scanner de Câmera
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Use a câmera para escanear códigos de barras automaticamente.
                </p>
                <Button 
                  onClick={handleCameraScan}
                  variant="outline"
                  className="w-full"
                  disabled={isScanning}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Abrir Câmera
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Funcionalidade em desenvolvimento
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Resultado da Última Busca */}
          {lastScanResult && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  {lastScanResult.success ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  Último Resultado
                </CardTitle>
              </CardHeader>
              <CardContent>
                {lastScanResult.success && lastScanResult.product ? (
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h3 className="font-semibold text-lg">
                          {lastScanResult.product.partNumber}
                        </h3>
                        <p className="text-muted-foreground">
                          {lastScanResult.product.description}
                        </p>
                      </div>
                      <Badge variant={lastScanResult.product.isActive ? 'default' : 'secondary'}>
                        {lastScanResult.product.isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Preço</p>
                          <p className="font-medium">
                            {formatCurrency(lastScanResult.product.salePrice)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Custo</p>
                          <p className="font-medium">
                            {formatCurrency(lastScanResult.product.costPrice)}
                          </p>
                        </div>
                      </div>

                      {lastScanResult.product.pricing && (
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">Margem</p>
                            <p className="font-medium">
                              {formatPercentage(lastScanResult.product.pricing.margin)}
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Encontrado</p>
                          <p className="font-medium text-xs">
                            {new Date(lastScanResult.product.barcode?.foundAt || Date.now())
                              .toLocaleTimeString('pt-BR', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => onProductFound?.(lastScanResult.product)}
                      >
                        Usar Produto
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => generateBarcode(lastScanResult.product.partNumber)}
                      >
                        Gerar Código de Barras
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                    <p className="font-medium">Produto não encontrado</p>
                    <p className="text-sm text-muted-foreground">
                      Part Number: {lastScanResult.partNumber}
                    </p>
                    {lastScanResult.error && (
                      <p className="text-sm text-red-600 mt-1">
                        {lastScanResult.error}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Histórico de Buscas */}
          {scanHistory.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <History className="h-4 w-4" />
                    Histórico de Buscas ({scanHistory.length})
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowHistory(!showHistory)}
                    >
                      {showHistory ? 'Ocultar' : 'Mostrar'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={clearHistory}
                    >
                      Limpar
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              {showHistory && (
                <CardContent>
                  <ScrollArea className="h-48">
                    <div className="space-y-2">
                      {scanHistory.map((item, index) => (
                        <div
                          key={index}
                          className={`p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors ${
                            item.success ? 'border-green-200' : 'border-red-200'
                          }`}
                          onClick={() => handleHistoryItemClick(item)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {item.success ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-500" />
                              )}
                              <span className="font-medium">
                                {item.partNumber}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date().toLocaleTimeString('pt-BR', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                          </div>
                          
                          {item.success && item.product ? (
                            <p className="text-sm text-muted-foreground mt-1">
                              {item.product.description}
                            </p>
                          ) : (
                            <p className="text-sm text-red-600 mt-1">
                              {item.error}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              )}
            </Card>
          )}
        </div>

        <Separator />

        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            Dica: Use um scanner físico ou digite o código manualmente
          </div>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}