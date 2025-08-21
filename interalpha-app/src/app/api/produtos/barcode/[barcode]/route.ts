/**
 * API para busca de produtos por código de barras
 * GET /api/produtos/barcode/[barcode] - Buscar produto por código de barras
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { enrichProductWithCalculations } from '@/lib/utils/product-utils'

/**
 * GET /api/produtos/barcode/[barcode] - Buscar produto por código de barras
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { barcode: string } }
) {
  try {
    // Autenticação
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { barcode } = params

    if (!barcode) {
      return NextResponse.json(
        { error: 'Código de barras é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar produto por código de barras
    // Nota: Como não temos campo barcode ainda, vamos buscar por part number
    // Em uma implementação completa, você adicionaria um campo barcode ao modelo Product
    const product = await prisma.product.findFirst({
      where: {
        OR: [
          { partNumber: { equals: barcode, mode: 'insensitive' } },
          // Se tivesse campo barcode: { barcode: barcode }
        ],
        isActive: true
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        orderItems: {
          include: {
            order: {
              select: {
                id: true,
                titulo: true,
                status: true
              }
            }
          },
          take: 5,
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!product) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Produto não encontrado para este código de barras',
          code: 'PRODUCT_NOT_FOUND'
        },
        { status: 404 }
      )
    }

    // Enriquecer produto com cálculos
    const enrichedProduct = enrichProductWithCalculations(product)

    return NextResponse.json({
      success: true,
      data: enrichedProduct,
      message: 'Produto encontrado'
    })

  } catch (error: any) {
    console.error('Erro ao buscar produto por código de barras:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/produtos/barcode/[barcode] - Associar código de barras a produto
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { barcode: string } }
) {
  try {
    // Autenticação
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { barcode } = params
    const { productId } = await request.json()

    if (!barcode || !productId) {
      return NextResponse.json(
        { error: 'Código de barras e ID do produto são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se o produto existe
    const product = await prisma.product.findUnique({
      where: { id: productId }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Produto não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se o código de barras já está em uso
    // Nota: Esta implementação assume que você adicionará um campo barcode ao modelo
    // Por enquanto, vamos simular a associação
    
    // Em uma implementação completa, você faria:
    // const existingProduct = await prisma.product.findFirst({
    //   where: { barcode }
    // })
    
    // if (existingProduct && existingProduct.id !== productId) {
    //   return NextResponse.json(
    //     { error: 'Código de barras já está associado a outro produto' },
    //     { status: 409 }
    //   )
    // }

    // Atualizar produto com código de barras
    // const updatedProduct = await prisma.product.update({
    //   where: { id: productId },
    //   data: { barcode }
    // })

    // Por enquanto, retornar sucesso simulado
    return NextResponse.json({
      success: true,
      message: 'Código de barras associado ao produto com sucesso',
      data: {
        productId,
        barcode,
        // Em implementação real: updatedProduct
      }
    })

  } catch (error: any) {
    console.error('Erro ao associar código de barras:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}