/**
 * Componente ProductCard - Card de produto para listagem
 */

'use client'

import { useState } from 'react'
import Image from 'next/image'
import { MoreHorizontal, Edit, Trash2, Eye, Copy } from 'lucide-react'
import { ProductWithCalculations } from '@/types/product'
import { formatCurrency, getMarginColor, getMarginQuality } from '@/lib/utils/product-utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface ProductCardProps {
  product: ProductWithCalculations
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onView: (id: string) => void
  onDuplicate?: (id: string) => void
  isLoading?: boolean
}

export function ProductCard({ 
  product, 
  onEdit, 
  onDelete, 
  onView, 
  onDuplicate,
  isLoading = false 
}: ProductCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const handleDelete = () => {
    onDelete(product.id)
    setShowDeleteDialog(false)
  }

  const marginColor = getMarginColor(product.profitMargin)
  const marginQuality = getMarginQuality(product.profitMargin)

  return (
    <>
      <Card className={`group hover:shadow-lg transition-all duration-200 ${
        !product.isActive ? 'opacity-60' : ''
      } ${isLoading ? 'animate-pulse' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-sm text-gray-900 truncate">
                  {product.partNumber}
                </h3>
                {!product.isActive && (
                  <Badge variant="secondary" className="text-xs">
                    Inativo
                  </Badge>
                )}
              </div>
              <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                {product.description}
              </p>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => onView(product.id)}>
                  <Eye className="mr-2 h-4 w-4" />
                  Visualizar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(product.id)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
                {onDuplicate && (
                  <DropdownMenuItem onClick={() => onDuplicate(product.id)}>
                    <Copy className="mr-2 h-4 w-4" />
                    Duplicar
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="pb-3">
          {/* Imagem do produto */}
          <div className="relative w-full h-32 mb-3 bg-gray-50 rounded-lg overflow-hidden">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.description}
                fill
                className="object-cover hover:scale-105 transition-transform duration-200"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <div className="w-8 h-8 mx-auto mb-1 bg-gray-200 rounded"></div>
                  <span className="text-xs">Sem imagem</span>
                </div>
              </div>
            )}
          </div>

          {/* Preços */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Custo:</span>
              <span className="font-medium">{product.formattedCostPrice}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Venda:</span>
              <span className="font-semibold text-green-600">{product.formattedSalePrice}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Lucro:</span>
              <span className="font-medium">{product.formattedProfitAmount}</span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="pt-3 border-t">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Margem:</span>
              <Badge 
                variant="outline" 
                className={`text-xs ${marginColor} border-current`}
              >
                {product.profitMargin.toFixed(1)}%
              </Badge>
            </div>
            <span className={`text-xs font-medium ${marginColor}`}>
              {marginQuality}
            </span>
          </div>
        </CardFooter>
      </Card>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o produto <strong>{product.partNumber}</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}