import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { ProductService } from '@/lib/services/product-service'
import ProductForm from '@/components/produtos/ProductForm'
import { Loader2 } from 'lucide-react'

interface PageProps {
  params: {
    id: string
  }
  searchParams: {
    error?: string
    success?: string
  }
}

export default async function EditarProdutoPage({ params, searchParams }: PageProps) {
  return (
    <Suspense fallback={<LoadingForm />}>
      <EditProductContent 
        productId={params.id}
        error={searchParams.error}
        success={searchParams.success}
      />
    </Suspense>
  )
}

async function EditProductContent({ 
  productId, 
  error, 
  success 
}: { 
  productId: string
  error?: string
  success?: string
}) {
  try {
    const product = await ProductService.getProductById(productId)
    
    if (!product) {
      notFound()
    }

    return (
      <ProductForm 
        product={product}
        mode="edit"
        error={error}
        success={success}
      />
    )
  } catch (error) {
    console.error('Erro ao carregar produto para edição:', error)
    notFound()
  }
}

function LoadingForm() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-gray-600">Carregando formulário de edição...</p>
      </div>
    </div>
  )
}