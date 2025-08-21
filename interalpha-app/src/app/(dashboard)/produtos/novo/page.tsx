import { Suspense } from 'react'
import ProductForm from '@/components/produtos/ProductForm'
import { Loader2 } from 'lucide-react'

interface PageProps {
  searchParams: {
    error?: string
    success?: string
  }
}

export default function NovoProdutoPage({ searchParams }: PageProps) {
  return (
    <Suspense fallback={<LoadingForm />}>
      <ProductForm 
        mode="create"
        error={searchParams.error}
        success={searchParams.success}
      />
    </Suspense>
  )
}

function LoadingForm() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-gray-600">Carregando formulário...</p>
      </div>
    </div>
  )
}