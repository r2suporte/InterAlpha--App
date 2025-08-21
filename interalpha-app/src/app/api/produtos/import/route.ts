import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ProductService } from '@/lib/services/product-service'
import { productSchema } from '@/lib/validations/product'
import { z } from 'zod'

/**
 * POST /api/produtos/import - Importar produtos em lote via CSV/JSON
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

    const contentType = request.headers.get('content-type') || ''
    
    let importData: any[] = []
    let format = 'json'
    
    if (contentType.includes('multipart/form-data')) {
      // Upload de arquivo CSV
      const formData = await request.formData()
      const file = formData.get('file') as File
      const skipDuplicates = formData.get('skipDuplicates') === 'true'
      const updateExisting = formData.get('updateExisting') === 'true'
      
      if (!file) {
        return NextResponse.json(
          { success: false, error: 'Arquivo é obrigatório' },
          { status: 400 }
        )
      }
      
      if (!file.name.endsWith('.csv')) {
        return NextResponse.json(
          { success: false, error: 'Apenas arquivos CSV são suportados' },
          { status: 400 }
        )
      }
      
      const csvText = await file.text()
      importData = parseCSV(csvText)
      format = 'csv'
      
    } else {
      // JSON direto no body
      const body = await request.json()
      const { products = [], options = {} } = body
      importData = products
      format = 'json'
    }
    
    if (!Array.isArray(importData) || importData.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Nenhum produto válido encontrado para importar' },
        { status: 400 }
      )
    }
    
    // Validar e processar produtos
    const importResult = await processProductImport(importData, userId, {
      skipDuplicates: true,
      updateExisting: false,
      validateOnly: false
    })
    
    // Registrar importação para auditoria
    await logImportAction(userId, {
      format,
      totalRecords: importData.length,
      successCount: importResult.success.length,
      errorCount: importResult.errors.length,
      duplicateCount: importResult.duplicates.length
    })
    
    return NextResponse.json({
      success: true,
      data: {
        summary: {
          total: importData.length,
          imported: importResult.success.length,
          errors: importResult.errors.length,
          duplicates: importResult.duplicates.length,
          skipped: importResult.skipped.length
        },
        results: {
          success: importResult.success,
          errors: importResult.errors,
          duplicates: importResult.duplicates,
          skipped: importResult.skipped
        }
      },
      message: `Importação concluída: ${importResult.success.length} produtos importados com sucesso`
    })

  } catch (error) {
    console.error('Erro na importação de produtos:', error)
    
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
 * GET /api/produtos/import/template - Baixar template CSV para importação
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'csv'
    const withExamples = searchParams.get('examples') === 'true'
    
    if (format === 'csv') {
      const csvTemplate = generateCSVTemplate(withExamples)
      
      return new NextResponse(csvTemplate, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="template_importacao_produtos.csv"',
          'Cache-Control': 'no-cache'
        }
      })
    }
    
    if (format === 'json') {
      const jsonTemplate = generateJSONTemplate(withExamples)
      
      return NextResponse.json({
        success: true,
        template: jsonTemplate,
        instructions: {
          requiredFields: ['partNumber', 'description', 'costPrice', 'salePrice'],
          optionalFields: ['imageUrl', 'isActive'],
          notes: [
            'Part Number deve ser único',
            'Preços devem ser números positivos',
            'isActive padrão é true se não informado'
          ]
        }
      })
    }
    
    return NextResponse.json(
      { success: false, error: 'Formato não suportado. Use: csv, json' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Erro ao gerar template:', error)
    
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
 * Processa importação de produtos
 */
async function processProductImport(
  products: any[], 
  userId: string, 
  options: {
    skipDuplicates: boolean
    updateExisting: boolean
    validateOnly: boolean
  }
) {
  const results = {
    success: [] as any[],
    errors: [] as any[],
    duplicates: [] as any[],
    skipped: [] as any[]
  }
  
  for (let i = 0; i < products.length; i++) {
    const productData = products[i]
    const rowNumber = i + 1
    
    try {
      // Validar dados do produto
      const validatedProduct = validateProductData(productData, rowNumber)
      
      if (options.validateOnly) {
        results.success.push({
          row: rowNumber,
          partNumber: validatedProduct.partNumber,
          status: 'valid'
        })
        continue
      }
      
      // Verificar se produto já existe
      const existingProduct = await ProductService.getProductByPartNumber(
        validatedProduct.partNumber
      )
      
      if (existingProduct) {
        if (options.updateExisting) {
          // Atualizar produto existente
          const updatedProduct = await ProductService.updateProduct(
            existingProduct.id,
            {
              ...validatedProduct,
              updatedBy: userId
            }
          )
          
          results.success.push({
            row: rowNumber,
            id: updatedProduct.id,
            partNumber: validatedProduct.partNumber,
            action: 'updated'
          })
        } else if (options.skipDuplicates) {
          results.duplicates.push({
            row: rowNumber,
            partNumber: validatedProduct.partNumber,
            reason: 'Part number já existe'
          })
        } else {
          results.errors.push({
            row: rowNumber,
            partNumber: validatedProduct.partNumber,
            error: 'Part number já existe'
          })
        }
      } else {
        // Criar novo produto
        const newProduct = await ProductService.createProduct({
          ...validatedProduct,
          createdBy: userId
        })
        
        results.success.push({
          row: rowNumber,
          id: newProduct.id,
          partNumber: validatedProduct.partNumber,
          action: 'created'
        })
      }
      
    } catch (error) {
      results.errors.push({
        row: rowNumber,
        partNumber: productData.partNumber || 'N/A',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      })
    }
  }
  
  return results
}

/**
 * Valida dados do produto para importação
 */
function validateProductData(data: any, rowNumber: number) {
  // Schema específico para importação
  const importSchema = z.object({
    partNumber: z.string().min(1, 'Part Number é obrigatório').toUpperCase(),
    description: z.string().min(1, 'Descrição é obrigatória').max(500),
    costPrice: z.coerce.number().min(0, 'Preço de custo deve ser positivo'),
    salePrice: z.coerce.number().min(0, 'Preço de venda deve ser positivo'),
    imageUrl: z.string().url().optional().or(z.literal('')),
    isActive: z.coerce.boolean().default(true)
  })
  
  try {
    return importSchema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      throw new Error(`Linha ${rowNumber}: ${errorMessages.join(', ')}`)
    }
    throw error
  }
}

/**
 * Parse CSV para array de objetos
 */
function parseCSV(csvText: string): any[] {
  const lines = csvText.trim().split('\n')
  if (lines.length < 2) {
    throw new Error('CSV deve ter pelo menos cabeçalho e uma linha de dados')
  }
  
  // Parse header
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
  
  // Mapear headers para campos esperados
  const fieldMapping: Record<string, string> = {
    'part number': 'partNumber',
    'partnumber': 'partNumber',
    'codigo': 'partNumber',
    'código': 'partNumber',
    'descricao': 'description',
    'descrição': 'description',
    'description': 'description',
    'preco custo': 'costPrice',
    'preço custo': 'costPrice',
    'custo': 'costPrice',
    'cost price': 'costPrice',
    'preco venda': 'salePrice',
    'preço venda': 'salePrice',
    'venda': 'salePrice',
    'sale price': 'salePrice',
    'imagem': 'imageUrl',
    'image': 'imageUrl',
    'ativo': 'isActive',
    'active': 'isActive'
  }
  
  const normalizedHeaders = headers.map(h => {
    const normalized = h.toLowerCase().trim()
    return fieldMapping[normalized] || normalized
  })
  
  // Parse data rows
  const products = []
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
    
    if (values.length !== headers.length) {
      console.warn(`Linha ${i + 1}: número de colunas não confere`)
      continue
    }
    
    const product: any = {}
    normalizedHeaders.forEach((header, index) => {
      if (values[index]) {
        product[header] = values[index]
      }
    })
    
    if (product.partNumber || product.description) {
      products.push(product)
    }
  }
  
  return products
}

/**
 * Gera template CSV
 */
function generateCSVTemplate(withExamples: boolean): string {
  const headers = [
    'Part Number',
    'Descrição',
    'Preço de Custo',
    'Preço de Venda',
    'Imagem URL',
    'Ativo'
  ]
  
  let csv = headers.join(',') + '\n'
  
  if (withExamples) {
    const examples = [
      ['PROD-001', 'Produto de exemplo 1', '50.00', '75.00', '', 'true'],
      ['PROD-002', 'Produto de exemplo 2', '100.00', '150.00', 'https://exemplo.com/imagem.jpg', 'true'],
      ['PROD-003', 'Produto inativo', '25.00', '40.00', '', 'false']
    ]
    
    examples.forEach(row => {
      csv += row.map(cell => `"${cell}"`).join(',') + '\n'
    })
  }
  
  return csv
}

/**
 * Gera template JSON
 */
function generateJSONTemplate(withExamples: boolean) {
  const template = {
    products: withExamples ? [
      {
        partNumber: 'PROD-001',
        description: 'Produto de exemplo 1',
        costPrice: 50.00,
        salePrice: 75.00,
        imageUrl: '',
        isActive: true
      },
      {
        partNumber: 'PROD-002',
        description: 'Produto de exemplo 2',
        costPrice: 100.00,
        salePrice: 150.00,
        imageUrl: 'https://exemplo.com/imagem.jpg',
        isActive: true
      }
    ] : [],
    options: {
      skipDuplicates: true,
      updateExisting: false,
      validateOnly: false
    }
  }
  
  return template
}

/**
 * Registra ação de importação para auditoria
 */
async function logImportAction(userId: string, summary: any) {
  try {
    console.log('Import Action:', {
      userId,
      action: 'products_imported',
      summary,
      timestamp: new Date().toISOString()
    })
    
    // TODO: Integrar com sistema de auditoria
    // await prisma.auditEntry.create({
    //   data: {
    //     userId,
    //     action: 'products_imported',
    //     resource: 'products',
    //     metadata: summary,
    //     timestamp: new Date()
    //   }
    // })
  } catch (error) {
    console.error('Erro ao registrar importação:', error)
  }
}