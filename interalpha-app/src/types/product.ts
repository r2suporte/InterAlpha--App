// Tipos TypeScript para o módulo de produtos

export interface Product {
  id: string
  partNumber: string
  description: string
  costPrice: number
  salePrice: number
  imageUrl?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  createdBy: string
}

export interface ProductFormData {
  partNumber: string
  description: string
  costPrice: number
  salePrice: number
  image?: File
}

export interface ProductFilters {
  search?: string
  isActive?: boolean
  sortBy?: 'partNumber' | 'description' | 'costPrice' | 'salePrice' | 'profitMargin' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export interface ProductStats {
  totalProducts: number
  activeProducts: number
  averageMargin: number
  totalValue: number
  topProducts: Array<{
    id: string
    partNumber: string
    description: string
    timesUsed: number
  }>
}

export interface ProductWithCalculations extends Product {
  profitMargin: number        // (salePrice - costPrice) / costPrice * 100
  profitAmount: number        // salePrice - costPrice
  marginStatus: 'positive' | 'negative' | 'zero'
  formattedCostPrice: string  // Formatação monetária
  formattedSalePrice: string  // Formatação monetária
}

export interface OrderItem {
  id: string
  orderId: string
  productId: string
  quantity: number
  unitPrice: number
  totalPrice: number
  product?: Product
}

// Tipos para API responses
export interface ProductApiResponse {
  success: boolean
  data: Product[]
  pagination?: {
    page: number
    limit: number
    total: number
    pages: number
  }
  error?: string
}

export interface ProductStatsApiResponse {
  success: boolean
  data: ProductStats
  error?: string
}

export interface ImageUploadResponse {
  success: boolean
  imageUrl?: string
  error?: string
}

// Enums e constantes
export enum ProductStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}

export enum MarginStatus {
  POSITIVE = 'positive',
  NEGATIVE = 'negative',
  ZERO = 'zero'
}

export const PRODUCT_SORT_OPTIONS = [
  { value: 'partNumber', label: 'Part Number' },
  { value: 'description', label: 'Descrição' },
  { value: 'costPrice', label: 'Preço de Custo' },
  { value: 'salePrice', label: 'Preço de Venda' },
  { value: 'profitMargin', label: 'Margem de Lucro' },
  { value: 'createdAt', label: 'Data de Criação' }
] as const

export const PRODUCT_LIMITS = {
  PART_NUMBER_MAX_LENGTH: 50,
  DESCRIPTION_MAX_LENGTH: 500,
  MAX_PRICE: 999999.99,
  IMAGE_MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ITEMS_PER_PAGE: 20
} as const

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png', 
  'image/webp'
] as const