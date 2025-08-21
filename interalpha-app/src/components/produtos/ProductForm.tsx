import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Package, Save, X } from 'lucide-react'
import { createProduct, updateProduct } from '@/app/actions/produtos'
import { Product } from '@/types/product'
import PriceCalculator from './PriceCalculator'
import ImageUpload from './ImageUpload'
import Link from 'next/link'

interface ProductFormProps {
  product?: Product
  mode: 'create' | 'edit'
  error?: string
  success?: string
}

export default function ProductForm({ 
  product, 
  mode, 
  error, 
  success 
}: ProductFormProps) {
  const isEditing = mode === 'edit' && product
  const title = isEditing ? 'Editar Produto' : 'Novo Produto'
  const submitText = isEditing ? 'Atualizar Produto' : 'Cadastrar Produto'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            {title}
          </h1>
          <p className="text-gray-600 mt-2">
            {isEditing 
              ? 'Atualize as informações do produto'
              : 'Preencha as informações para cadastrar um novo produto'
            }
          </p>
        </div>
        <Link href="/produtos">
          <Button variant="outline">
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
        </Link>
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
          <AlertCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {success === 'created' && 'Produto cadastrado com sucesso!'}
            {success === 'updated' && 'Produto atualizado com sucesso!'}
            {success === 'duplicated' && 'Produto duplicado com sucesso!'}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário Principal */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                Informações do Produto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form action={isEditing ? updateProduct.bind(null, product.id) : createProduct}>
                <div className="space-y-4">
                  {/* Part Number */}
                  <div className="space-y-2">
                    <Label htmlFor="partNumber">
                      Part Number <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="partNumber"
                      name="partNumber"
                      type="text"
                      required
                      placeholder="Ex: PROD-001, ABC123"
                      defaultValue={product?.partNumber || ''}
                      className="uppercase"
                      maxLength={50}
                    />
                    <p className="text-xs text-gray-500">
                      Código único do produto. Use apenas letras, números e hífens.
                    </p>
                  </div>

                  {/* Descrição */}
                  <div className="space-y-2">
                    <Label htmlFor="description">
                      Descrição <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="description"
                      name="description"
                      required
                      placeholder="Descreva o produto de forma clara e detalhada"
                      defaultValue={product?.description || ''}
                      maxLength={500}
                      rows={3}
                    />
                    <p className="text-xs text-gray-500">
                      Máximo 500 caracteres. Seja claro e objetivo.
                    </p>
                  </div>

                  {/* Preços */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="costPrice">
                        Preço de Custo <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                          R$
                        </span>
                        <Input
                          id="costPrice"
                          name="costPrice"
                          type="number"
                          step="0.01"
                          min="0"
                          required
                          placeholder="0,00"
                          defaultValue={product?.costPrice || ''}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="salePrice">
                        Preço de Venda <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                          R$
                        </span>
                        <Input
                          id="salePrice"
                          name="salePrice"
                          type="number"
                          step="0.01"
                          min="0"
                          required
                          placeholder="0,00"
                          defaultValue={product?.salePrice || ''}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Botões de Ação */}
                  <div className="flex items-center gap-4 pt-6 border-t">
                    <Button type="submit" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                      <Save className="h-4 w-4 mr-2" />
                      {submitText}
                    </Button>
                    
                    <Link href="/produtos">
                      <Button type="button" variant="outline">
                        Cancelar
                      </Button>
                    </Link>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar com Calculadora e Upload */}
        <div className="space-y-6">
          {/* Calculadora de Preços */}
          <PriceCalculator
            initialCostPrice={product?.costPrice || 0}
            initialSalePrice={product?.salePrice || 0}
            showCard={true}
          />

          {/* Upload de Imagem */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">Imagem do Produto</CardTitle>
            </CardHeader>
            <CardContent>
              <ImageUpload
                initialImageUrl={product?.imageUrl || undefined}
                productId={product?.id}
                showPreview={true}
                generateThumbnail={true}
              />
            </CardContent>
          </Card>

          {/* Informações Adicionais */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">Dicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-gray-600">
                <h4 className="font-medium text-gray-900 mb-2">Part Number:</h4>
                <ul className="space-y-1 text-xs">
                  <li>• Use códigos únicos e padronizados</li>
                  <li>• Evite caracteres especiais</li>
                  <li>• Exemplo: PROD-001, ABC123</li>
                </ul>
              </div>

              <div className="text-sm text-gray-600">
                <h4 className="font-medium text-gray-900 mb-2">Preços:</h4>
                <ul className="space-y-1 text-xs">
                  <li>• Margem recomendada: 20-50%</li>
                  <li>• Considere custos adicionais</li>
                  <li>• Use a calculadora ao lado</li>
                </ul>
              </div>

              <div className="text-sm text-gray-600">
                <h4 className="font-medium text-gray-900 mb-2">Imagem:</h4>
                <ul className="space-y-1 text-xs">
                  <li>• Formatos: JPG, PNG, WebP</li>
                  <li>• Tamanho máximo: 5MB</li>
                  <li>• Resolução recomendada: 800x600</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}