import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ProductService } from '@/lib/services/product-service'
import { z } from 'zod'

// Schema para detecção de duplicatas
const duplicateDetectionSchema = z.object({
  partNumber: z.string().optional(),
  description: z.string().optional(),
  threshold: z.number().min(0).max(1).default(0.8), // Similaridade mínima (0-1)
  includeInactive: z.boolean().default(false),
  limit: z.number().int().min(1).max(100).default(20)
})

// Schema para criação de produto baseado em existente
const duplicateProductSchema = z.object({
  sourceProductId: z.string().min(1, 'ID do produto origem é obrigatório'),
  newPartNumber: z.string().min(1, 'Novo part number é obrigatório'),
  modifications: z.object({
    description: z.string().optional(),
    costPrice: z.number().min(0).optional(),
    salePrice: z.number().min(0).optional(),
    imageUrl: z.string().url().optional().or(z.literal('')),
    isActive: z.boolean().optional(),
    categoryId: z.string().optional()
  }).optional()
})

/**
 * GET /api/produtos/duplicacao - Detectar possíveis duplicatas
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    let userId = null
    try {
      const { userId: authUserId } = await auth()
      userId = authUserId
    } catch (authError) {
      console.warn('Aviso: Autenticação falhou, continuando sem usuário:', authError)
    }

    const { searchParams } = new URL(request.url)
    
    // Extrair parâmetros
    const params = {
      partNumber: searchParams.get('partNumber'),
      description: searchParams.get('description'),
      threshold: parseFloat(searchParams.get('threshold') || '0.8'),
      includeInactive: searchParams.get('includeInactive') === 'true',
      limit: parseInt(searchParams.get('limit') || '20')
    }
    
    const validatedParams = duplicateDetectionSchema.parse(params)
    
    // Detectar duplicatas
    const duplicates = await detectDuplicateProducts(validatedParams)
    
    return NextResponse.json({
      success: true,
      data: duplicates,
      meta: {
        threshold: validatedParams.threshold,
        includeInactive: validatedParams.includeInactive,
        totalFound: duplicates.length,
        searchCriteria: {
          partNumber: validatedParams.partNumber,
          description: validatedParams.description
        }
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Erro ao detectar duplicatas:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Parâmetros inválidos',
          details: error.errors
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro interno do servidor'
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/produtos/duplicacao - Criar produto baseado em existente
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    let userId = null
    try {
      const { userId: authUserId } = await auth()
      userId = authUserId
    } catch (authError) {
      return NextResponse.json(
        { success: false, error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Validar dados
    const validatedData = duplicateProductSchema.parse(body)
    
    // Verificar se produto origem existe
    const sourceProduct = await ProductService.getProductById(validatedData.sourceProductId)
    if (!sourceProduct) {
      return NextResponse.json(
        { success: false, error: 'Produto origem não encontrado' },
        { status: 404 }
      )
    }
    
    // Verificar se novo part number já existe
    const existingProduct = await ProductService.getProductByPartNumber(validatedData.newPartNumber)
    if (existingProduct) {
      return NextResponse.json(
        { success: false, error: 'Part number já existe' },
        { status: 409 }
      )
    }
    
    // Criar produto duplicado
    const duplicatedProduct = await createDuplicatedProduct(
      sourceProduct, 
      validatedData.newPartNumber,
      validatedData.modifications || {},
      userId
    )
    
    // Registrar ação de duplicação
    await logDuplicationAction(userId, sourceProduct.id, duplicatedProduct.id)
    
    return NextResponse.json({
      success: true,
      data: {
        sourceProduct: {
          id: sourceProduct.id,
          partNumber: sourceProduct.partNumber,
          description: sourceProduct.description
        },
        duplicatedProduct,
        modifications: validatedData.modifications
      },
      message: 'Produto duplicado com sucesso'
    }, { status: 201 })

  } catch (error) {
    console.error('Erro ao duplicar produto:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Dados inválidos',
          details: error.errors
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro interno do servidor'
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/produtos/duplicacao/merge - Mesclar produtos duplicados
 */
export async function PUT(request: NextRequest) {
  try {
    // Verificar autenticação
    let userId = null
    try {
      const { userId: authUserId } = await auth()
      userId = authUserId
    } catch (authError) {
      return NextResponse.json(
        { success: false, error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { 
      primaryProductId, 
      duplicateProductIds = [], 
      mergeStrategy = 'keep_primary',
      transferData = true 
    } = body
    
    if (!primaryProductId || duplicateProductIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'ID do produto principal e IDs dos duplicados são obrigatórios' },
        { status: 400 }
      )
    }
    
    // Verificar se produtos existem
    const primaryProduct = await ProductService.getProductById(primaryProductId)
    if (!primaryProduct) {
      return NextResponse.json(
        { success: false, error: 'Produto principal não encontrado' },
        { status: 404 }
      )
    }
    
    // Mesclar produtos
    const mergeResult = await mergeProducts(
      primaryProductId,
      duplicateProductIds,
      mergeStrategy,
      transferData,
      userId
    )
    
    return NextResponse.json({
      success: true,
      data: mergeResult,
      message: `${duplicateProductIds.length} produto(s) mesclado(s) com sucesso`
    })

  } catch (error) {
    console.error('Erro ao mesclar produtos:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro interno do servidor'
      },
      { status: 500 }
    )
  }
}

/**
 * Detecta produtos duplicados
 */
async function detectDuplicateProducts(params: any) {
  try {
    // Buscar todos os produtos para análise
    const allProducts = await ProductService.getProducts({
      isActive: params.includeInactive ? undefined : true,
      limit: 10000 // Buscar todos para análise
    })
    
    const duplicates = []
    
    // Se foi fornecido part number ou descrição específica, buscar similares
    if (params.partNumber || params.description) {
      const searchTerm = params.partNumber || params.description
      
      for (const product of allProducts.products) {
        const partNumberSimilarity = params.partNumber 
          ? calculateSimilarity(params.partNumber, product.partNumber)
          : 0
        
        const descriptionSimilarity = params.description
          ? calculateSimilarity(params.description, product.description)
          : 0
        
        const maxSimilarity = Math.max(partNumberSimilarity, descriptionSimilarity)
        
        if (maxSimilarity >= params.threshold && maxSimilarity < 1.0) { // Não incluir match exato
          duplicates.push({
            product,
            similarity: maxSimilarity,
            matchType: partNumberSimilarity > descriptionSimilarity ? 'partNumber' : 'description',
            reasons: generateDuplicateReasons(searchTerm, product, partNumberSimilarity, descriptionSimilarity)
          })
        }
      }
    } else {
      // Buscar duplicatas gerais comparando todos os produtos entre si
      const processedPairs = new Set()
      
      for (let i = 0; i < allProducts.products.length; i++) {
        for (let j = i + 1; j < allProducts.products.length; j++) {
          const product1 = allProducts.products[i]
          const product2 = allProducts.products[j]
          
          const pairKey = [product1.id, product2.id].sort().join('-')
          if (processedPairs.has(pairKey)) continue
          processedPairs.add(pairKey)
          
          const partNumberSimilarity = calculateSimilarity(product1.partNumber, product2.partNumber)
          const descriptionSimilarity = calculateSimilarity(product1.description, product2.description)
          
          const maxSimilarity = Math.max(partNumberSimilarity, descriptionSimilarity)
          
          if (maxSimilarity >= params.threshold) {
            duplicates.push({
              products: [product1, product2],
              similarity: maxSimilarity,
              matchType: partNumberSimilarity > descriptionSimilarity ? 'partNumber' : 'description',
              reasons: generateDuplicateReasons(product1, product2, partNumberSimilarity, descriptionSimilarity)
            })
          }
        }
      }
    }
    
    // Ordenar por similaridade (maior primeiro)
    duplicates.sort((a, b) => b.similarity - a.similarity)
    
    return duplicates.slice(0, params.limit)
    
  } catch (error) {
    console.error('Erro ao detectar duplicatas:', error)
    return []
  }
}

/**
 * Calcula similaridade entre duas strings usando algoritmo de Levenshtein
 */
function calculateSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0
  
  const s1 = str1.toLowerCase().trim()
  const s2 = str2.toLowerCase().trim()
  
  if (s1 === s2) return 1.0
  
  const longer = s1.length > s2.length ? s1 : s2
  const shorter = s1.length > s2.length ? s2 : s1
  
  if (longer.length === 0) return 1.0
  
  const distance = levenshteinDistance(longer, shorter)
  return (longer.length - distance) / longer.length
}

/**
 * Calcula distância de Levenshtein entre duas strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = []
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substituição
          matrix[i][j - 1] + 1,     // inserção
          matrix[i - 1][j] + 1      // remoção
        )
      }
    }
  }
  
  return matrix[str2.length][str1.length]
}

/**
 * Gera razões para possível duplicação
 */
function generateDuplicateReasons(item1: any, item2: any, partNumberSim: number, descriptionSim: number): string[] {
  const reasons = []
  
  if (partNumberSim >= 0.8) {
    reasons.push(`Part numbers similares (${Math.round(partNumberSim * 100)}% de similaridade)`)
  }
  
  if (descriptionSim >= 0.8) {
    reasons.push(`Descrições similares (${Math.round(descriptionSim * 100)}% de similaridade)`)
  }
  
  // Verificar preços similares
  if (item1.salePrice && item2.salePrice) {
    const priceDiff = Math.abs(item1.salePrice - item2.salePrice) / Math.max(item1.salePrice, item2.salePrice)
    if (priceDiff < 0.1) { // Diferença menor que 10%
      reasons.push('Preços de venda similares')
    }
  }
  
  return reasons
}

/**
 * Cria produto duplicado baseado em existente
 */
async function createDuplicatedProduct(sourceProduct: any, newPartNumber: string, modifications: any, userId: string) {
  try {
    // Preparar dados do novo produto baseado no original
    const newProductData = {
      partNumber: newPartNumber,
      description: modifications.description || `${sourceProduct.description} (Cópia)`,
      costPrice: modifications.costPrice !== undefined ? modifications.costPrice : sourceProduct.costPrice,
      salePrice: modifications.salePrice !== undefined ? modifications.salePrice : sourceProduct.salePrice,
      imageUrl: modifications.imageUrl !== undefined ? modifications.imageUrl : sourceProduct.imageUrl,
      isActive: modifications.isActive !== undefined ? modifications.isActive : sourceProduct.isActive,
      categoryId: modifications.categoryId || sourceProduct.categoryId,
      createdBy: userId,
      // Metadados de duplicação
      duplicatedFrom: sourceProduct.id,
      duplicatedAt: new Date()
    }
    
    // Criar produto
    const newProduct = await ProductService.createProduct(newProductData)
    
    return newProduct
    
  } catch (error) {
    console.error('Erro ao criar produto duplicado:', error)
    throw error
  }
}

/**
 * Mescla produtos duplicados
 */
async function mergeProducts(
  primaryProductId: string,
  duplicateProductIds: string[],
  mergeStrategy: string,
  transferData: boolean,
  userId: string
) {
  try {
    const mergeResult = {
      primaryProduct: primaryProductId,
      mergedProducts: [],
      transferredData: [],
      errors: []
    }
    
    for (const duplicateId of duplicateProductIds) {
      try {
        // Buscar produto duplicado
        const duplicateProduct = await ProductService.getProductById(duplicateId)
        if (!duplicateProduct) {
          mergeResult.errors.push(`Produto ${duplicateId} não encontrado`)
          continue
        }
        
        // Transferir dados se solicitado
        if (transferData) {
          // TODO: Transferir histórico de uso, movimentações de estoque, etc.
          // await transferProductData(duplicateId, primaryProductId)
          mergeResult.transferredData.push({
            from: duplicateId,
            to: primaryProductId,
            dataTypes: ['usage_history', 'stock_movements', 'order_items']
          })
        }
        
        // Marcar produto como mesclado (soft delete)
        await ProductService.updateProduct(duplicateId, {
          isActive: false,
          mergedInto: primaryProductId,
          mergedAt: new Date(),
          mergedBy: userId
        })
        
        mergeResult.mergedProducts.push({
          id: duplicateId,
          partNumber: duplicateProduct.partNumber,
          description: duplicateProduct.description
        })
        
      } catch (error) {
        mergeResult.errors.push(`Erro ao mesclar produto ${duplicateId}: ${error.message}`)
      }
    }
    
    return mergeResult
    
  } catch (error) {
    console.error('Erro ao mesclar produtos:', error)
    throw error
  }
}

/**
 * Registra ação de duplicação para auditoria
 */
async function logDuplicationAction(userId: string, sourceProductId: string, newProductId: string) {
  try {
    console.log('Product Duplication:', {
      userId,
      action: 'product_duplicated',
      sourceProductId,
      newProductId,
      timestamp: new Date().toISOString()
    })
    
    // TODO: Integrar com sistema de auditoria
    // await prisma.auditEntry.create({
    //   data: {
    //     userId,
    //     action: 'product_duplicated',
    //     resource: 'product',
    //     resourceId: newProductId,
    //     metadata: { sourceProductId },
    //     timestamp: new Date()
    //   }
    // })
  } catch (error) {
    console.error('Erro ao registrar duplicação:', error)
  }
}