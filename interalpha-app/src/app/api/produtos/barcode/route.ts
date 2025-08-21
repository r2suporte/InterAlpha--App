import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ProductService } from '@/lib/services/product-service'

/**
 * GET /api/produtos/barcode?code=... - Buscar produto por código de barras
 * POST /api/produtos/barcode - Gerar código de barras para produto
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Código de barras é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar produto por part number (código de barras baseado no part number)
    const product = await ProductService.getProductByPartNumber(code)

    if (!product) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Produto não encontrado',
          code: 'PRODUCT_NOT_FOUND'
        },
        { status: 404 }
      )
    }

    // Verificar se produto está ativo
    if (!product.isActive) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Produto encontrado mas está inativo',
          code: 'PRODUCT_INACTIVE',
          data: {
            id: product.id,
            partNumber: product.partNumber,
            description: product.description,
            isActive: false
          }
        },
        { status: 200 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: product.id,
        partNumber: product.partNumber,
        description: product.description,
        salePrice: product.salePrice,
        costPrice: product.costPrice,
        imageUrl: product.imageUrl,
        isActive: product.isActive,
        barcode: generateBarcodeData(product.partNumber)
      },
      message: 'Produto encontrado'
    })

  } catch (error) {
    console.error('Erro na busca por código de barras:', error)
    
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
 * POST /api/produtos/barcode - Gerar código de barras para produto
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { productId, partNumber, format = 'CODE128' } = body

    if (!productId && !partNumber) {
      return NextResponse.json(
        { success: false, error: 'ID do produto ou part number é obrigatório' },
        { status: 400 }
      )
    }

    let product
    if (productId) {
      product = await ProductService.getProductById(productId)
    } else {
      product = await ProductService.getProductByPartNumber(partNumber)
    }

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Produto não encontrado' },
        { status: 404 }
      )
    }

    // Gerar dados do código de barras
    const barcodeData = generateBarcodeData(product.partNumber, format)

    return NextResponse.json({
      success: true,
      data: {
        productId: product.id,
        partNumber: product.partNumber,
        barcode: barcodeData,
        format,
        generatedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Erro na geração de código de barras:', error)
    
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
 * Gerar dados do código de barras baseado no part number
 */
function generateBarcodeData(partNumber: string, format: string = 'CODE128') {
  // Normalizar part number para código de barras
  const normalizedCode = partNumber.replace(/[^A-Z0-9]/g, '')
  
  // Gerar checksum simples (para demonstração)
  const checksum = normalizedCode
    .split('')
    .reduce((sum, char) => sum + char.charCodeAt(0), 0) % 10

  return {
    code: normalizedCode,
    displayCode: partNumber,
    format,
    checksum,
    fullCode: `${normalizedCode}${checksum}`,
    // URL para gerar imagem do código de barras (seria integrado com serviço externo)
    imageUrl: `https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(partNumber)}&code=${format}&multiplebarcodes=false&translate-esc=false&unit=Fit&dpi=96&imagetype=Gif&rotation=0&color=%23000000&bgcolor=%23ffffff&qunit=Mm&quiet=0`,
    // Dados para bibliotecas JavaScript de código de barras
    jsBarcode: {
      value: partNumber,
      format,
      width: 2,
      height: 100,
      displayValue: true,
      fontSize: 12,
      textAlign: 'center',
      textPosition: 'bottom'
    }
  }
}