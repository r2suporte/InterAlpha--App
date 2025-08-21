import { Product, ProductWithCalculations, MarginStatus } from '@/types/product'
import { MARGIN_STATUS, MARGIN_COLORS } from '@/lib/constants/products'

/**
 * Calcula a margem de lucro de um produto
 */
export function calculateProfitMargin(costPrice: number, salePrice: number): number {
  if (costPrice <= 0) return 0
  return ((salePrice - costPrice) / costPrice) * 100
}

/**
 * Calcula o valor absoluto do lucro
 */
export function calculateProfitAmount(costPrice: number, salePrice: number): number {
  return salePrice - costPrice
}

/**
 * Determina o status da margem de lucro
 */
export function getMarginStatus(margin: number): MarginStatus {
  if (margin > 0) return MARGIN_STATUS.POSITIVE
  if (margin < 0) return MARGIN_STATUS.NEGATIVE
  return MARGIN_STATUS.ZERO
}

/**
 * Formata um valor monetário para exibição
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}

/**
 * Formata uma porcentagem para exibição
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`
}

/**
 * Adiciona cálculos a um produto
 */
export function addCalculationsToProduct(product: Product): ProductWithCalculations {
  const profitMargin = calculateProfitMargin(product.costPrice, product.salePrice)
  const profitAmount = calculateProfitAmount(product.costPrice, product.salePrice)
  const marginStatus = getMarginStatus(profitMargin)

  return {
    ...product,
    profitMargin,
    profitAmount,
    marginStatus,
    formattedCostPrice: formatCurrency(product.costPrice),
    formattedSalePrice: formatCurrency(product.salePrice)
  }
}

/**
 * Adiciona cálculos a uma lista de produtos
 */
export function addCalculationsToProducts(products: Product[]): ProductWithCalculations[] {
  return products.map(addCalculationsToProduct)
}

/**
 * Obtém a classe CSS para o status da margem
 */
export function getMarginStatusClass(marginStatus: MarginStatus): string {
  return MARGIN_COLORS[marginStatus] || MARGIN_COLORS[MARGIN_STATUS.ZERO]
}

/**
 * Gera um part number sugerido baseado na descrição
 */
export function generatePartNumberSuggestion(description: string): string {
  return description
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, '') // Remove caracteres especiais
    .split(' ')
    .filter(word => word.length > 0)
    .slice(0, 3) // Pega as 3 primeiras palavras
    .map(word => word.substring(0, 4)) // Pega os 4 primeiros caracteres de cada palavra
    .join('-')
}

/**
 * Valida se um part number tem formato válido
 */
export function isValidPartNumberFormat(partNumber: string): boolean {
  return /^[A-Za-z0-9-]+$/.test(partNumber)
}

/**
 * Normaliza um part number (maiúsculo, sem espaços)
 */
export function normalizePartNumber(partNumber: string): string {
  return partNumber.toUpperCase().trim().replace(/\s+/g, '-')
}

/**
 * Extrai palavras-chave da descrição para busca
 */
export function extractSearchKeywords(description: string): string[] {
  return description
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Remove pontuação
    .split(/\s+/)
    .filter(word => word.length > 2) // Palavras com mais de 2 caracteres
    .slice(0, 10) // Máximo 10 palavras-chave
}

/**
 * Calcula estatísticas de uma lista de produtos
 */
export function calculateProductStatistics(products: ProductWithCalculations[]) {
  if (products.length === 0) {
    return {
      totalProducts: 0,
      activeProducts: 0,
      averageMargin: 0,
      totalValue: 0,
      averageCostPrice: 0,
      averageSalePrice: 0,
      positiveMarginCount: 0,
      negativeMarginCount: 0,
      zeroMarginCount: 0
    }
  }

  const activeProducts = products.filter(p => p.isActive)
  const totalValue = products.reduce((sum, p) => sum + p.salePrice, 0)
  const totalCostValue = products.reduce((sum, p) => sum + p.costPrice, 0)
  const averageMargin = products.reduce((sum, p) => sum + p.profitMargin, 0) / products.length

  const marginCounts = products.reduce(
    (counts, p) => {
      counts[p.marginStatus]++
      return counts
    },
    { positive: 0, negative: 0, zero: 0 }
  )

  return {
    totalProducts: products.length,
    activeProducts: activeProducts.length,
    averageMargin,
    totalValue,
    averageCostPrice: totalCostValue / products.length,
    averageSalePrice: totalValue / products.length,
    positiveMarginCount: marginCounts.positive,
    negativeMarginCount: marginCounts.negative,
    zeroMarginCount: marginCounts.zero
  }
}

/**
 * Filtra produtos baseado em critérios de busca
 */
export function filterProducts(
  products: Product[],
  searchTerm: string,
  isActive?: boolean
): Product[] {
  let filtered = products

  // Filtrar por status ativo/inativo
  if (isActive !== undefined) {
    filtered = filtered.filter(p => p.isActive === isActive)
  }

  // Filtrar por termo de busca
  if (searchTerm.trim()) {
    const term = searchTerm.toLowerCase().trim()
    filtered = filtered.filter(p =>
      p.partNumber.toLowerCase().includes(term) ||
      p.description.toLowerCase().includes(term)
    )
  }

  return filtered
}

/**
 * Ordena produtos baseado em critério e direção
 */
export function sortProducts(
  products: ProductWithCalculations[],
  sortBy: keyof ProductWithCalculations,
  sortOrder: 'asc' | 'desc' = 'asc'
): ProductWithCalculations[] {
  return [...products].sort((a, b) => {
    let aValue = a[sortBy]
    let bValue = b[sortBy]

    // Tratar datas
    if (aValue instanceof Date && bValue instanceof Date) {
      aValue = aValue.getTime()
      bValue = bValue.getTime()
    }

    // Tratar strings
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      aValue = aValue.toLowerCase()
      bValue = bValue.toLowerCase()
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
    return 0
  })
}

/**
 * Pagina uma lista de produtos
 */
export function paginateProducts<T>(
  products: T[],
  page: number = 1,
  limit: number = 20
): {
  items: T[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
    hasNext: boolean
    hasPrev: boolean
  }
} {
  const total = products.length
  const pages = Math.ceil(total / limit)
  const startIndex = (page - 1) * limit
  const endIndex = startIndex + limit
  const items = products.slice(startIndex, endIndex)

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      pages,
      hasNext: page < pages,
      hasPrev: page > 1
    }
  }
}

/**
 * Debounce function para busca em tempo real
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout

  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Valida se um produto pode ser excluído
 */
export function canDeleteProduct(product: Product, orderItems: any[] = []): {
  canDelete: boolean
  reason?: string
} {
  // Verificar se produto está sendo usado em ordens de serviço
  const isUsedInOrders = orderItems.some(item => item.productId === product.id)
  
  if (isUsedInOrders) {
    return {
      canDelete: false,
      reason: 'Produto está sendo usado em ordens de serviço e não pode ser excluído'
    }
  }

  return { canDelete: true }
}

/**
 * Gera um resumo textual de um produto
 */
export function generateProductSummary(product: ProductWithCalculations): string {
  const margin = formatPercentage(product.profitMargin)
  const profit = formatCurrency(product.profitAmount)
  
  return `${product.partNumber} - ${product.description} | Custo: ${product.formattedCostPrice} | Venda: ${product.formattedSalePrice} | Margem: ${margin} (${profit})`
}