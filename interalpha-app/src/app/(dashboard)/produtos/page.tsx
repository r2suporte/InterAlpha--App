'use client'

import React, { useState } from 'react'
import { Plus, Download, Upload, Scan, Package, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import ProductsStats from '@/components/produtos/ProductsStats'
import ProductsTable from '@/components/produtos/ProductsTable'
import { ProductExportDialog } from '@/components/produtos/ProductExportDialog'
import { ProductImportDialog } from '@/components/produtos/ProductImportDialog'
import { BarcodeScanner } from '@/components/produtos/BarcodeScanner'
import { StockManagementDialog } from '@/components/produtos/StockManagementDialog'
import { NotificationCenter } from '@/components/produtos/NotificationCenter'

export default function ProdutosPage() {
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false)
  const [showStockDialog, setShowStockDialog] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [selectedProduct] = useState<any>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleImportComplete = () => {
    // Refresh da tabela após importação
    setRefreshKey(prev => prev + 1)
  }

  const handleProductFound = (product: any) => {
    // Quando um produto é encontrado via scanner, pode navegar para detalhes
    window.location.href = `/produtos/${product.id}`
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Gestão de Produtos 📦
            </h1>
            <p className="text-xl text-gray-600 mt-2">
              Gerencie seu catálogo de produtos e controle de estoque
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Notificações */}
            <Button
              variant="outline"
              onClick={() => setShowNotifications(true)}
              className="flex items-center gap-2"
            >
              <Bell className="h-4 w-4" />
              Notificações
            </Button>

            {/* Controle de Estoque */}
            <Button
              variant="outline"
              onClick={() => setShowStockDialog(true)}
              className="flex items-center gap-2"
            >
              <Package className="h-4 w-4" />
              Estoque
            </Button>

            {/* Scanner de Código de Barras */}
            <Button
              variant="outline"
              onClick={() => setShowBarcodeScanner(true)}
              className="flex items-center gap-2"
            >
              <Scan className="h-4 w-4" />
              Scanner
            </Button>

            {/* Importar */}
            <Button
              variant="outline"
              onClick={() => setShowImportDialog(true)}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Importar
            </Button>

            {/* Exportar */}
            <Button
              variant="outline"
              onClick={() => setShowExportDialog(true)}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Exportar
            </Button>

            {/* Novo Produto */}
            <Link href="/produtos/novo">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-xl border-0">
                <Plus className="h-4 w-4 mr-2" />
                Novo Produto
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      <ProductsStats key={refreshKey} />

      {/* Tabela de Produtos */}
      <ProductsTable 
        key={refreshKey}
        showActions={true}
        onProductEdit={(productId) => {
          // Navegação será tratada pelo componente
          window.location.href = `/produtos/${productId}/editar`
        }}
        onProductDelete={(productId) => {
          // Confirmação e exclusão será tratada pelo componente
          if (confirm('Tem certeza que deseja excluir este produto?')) {
            // Implementar exclusão via API
            fetch(`/api/produtos/${productId}`, { method: 'DELETE' })
              .then(() => {
                setRefreshKey(prev => prev + 1)
              })
              .catch(console.error)
          }
        }}
      />

      {/* Dialogs */}
      <ProductExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
      />

      <ProductImportDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onImportComplete={handleImportComplete}
      />

      <BarcodeScanner
        open={showBarcodeScanner}
        onOpenChange={setShowBarcodeScanner}
        onProductFound={handleProductFound}
      />

      <StockManagementDialog
        open={showStockDialog}
        onOpenChange={setShowStockDialog}
        productId={selectedProduct?.id}
        productInfo={selectedProduct}
      />

      <NotificationCenter
        open={showNotifications}
        onOpenChange={setShowNotifications}
      />
    </div>
  )
}