import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Package, 
  Edit, 
  Trash2, 
  Copy, 
  ArrowLeft, 
  Calendar,
  User,
  TrendingUp,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { ProductWithCalculations } from '@/types/product'
import { formatCurrency, formatPercentage, getMarginStatusClass } from '@/lib/utils/product-utils'
import { deleteProduct, duplicateProduct } from '@/app/actions/produtos'
import Link from 'next/link'
import Image from 'next/image'

interface ProductDetailsProps {
  product: ProductWithCalculations
  success?: string
  error?: string
}

export default function ProductDetails({ product, success, error }: ProductDetailsProps) {
  const canDelete = !product.orderItems || product.orderItems.length === 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/produtos">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              {product.partNumber}
            </h1>
            <p className="text-gray-600 mt-1">{product.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/produtos/${product.id}/editar`}>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </Link>
          
          <form action={duplicateProduct.bind(null, product.id)}>
            <Button type="submit" variant="outline">
              <Copy className="h-4 w-4 mr-2" />
              Duplicar
            </Button>
          </form>

          {canDelete && (
            <form action={deleteProduct.bind(null, product.id)}>
              <Button type="submit" variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </Button>
            </form>
          )}
        </div>
      </div>

      {/* Mensagens de Feedback */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{decodeURIComponent(error)}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {success === 'updated' && 'Produto atualizado com sucesso!'}
            {success === 'duplicated' && 'Produto duplicado com sucesso!'}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informações Principais */}
        <div className="lg:col-span-2 space-y-6">
          {/* Detalhes do Produto */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                Informações do Produto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Part Number</label>
                  <p className="text-lg font-semibold text-gray-900">{product.partNumber}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <div className="mt-1">
                    {product.isActive ? (
                      <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-800">Inativo</Badge>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Descrição</label>
                <p className="text-gray-900 mt-1">{product.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Preço de Custo</label>
                  <p className="text-lg font-semibold text-gray-900">{product.formattedCostPrice}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Preço de Venda</label>
                  <p className="text-lg font-semibold text-gray-900">{product.formattedSalePrice}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Margem de Lucro</label>
                  <div className="mt-1">
                    <Badge className={getMarginStatusClass(product.marginStatus)}>
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {formatPercentage(product.profitMargin)}
                    </Badge>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Lucro por Unidade</label>
                <p className={`text-lg font-semibold ${
                  product.profitAmount > 0 ? 'text-green-600' : 
                  product.profitAmount < 0 ? 'text-red-600' : 'text-gray-500'
                }`}>
                  {formatCurrency(product.profitAmount)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Histórico de Uso */}
          {product.orderItems && product.orderItems.length > 0 && (
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  Histórico de Uso
                  <Badge variant="outline">{product.orderItems.length} usos</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {product.orderItems.slice(0, 5).map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{item.order.titulo}</p>
                        <p className="text-sm text-gray-600">
                          Cliente: {item.order.cliente?.nome || 'N/A'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">Qtd: {item.quantity}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(item.order.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {product.orderItems.length > 5 && (
                    <p className="text-sm text-gray-500 text-center">
                      E mais {product.orderItems.length - 5} usos...
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Aviso se não pode ser excluído */}
          {!canDelete && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Este produto não pode ser excluído pois está sendo usado em ordens de serviço.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Imagem do Produto */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">Imagem</CardTitle>
            </CardHeader>
            <CardContent>
              {product.imageUrl ? (
                <div className="relative w-full h-48 rounded-lg overflow-hidden bg-gray-100">
                  <Image
                    src={product.imageUrl}
                    alt={product.description}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
              ) : (
                <div className="w-full h-48 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Package className="h-12 w-12 text-gray-400" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Informações de Sistema */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">Informações do Sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">Criado em</label>
                <p className="text-sm text-gray-900">
                  {new Date(product.createdAt).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Última atualização</label>
                <p className="text-sm text-gray-900">
                  {new Date(product.updatedAt).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>

              {product.creator && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Criado por</label>
                  <div className="flex items-center gap-2 mt-1">
                    <User className="h-4 w-4 text-gray-400" />
                    <p className="text-sm text-gray-900">
                      {product.creator.name || product.creator.email}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Estatísticas Rápidas */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">Estatísticas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Vezes utilizado</span>
                <span className="font-semibold text-blue-600">
                  {product.orderItems?.length || 0}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Receita gerada</span>
                <span className="font-semibold text-green-600">
                  {formatCurrency(
                    (product.orderItems || []).reduce((total: number, item: any) => 
                      total + item.totalPrice, 0
                    )
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status da margem</span>
                <Badge className={getMarginStatusClass(product.marginStatus)}>
                  {product.marginStatus === 'positive' ? 'Positiva' :
                   product.marginStatus === 'negative' ? 'Negativa' : 'Neutra'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}