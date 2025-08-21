'use client'

import { useState, useEffect } from 'react'
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
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Package, 
  TrendingUp, 
  TrendingDown, 
  Settings, 
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin
} from 'lucide-react'
import { useStockManagement } from '@/hooks/use-stock-management'
import { formatCurrency } from '@/lib/utils/product-utils'

interface StockManagementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productId?: string
  productInfo?: {
    partNumber: string
    description: string
    salePrice: number
  }
}

export function StockManagementDialog({ 
  open, 
  onOpenChange, 
  productId,
  productInfo 
}: StockManagementDialogProps) {
  const { 
    isLoading, 
    createStockMovement, 
    getProductStock, 
    updateStockSettings 
  } = useStockManagement()
  
  const [activeTab, setActiveTab] = useState('movement')
  const [stockData, setStockData] = useState<any>(null)
  
  // Formulário de movimentação
  const [movementForm, setMovementForm] = useState({
    type: 'in' as 'in' | 'out' | 'adjustment',
    quantity: '',
    reason: '',
    reference: '',
    unitCost: '',
    notes: ''
  })
  
  // Formulário de configurações
  const [settingsForm, setSettingsForm] = useState({
    minQuantity: '',
    maxQuantity: '',
    reorderPoint: '',
    reorderQuantity: '',
    location: '',
    notes: ''
  })

  // Carregar dados do estoque quando abrir o dialog
  useEffect(() => {
    if (open && productId) {
      loadStockData()
    }
  }, [open, productId])

  const loadStockData = async () => {
    if (!productId) return
    
    const result = await getProductStock(productId, {
      includeHistory: true,
      historyLimit: 10
    })
    
    if (result.success) {
      setStockData(result.data)
      
      // Preencher formulário de configurações
      if (result.data.stock) {
        setSettingsForm({
          minQuantity: result.data.stock.minQuantity?.toString() || '',
          maxQuantity: result.data.stock.maxQuantity?.toString() || '',
          reorderPoint: result.data.stock.reorderPoint?.toString() || '',
          reorderQuantity: result.data.stock.reorderQuantity?.toString() || '',
          location: result.data.stock.location || '',
          notes: result.data.stock.notes || ''
        })
      }
    }
  }

  const handleMovementSubmit = async () => {
    if (!productId || !movementForm.quantity || !movementForm.reason) {
      return
    }

    const result = await createStockMovement({
      productId,
      type: movementForm.type,
      quantity: parseInt(movementForm.quantity),
      reason: movementForm.reason,
      reference: movementForm.reference || undefined,
      unitCost: movementForm.unitCost ? parseFloat(movementForm.unitCost) : undefined,
      notes: movementForm.notes || undefined
    })

    if (result.success) {
      // Limpar formulário
      setMovementForm({
        type: 'in',
        quantity: '',
        reason: '',
        reference: '',
        unitCost: '',
        notes: ''
      })
      
      // Recarregar dados
      await loadStockData()
    }
  }

  const handleSettingsSubmit = async () => {
    if (!productId) return

    const result = await updateStockSettings(productId, {
      minQuantity: settingsForm.minQuantity ? parseInt(settingsForm.minQuantity) : undefined,
      maxQuantity: settingsForm.maxQuantity ? parseInt(settingsForm.maxQuantity) : undefined,
      reorderPoint: settingsForm.reorderPoint ? parseInt(settingsForm.reorderPoint) : undefined,
      reorderQuantity: settingsForm.reorderQuantity ? parseInt(settingsForm.reorderQuantity) : undefined,
      location: settingsForm.location || undefined,
      notes: settingsForm.notes || undefined
    })

    if (result.success) {
      await loadStockData()
    }
  }

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'in': return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'out': return <TrendingDown className="h-4 w-4 text-red-500" />
      case 'adjustment': return <Settings className="h-4 w-4 text-blue-500" />
      default: return <Package className="h-4 w-4" />
    }
  }

  const getMovementLabel = (type: string) => {
    switch (type) {
      case 'in': return 'Entrada'
      case 'out': return 'Saída'
      case 'adjustment': return 'Ajuste'
      default: return type
    }
  }

  const getStockStatus = (stock: any) => {
    if (!stock) return { label: 'Desconhecido', color: 'secondary' }
    
    if (stock.quantity === 0) {
      return { label: 'Sem Estoque', color: 'destructive' }
    } else if (stock.quantity <= stock.minQuantity) {
      return { label: 'Estoque Baixo', color: 'secondary' }
    } else if (stock.quantity >= stock.maxQuantity) {
      return { label: 'Estoque Alto', color: 'outline' }
    } else {
      return { label: 'Normal', color: 'default' }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Controle de Estoque
          </DialogTitle>
          <DialogDescription>
            {productInfo ? (
              <>Gerencie o estoque do produto <strong>{productInfo.partNumber}</strong></>
            ) : (
              'Gerencie movimentações e configurações de estoque'
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Informações Atuais do Estoque */}
        {stockData?.stock && (
          <Card className="mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Status Atual</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {stockData.stock.quantity}
                  </div>
                  <div className="text-sm text-muted-foreground">Em Estoque</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {stockData.stock.reservedQuantity || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Reservado</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {stockData.stock.availableQuantity}
                  </div>
                  <div className="text-sm text-muted-foreground">Disponível</div>
                </div>
                <div className="text-center">
                  <Badge variant={getStockStatus(stockData.stock).color as any}>
                    {getStockStatus(stockData.stock).label}
                  </Badge>
                  <div className="text-sm text-muted-foreground mt-1">Status</div>
                </div>
              </div>

              {/* Alertas */}
              {stockData.alerts?.length > 0 && (
                <div className="mt-4 space-y-2">
                  {stockData.alerts.map((alert: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm text-yellow-800">{alert.message}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="movement">Movimentação</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
          </TabsList>

          {/* Aba de Movimentação */}
          <TabsContent value="movement" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Tipo de Movimentação</Label>
                  <Select 
                    value={movementForm.type} 
                    onValueChange={(value: 'in' | 'out' | 'adjustment') => 
                      setMovementForm(prev => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-green-500" />
                          Entrada
                        </div>
                      </SelectItem>
                      <SelectItem value="out">
                        <div className="flex items-center gap-2">
                          <TrendingDown className="h-4 w-4 text-red-500" />
                          Saída
                        </div>
                      </SelectItem>
                      <SelectItem value="adjustment">
                        <div className="flex items-center gap-2">
                          <Settings className="h-4 w-4 text-blue-500" />
                          Ajuste
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantidade *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    placeholder="Digite a quantidade..."
                    value={movementForm.quantity}
                    onChange={(e) => setMovementForm(prev => ({ ...prev, quantity: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">Motivo *</Label>
                  <Input
                    id="reason"
                    placeholder="Ex: Compra, Venda, Ajuste de inventário..."
                    value={movementForm.reason}
                    onChange={(e) => setMovementForm(prev => ({ ...prev, reason: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reference">Referência</Label>
                  <Input
                    id="reference"
                    placeholder="Ex: NF-12345, OS-6789..."
                    value={movementForm.reference}
                    onChange={(e) => setMovementForm(prev => ({ ...prev, reference: e.target.value }))}
                  />
                </div>

                {movementForm.type === 'in' && (
                  <div className="space-y-2">
                    <Label htmlFor="unitCost">Custo Unitário</Label>
                    <Input
                      id="unitCost"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0,00"
                      value={movementForm.unitCost}
                      onChange={(e) => setMovementForm(prev => ({ ...prev, unitCost: e.target.value }))}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    placeholder="Observações adicionais..."
                    value={movementForm.notes}
                    onChange={(e) => setMovementForm(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <Button 
              onClick={handleMovementSubmit}
              disabled={isLoading || !movementForm.quantity || !movementForm.reason}
              className="w-full"
            >
              {isLoading ? 'Registrando...' : 'Registrar Movimentação'}
            </Button>
          </TabsContent>

          {/* Aba de Histórico */}
          <TabsContent value="history">
            <ScrollArea className="h-96">
              {stockData?.history?.length > 0 ? (
                <div className="space-y-3">
                  {stockData.history.map((movement: any) => (
                    <Card key={movement.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            {getMovementIcon(movement.type)}
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  {getMovementLabel(movement.type)}
                                </span>
                                <Badge variant="outline">
                                  {movement.quantity} unidades
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {movement.reason}
                              </p>
                              {movement.reference && (
                                <p className="text-xs text-muted-foreground">
                                  Ref: {movement.reference}
                                </p>
                              )}
                              {movement.user && (
                                <p className="text-xs text-muted-foreground">
                                  Por: {movement.user.name}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right text-sm">
                            <div className="text-muted-foreground">
                              {new Date(movement.createdAt).toLocaleDateString('pt-BR')}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(movement.createdAt).toLocaleTimeString('pt-BR')}
                            </div>
                            <div className="text-xs mt-1">
                              {movement.previousQuantity} → {movement.newQuantity}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma movimentação registrada</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Aba de Configurações */}
          <TabsContent value="settings" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="minQuantity">Quantidade Mínima</Label>
                  <Input
                    id="minQuantity"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={settingsForm.minQuantity}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, minQuantity: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxQuantity">Quantidade Máxima</Label>
                  <Input
                    id="maxQuantity"
                    type="number"
                    min="0"
                    placeholder="1000"
                    value={settingsForm.maxQuantity}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, maxQuantity: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reorderPoint">Ponto de Reposição</Label>
                  <Input
                    id="reorderPoint"
                    type="number"
                    min="0"
                    placeholder="10"
                    value={settingsForm.reorderPoint}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, reorderPoint: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reorderQuantity">Quantidade de Reposição</Label>
                  <Input
                    id="reorderQuantity"
                    type="number"
                    min="0"
                    placeholder="50"
                    value={settingsForm.reorderQuantity}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, reorderQuantity: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Localização</Label>
                  <Input
                    id="location"
                    placeholder="Ex: Estoque A - Prateleira 3"
                    value={settingsForm.location}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, location: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="settingsNotes">Observações</Label>
                  <Textarea
                    id="settingsNotes"
                    placeholder="Observações sobre o estoque..."
                    value={settingsForm.notes}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <Button 
              onClick={handleSettingsSubmit}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}