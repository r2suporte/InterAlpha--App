import { PrismaClient } from '@prisma/client'
import { Product, ProductFormData, ProductFilters, ProductStats } from '@/types/product'
import { productSchema, productFiltersSchema } from '@/lib/validations/product'
import { calculateProfitMargin, addCalculationsToProducts } from '@/lib/utils/product-utils'
import { PAGINATION } from '@/lib/constants/products'

const prisma = new PrismaClient()

export class ProductService {
  /**
   * Cria um novo produto
   */
  static async createProduct(data: ProductFormData, userId: string): Promise<Product> {
    // Validar dados
    const validatedData = productSchema.parse(data)
    
    // Verificar se part number já existe
    const existingProduct = await prisma.product.findUnique({
      where: { partNumber: validatedData.partNumber }
    })
    
    if (existingProduct) {
      throw new Error('Part number já existe')
    }
    
    // Criar produto
    const product = await prisma.product.create({
      data: {
        ...validatedData,
        createdBy: userId
      },
      include: {
        creator: {
          select: { name: true, email: true }
        }
      }
    })
    
    return product
  }
  
  /**
   * Busca produtos com filtros e paginação
   */
  static async getProducts(filters: ProductFilters = {}) {
    const validatedFilters = productFiltersSchema.parse(filters)
    
    const {
      search,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT
    } = validatedFilters
    
    // Construir where clause
    const where: any = {}
    
    if (isActive !== undefined) {
      where.isActive = isActive
    }
    
    if (search) {
      where.OR = [
        {
          partNumber: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          description: {
            contains: search,
            mode: 'insensitive'
          }
        }
      ]
    }
    
    // Calcular offset
    const skip = (page - 1) * limit
    
    // Buscar produtos
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          creator: {
            select: { name: true, email: true }
          },
          _count: {
            select: { orderItems: true }
          }
        },
        orderBy: {
          [sortBy]: sortOrder
        },
        skip,
        take: limit
      }),
      prisma.product.count({ where })
    ])
    
    // Adicionar cálculos
    const productsWithCalculations = addCalculationsToProducts(products)
    
    return {
      products: productsWithCalculations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    }
  }
  
  /**
   * Busca um produto por ID
   */
  static async getProductById(id: string): Promise<Product | null> {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        creator: {
          select: { name: true, email: true }
        },
        orderItems: {
          include: {
            order: {
              select: {
                id: true,
                titulo: true,
                createdAt: true,
                cliente: {
                  select: { nome: true }
                }
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 10 // Últimas 10 utilizações
        }
      }
    })
    
    return product
  }
  
  /**
   * Busca um produto por part number
   */
  static async getProductByPartNumber(partNumber: string): Promise<Product | null> {
    const product = await prisma.product.findUnique({
      where: { partNumber: partNumber.toUpperCase() },
      include: {
        creator: {
          select: { name: true, email: true }
        }
      }
    })
    
    return product
  }
  
  /**
   * Atualiza um produto
   */
  static async updateProduct(id: string, data: Partial<ProductFormData>): Promise<Product> {
    // Verificar se produto existe
    const existingProduct = await prisma.product.findUnique({
      where: { id }
    })
    
    if (!existingProduct) {
      throw new Error('Produto não encontrado')
    }
    
    // Se está alterando part number, verificar unicidade
    if (data.partNumber && data.partNumber !== existingProduct.partNumber) {
      const duplicateProduct = await prisma.product.findUnique({
        where: { partNumber: data.partNumber.toUpperCase() }
      })
      
      if (duplicateProduct) {
        throw new Error('Part number já existe')
      }
    }
    
    // Validar dados
    const validatedData = productSchema.partial().parse(data)
    
    // Atualizar produto
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: validatedData,
      include: {
        creator: {
          select: { name: true, email: true }
        }
      }
    })
    
    return updatedProduct
  }
  
  /**
   * Exclui um produto
   */
  static async deleteProduct(id: string): Promise<void> {
    // Verificar se produto existe
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        orderItems: true
      }
    })
    
    if (!product) {
      throw new Error('Produto não encontrado')
    }
    
    // Verificar se produto está sendo usado
    if (product.orderItems.length > 0) {
      throw new Error('Produto não pode ser excluído pois está sendo usado em ordens de serviço')
    }
    
    // Excluir produto
    await prisma.product.delete({
      where: { id }
    })
  }
  
  /**
   * Obtém estatísticas de produtos
   */
  static async getProductStats(): Promise<ProductStats> {
    const [
      totalProducts,
      activeProducts,
      productsWithMargin,
      topProducts
    ] = await Promise.all([
      // Total de produtos
      prisma.product.count(),
      
      // Produtos ativos
      prisma.product.count({
        where: { isActive: true }
      }),
      
      // Produtos para cálculo de margem média
      prisma.product.findMany({
        select: {
          costPrice: true,
          salePrice: true
        }
      }),
      
      // Produtos mais utilizados
      prisma.product.findMany({
        include: {
          _count: {
            select: { orderItems: true }
          }
        },
        orderBy: {
          orderItems: {
            _count: 'desc'
          }
        },
        take: 5
      })
    ])
    
    // Calcular margem média
    const averageMargin = productsWithMargin.length > 0
      ? productsWithMargin.reduce((sum, product) => {
          return sum + calculateProfitMargin(product.costPrice, product.salePrice)
        }, 0) / productsWithMargin.length
      : 0
    
    // Calcular valor total do catálogo
    const totalValue = productsWithMargin.reduce((sum, product) => {
      return sum + product.salePrice
    }, 0)
    
    return {
      totalProducts,
      activeProducts,
      averageMargin,
      totalValue,
      topProducts: topProducts.map(product => ({
        id: product.id,
        partNumber: product.partNumber,
        description: product.description,
        timesUsed: product._count.orderItems
      }))
    }
  }
  
  /**
   * Verifica se um part number está disponível
   */
  static async isPartNumberAvailable(partNumber: string, excludeId?: string): Promise<boolean> {
    const where: any = {
      partNumber: partNumber.toUpperCase()
    }
    
    if (excludeId) {
      where.id = { not: excludeId }
    }
    
    const existingProduct = await prisma.product.findUnique({ where })
    return !existingProduct
  }
  
  /**
   * Busca produtos para seleção em ordens de serviço
   */
  static async searchProductsForOrder(search: string, limit: number = 10) {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          {
            partNumber: {
              contains: search,
              mode: 'insensitive'
            }
          },
          {
            description: {
              contains: search,
              mode: 'insensitive'
            }
          }
        ]
      },
      select: {
        id: true,
        partNumber: true,
        description: true,
        salePrice: true,
        imageUrl: true
      },
      orderBy: [
        {
          partNumber: 'asc'
        }
      ],
      take: limit
    })
    
    return products
  }
  
  /**
   * Obtém produtos com baixo estoque (se implementado)
   */
  static async getLowStockProducts() {
    // Esta funcionalidade será implementada quando o controle de estoque for adicionado
    return []
  }
  
  /**
   * Exporta produtos para CSV
   */
  static async exportProducts(filters: ProductFilters = {}) {
    const { products } = await this.getProducts({
      ...filters,
      limit: 10000 // Exportar todos
    })
    
    return products.map(product => ({
      'Part Number': product.partNumber,
      'Descrição': product.description,
      'Preço de Custo': product.costPrice,
      'Preço de Venda': product.salePrice,
      'Margem (%)': calculateProfitMargin(product.costPrice, product.salePrice).toFixed(2),
      'Status': product.isActive ? 'Ativo' : 'Inativo',
      'Criado em': product.createdAt.toLocaleDateString('pt-BR'),
      'Criado por': product.creator?.name || product.creator?.email || 'N/A'
    }))
  }
  
  /**
   * Valida dados de produto antes de salvar
   */
  static validateProductData(data: ProductFormData): {
    isValid: boolean
    errors: Record<string, string>
  } {
    try {
      productSchema.parse(data)
      return { isValid: true, errors: {} }
    } catch (error: any) {
      const errors: Record<string, string> = {}
      
      if (error.errors) {
        error.errors.forEach((err: any) => {
          errors[err.path[0]] = err.message
        })
      }
      
      return { isValid: false, errors }
    }
  }
}

export default ProductService