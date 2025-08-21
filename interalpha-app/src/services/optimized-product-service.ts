/**
 * Serviço otimizado de produtos com cache e performance
 */

import { prisma } from '@/lib/prisma'
import { cacheService } from './cache-service'
import { CacheKeys, CacheTTL } from '@/lib/redis'

export interface OptimizedProductFilters {
  search?: string
  categoryId?: string
  isActive?: boolean
  lowStock?: boolean
  outOfStock?: boolean
  priceRange?: { min: number; max: number }
  page?: number
  limit?: number
  sortBy?: 'partNumber' | 'description' | 'salePrice' | 'quantity' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
}

export interface ProductListResult {
  products: any[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  stats: {
    totalValue: number
    averagePrice: number
    lowStockCount: number
  }
}

export class OptimizedProductService {
  /**
   * Listar produtos com cache e otimizações
   */
  async findMany(filters: OptimizedProductFilters = {}): Promise<ProductListResult> {
    const {
      search,
      categoryId,
      isActive = true,
      lowStock,
      outOfStock,
      priceRange,
      page = 1,
      limit = 20,
      sortBy = 'partNumber',
      sortOrder = 'asc'
    } = filters

    // Gerar chave de cache baseada nos filtros
    const filterHash = this.generateFilterHash(filters)
    const cacheKey = CacheKeys.PRODUCT_LIST(filterHash)

    // Tentar obter do cache
    const cached = await cacheService.get<ProductListResult>(
      cacheKey,
      async () => {
        return await this.loadProductsFromDatabase(filters)
      },
      {
        ttl: CacheTTL.MEDIUM,
        tags: ['products', 'product-list']
      }
    )

    return cached || await this.loadProductsFromDatabase(filters)
  }

  /**
   * Busca otimizada de produtos
   */
  async search(query: string, limit = 10): Promise<any[]> {
    if (!query || query.length < 2) {
      return []
    }

    const cacheKey = CacheKeys.PRODUCT_SEARCH(query.toLowerCase())

    return await cacheService.get(
      cacheKey,
      async () => {
        // Usar full-text search otimizado
        const products = await prisma.$queryRaw`
          SELECT 
            id, 
            "partNumber", 
            description, 
            "salePrice", 
            quantity, 
            "imageUrl",
            "isActive",
            ts_rank(
              to_tsvector('portuguese', "partNumber" || ' ' || description), 
              plainto_tsquery('portuguese', ${query})
            ) as rank
          FROM products 
          WHERE 
            "isActive" = true
            AND (
              to_tsvector('portuguese', "partNumber" || ' ' || description) @@ plainto_tsquery('portuguese', ${query})
              OR "partNumber" ILIKE ${`%${query}%`}
              OR description ILIKE ${`%${query}%`}
            )
          ORDER BY rank DESC, "partNumber" ASC
          LIMIT ${limit}
        `

        return products
      },
      {
        ttl: CacheTTL.SHORT,
        tags: ['products', 'search']
      }
    )
  }

  /**
   * Obter produto por ID com cache
   */
  async findById(id: string): Promise<any | null> {
    const cacheKey = CacheKeys.PRODUCT_DETAIL(id)

    return await cacheService.get(
      cacheKey,
      async () => {
        const product = await prisma.product.findUnique({
          where: { id },
          include: {
            category: {
              select: {
                id: true,
                name: true,
                color: true,
                icon: true
              }
            },
            creator: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            orderItems: {
              select: {
                id: true,
                quantity: true,
                totalPrice: true,
                createdAt: true,
                order: {
                  select: {
                    id: true,
                    titulo: true,
                    status: true
                  }
                }
              },
              orderBy: { createdAt: 'desc' },
              take: 10
            },
            stockMovements: {
              select: {
                id: true,
                type: true,
                quantity: true,
                reason: true,
                createdAt: true,
                user: {
                  select: {
                    name: true
                  }
                }
              },
              orderBy: { createdAt: 'desc' },
              take: 10
            },
            _count: {
              select: {
                orderItems: true,
                stockMovements: true
              }
            }
          }
        })

        if (!product) return null

        // Calcular estatísticas
        const totalSold = product.orderItems.reduce((sum, item) => sum + item.quantity, 0)
        const totalRevenue = product.orderItems.reduce((sum, item) => sum + item.totalPrice, 0)
        const margin = ((product.salePrice - product.costPrice) / product.costPrice) * 100

        return {
          ...product,
          stats: {
            totalSold,
            totalRevenue,
            margin,
            averageOrderQuantity: totalSold > 0 ? totalSold / product._count.orderItems : 0
          }
        }
      },
      {
        ttl: CacheTTL.LONG,
        tags: ['products', `product-${id}`]
      }
    )
  }

  /**
   * Estatísticas de produtos com cache
   */
  async getStats(): Promise<any> {
    const cacheKey = CacheKeys.PRODUCT_STATS()

    return await cacheService.get(
      cacheKey,
      async () => {
        const [
          totalProducts,
          activeProducts,
          totalCategories,
          lowStockProducts,
          outOfStockProducts,
          products
        ] = await Promise.all([
          prisma.product.count(),
          prisma.product.count({ where: { isActive: true } }),
          prisma.productCategory.count({ where: { isActive: true } }),
          prisma.product.count({
            where: {
              isActive: true,
              quantity: { lte: prisma.product.fields.minStock }
            }
          }),
          prisma.product.count({
            where: {
              isActive: true,
              quantity: 0
            }
          }),
          prisma.product.findMany({
            where: { isActive: true },
            select: {
              quantity: true,
              costPrice: true,
              salePrice: true
            }
          })
        ])

        const totalStockValue = products.reduce(
          (sum, product) => sum + (product.quantity * product.costPrice),
          0
        )

        const averageMargin = products.length > 0
          ? products.reduce((sum, product) => {
              const margin = ((product.salePrice - product.costPrice) / product.costPrice) * 100
              return sum + margin
            }, 0) / products.length
          : 0

        return {
          totalProducts,
          activeProducts,
          totalCategories,
          lowStockProducts,
          outOfStockProducts,
          totalStockValue,
          averageMargin,
          averagePrice: products.length > 0 
            ? products.reduce((sum, p) => sum + p.salePrice, 0) / products.length 
            : 0
        }
      },
      {
        ttl: CacheTTL.LONG,
        tags: ['products', 'stats']
      }
    )
  }

  /**
   * Produtos relacionados/similares
   */
  async getRelatedProducts(productId: string, limit = 5): Promise<any[]> {
    const cacheKey = `product:${productId}:related`

    return await cacheService.get(
      cacheKey,
      async () => {
        const product = await prisma.product.findUnique({
          where: { id: productId },
          select: { categoryId: true, salePrice: true }
        })

        if (!product) return []

        // Buscar produtos da mesma categoria com preço similar
        const priceRange = product.salePrice * 0.3 // 30% de variação
        
        const related = await prisma.product.findMany({
          where: {
            id: { not: productId },
            isActive: true,
            categoryId: product.categoryId,
            salePrice: {
              gte: product.salePrice - priceRange,
              lte: product.salePrice + priceRange
            }
          },
          select: {
            id: true,
            partNumber: true,
            description: true,
            salePrice: true,
            imageUrl: true,
            quantity: true
          },
          orderBy: { createdAt: 'desc' },
          take: limit
        })

        return related
      },
      {
        ttl: CacheTTL.VERY_LONG,
        tags: ['products', `product-${productId}`]
      }
    )
  }

  /**
   * Autocomplete para busca
   */
  async autocomplete(query: string, limit = 8): Promise<string[]> {
    if (!query || query.length < 2) {
      return []
    }

    const cacheKey = `autocomplete:${query.toLowerCase()}`

    return await cacheService.get(
      cacheKey,
      async () => {
        const results = await prisma.$queryRaw<Array<{ suggestion: string }>>`
          SELECT DISTINCT 
            CASE 
              WHEN "partNumber" ILIKE ${`${query}%`} THEN "partNumber"
              ELSE split_part(description, ' ', 1)
            END as suggestion
          FROM products 
          WHERE 
            "isActive" = true
            AND (
              "partNumber" ILIKE ${`${query}%`}
              OR description ILIKE ${`${query}%`}
            )
          ORDER BY suggestion
          LIMIT ${limit}
        `

        return results.map(r => r.suggestion).filter(Boolean)
      },
      {
        ttl: CacheTTL.LONG,
        tags: ['products', 'autocomplete']
      }
    )
  }

  /**
   * Invalidar cache de produtos
   */
  async invalidateCache(productId?: string): Promise<void> {
    if (productId) {
      // Invalidar cache específico do produto
      await cacheService.invalidateByTags([`product-${productId}`])
    } else {
      // Invalidar todo cache de produtos
      await cacheService.invalidateByTags(['products'])
    }
  }

  /**
   * Pré-carregar produtos populares
   */
  async warmUpCache(): Promise<void> {
    try {
      // Carregar produtos mais acessados
      const popularProducts = await prisma.product.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: { id: true }
      })

      // Pré-carregar detalhes dos produtos populares
      const warmUpPromises = popularProducts.map(product => 
        this.findById(product.id)
      )

      await Promise.all(warmUpPromises)

      // Pré-carregar estatísticas
      await this.getStats()

      // Pré-carregar listagem padrão
      await this.findMany({ page: 1, limit: 20 })

      console.log('Cache warm-up completed for products')
    } catch (error) {
      console.error('Cache warm-up error:', error)
    }
  }

  /**
   * Carregar produtos do banco de dados
   */
  private async loadProductsFromDatabase(filters: OptimizedProductFilters): Promise<ProductListResult> {
    const {
      search,
      categoryId,
      isActive = true,
      lowStock,
      outOfStock,
      priceRange,
      page = 1,
      limit = 20,
      sortBy = 'partNumber',
      sortOrder = 'asc'
    } = filters

    // Construir filtros
    const where: any = { isActive }

    if (search) {
      where.OR = [
        { partNumber: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (categoryId) {
      where.categoryId = categoryId
    }

    if (lowStock) {
      where.quantity = { lte: prisma.product.fields.minStock }
    }

    if (outOfStock) {
      where.quantity = 0
    }

    if (priceRange) {
      where.salePrice = {
        gte: priceRange.min,
        lte: priceRange.max
      }
    }

    // Executar queries em paralelo
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              color: true
            }
          },
          _count: {
            select: {
              orderItems: true
            }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.product.count({ where })
    ])

    // Calcular estatísticas
    const totalValue = products.reduce(
      (sum, product) => sum + (product.quantity * product.costPrice),
      0
    )

    const averagePrice = products.length > 0
      ? products.reduce((sum, product) => sum + product.salePrice, 0) / products.length
      : 0

    const lowStockCount = products.filter(p => p.quantity <= p.minStock).length

    return {
      products: products.map(product => ({
        ...product,
        margin: ((product.salePrice - product.costPrice) / product.costPrice) * 100,
        stockStatus: product.quantity === 0 ? 'OUT_OF_STOCK' 
          : product.quantity <= product.minStock ? 'LOW_STOCK' 
          : 'IN_STOCK'
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      stats: {
        totalValue,
        averagePrice,
        lowStockCount
      }
    }
  }

  /**
   * Gerar hash dos filtros para cache
   */
  private generateFilterHash(filters: OptimizedProductFilters): string {
    const filterString = JSON.stringify(filters, Object.keys(filters).sort())
    return Buffer.from(filterString).toString('base64').slice(0, 32)
  }
}