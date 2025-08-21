import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ProductService } from '@/lib/services/product-service'
import { addCalculationsToProduct } from '@/lib/utils/product-utils'

/**
 * GET /api/produtos/[id] - Buscar produto específico
 * Usado por: ProductDetails, ProductForm (edição), etc.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação
    let userId = null
    try {
      const { userId: authUserId } = await auth()
      userId = authUserId
    } catch (authError) {
      console.warn('Aviso: Autenticação falhou, continuando sem usuário:', authError)
    }

    const { id } = params

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID do produto é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar produto
    const product = await ProductService.getProductById(id)

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Produto não encontrado' },
        { status: 404 }
      )
    }

    // Adicionar cálculos
    const productWithCalculations = addCalculationsToProduct(product)

    // Adicionar informações extras para o frontend
    const enhancedProduct = {
      ...productWithCalculations,
      canDelete: product.orderItems?.length === 0,
      usageCount: product.orderItems?.length || 0,
      recentOrders: product.orderItems?.slice(0, 5).map(item => ({
        orderId: item.order.id,
        orderTitle: item.order.titulo,
        clientName: item.order.cliente?.nome,
        quantity: item.quantity,
        date: item.order.createdAt
      })) || []
    }

    return NextResponse.json({
      success: true,
      data: enhancedProduct,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Erro ao buscar produto:', error)
    
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
 * PATCH /api/produtos/[id] - Atualização parcial via API
 * Para atualizações específicas de Client Components (ex: toggle status)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params
    const body = await request.json()

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID do produto é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se produto existe
    const existingProduct = await ProductService.getProductById(id)
    if (!existingProduct) {
      return NextResponse.json(
        { success: false, error: 'Produto não encontrado' },
        { status: 404 }
      )
    }

    // Atualizar apenas campos permitidos via API
    const allowedFields = ['isActive', 'imageUrl']
    const updateData: any = {}

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: 'Nenhum campo válido para atualização' },
        { status: 400 }
      )
    }

    // Atualizar produto
    const updatedProduct = await ProductService.updateProduct(id, updateData)

    // Adicionar cálculos
    const productWithCalculations = addCalculationsToProduct(updatedProduct)

    return NextResponse.json({
      success: true,
      data: productWithCalculations,
      updated: Object.keys(updateData),
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Erro ao atualizar produto:', error)
    
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
 * DELETE /api/produtos/[id] - Exclusão via API
 * Para Client Components que precisam de feedback imediato
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID do produto é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se produto existe e pode ser excluído
    const product = await ProductService.getProductById(id)
    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Produto não encontrado' },
        { status: 404 }
      )
    }

    // Excluir produto
    await ProductService.deleteProduct(id)

    return NextResponse.json({
      success: true,
      message: 'Produto excluído com sucesso',
      deletedId: id,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Erro ao excluir produto:', error)
    
    // Tratar erro específico de produto em uso
    if (error instanceof Error && error.message.includes('sendo usado')) {
      return NextResponse.json(
        { 
          success: false, 
          error: error.message,
          code: 'PRODUCT_IN_USE'
        },
        { status: 409 }
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