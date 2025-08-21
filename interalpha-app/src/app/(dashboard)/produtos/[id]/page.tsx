import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { ProductService } from '@/lib/services/product-service'
import { addCalculationsToProduct } from '@/lib/utils/product-utils'
import ProductDetails from '@/components/produtos/ProductDetails'
import { Loader2 } from 'lucide-react'

interface PageProps {
  params: {
    id: string
  }
  searchParams: {
    success?: string
    error?: string
  }
}

export default async function ProdutoDetalhesPage({ params, searchParams }: PageProps) {
  return (
    <Suspense fallback={<LoadingDetails />}>
      <ProductDetailsContent 
        productId={params.id}
        success={searchParams.success}
        error={searchParams.error}
      />
    </Suspense>
  )
}

async function ProductDetailsContent({ 
  productId, 
  success, 
  error 
}: { 
  productId: string
  success?: string
  error?: string
}) {
  try {
    const product = await ProductService.getProductById(productId)
    
    if (!product) {
      notFound()
    }

    const productWithCalculations = addCalculationsToProduct(product)

    return (
      <ProductDetails 
        product={productWithCalculations}
        success={success}
        error={error}
      />
    )
  } catch (error) {
    console.error('Erro ao carregar produto:', error)
    notFound()
  }
}

function LoadingDetails() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-gray-600">Carregando detalhes do produto...</p>
      </div>
    </div>
  )
}