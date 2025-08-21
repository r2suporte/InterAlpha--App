/**
 * API para gerenciar itens de produtos em ordens de serviço
 * GET /api/ordens-servico/[id]/items - Listar itens
 * PUT /api/ordens-servico/[id]/items - Atualizar itens
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { auditMiddleware } from '@/middleware/audit-middleware'

/**
 * GET /api/ordens-servico/[id]/items - Listar itens da ordem
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const { id: orderId } = params

    // Verificar se a ordem existe e o usuário tem acesso
    const ordem = await prisma.ordemServico.findFirst({
      where: {
        id: orderId,
        OR: [
          { userId }, // Criador da ordem
          { user: { roleAssignments: { some: { role: { permissions: { has: 'orders:read_all' } } } } } } // Permissão global
        ]
      }
    })

    if (!ordem) {
      return NextResponse.json(
        { error: 'Ordem não encontrada ou sem permissão' },
        { status: 404 }
      )
    }

    // Buscar itens da ordem
    const items = await prisma.orderItem.findMany({
      where: { orderId },
      include: {
        product: {
          include: {
            creator: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json({
      success: true,
      data: items
    })

  } catch (error: any) {
    console.error('Erro ao buscar itens da ordem:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/ordens-servico/[id]/items - Atualizar itens da ordem
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const { id: orderId } = params
    const { items } = await request.json()

    // Verificar se a ordem existe e o usuário tem acesso
    const ordem = await prisma.ordemServico.findFirst({
      where: {
        id: orderId,
        OR: [
          { userId }, // Criador da ordem
          { user: { roleAssignments: { some: { role: { permissions: { has: 'orders:update_all' } } } } } } // Permissão global
        ]
      }
    })

    if (!ordem) {
      return NextResponse.json(
        { error: 'Ordem não encontrada ou sem permissão' },
        { status: 404 }
      )
    }

    // Validar itens
    if (!Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Items deve ser um array' },
        { status: 400 }
      )
    }

    // Validar cada item
    for (const item of items) {
      if (!item.productId || !item.quantity || !item.unitPrice) {
        return NextResponse.json(
          { error: 'Todos os itens devem ter productId, quantity e unitPrice' },
          { status: 400 }
        )
      }

      if (item.quantity <= 0 || item.unitPrice <= 0) {
        return NextResponse.json(
          { error: 'Quantity e unitPrice devem ser positivos' },
          { status: 400 }
        )
      }

      // Verificar se o produto existe
      const product = await prisma.product.findUnique({
        where: { id: item.productId }
      })

      if (!product) {
        return NextResponse.json(
          { error: `Produto ${item.productId} não encontrado` },
          { status: 400 }
        )
      }
    }

    // Obter itens atuais para auditoria
    const currentItems = await prisma.orderItem.findMany({
      where: { orderId }
    })

    // Usar transação para atualizar itens
    const result = await prisma.$transaction(async (tx) => {
      // Remover todos os itens existentes
      await tx.orderItem.deleteMany({
        where: { orderId }
      })

      // Criar novos itens
      const newItems = await Promise.all(
        items.map((item: any) =>
          tx.orderItem.create({
            data: {
              orderId,
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.quantity * item.unitPrice
            },
            include: {
              product: {
                include: {
                  creator: {
                    select: {
                      id: true,
                      name: true,
                      email: true
                    }
                  }
                }
              }
            }
          })
        )
      )

      // Atualizar valor total da ordem (opcional)
      const totalProductsValue = newItems.reduce((sum, item) => sum + item.totalPrice, 0)
      const currentOrderValue = ordem.valor || 0
      
      await tx.ordemServico.update({
        where: { id: orderId },
        data: {
          // Você pode decidir se quer somar ao valor existente ou substituir
          // valor: currentOrderValue + totalProductsValue,
          updatedAt: new Date()
        }
      })

      return newItems
    })

    // Registrar auditoria
    await auditMiddleware(request, {
      action: 'update_order_items',
      resource: 'order_item',
      resourceId: orderId,
      oldData: currentItems,
      newData: result
    })

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Itens da ordem atualizados com sucesso'
    })

  } catch (error: any) {
    console.error('Erro ao atualizar itens da ordem:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/ordens-servico/[id]/items - Adicionar item à ordem
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const { id: orderId } = params
    const { productId, quantity, unitPrice } = await request.json()

    // Validar dados
    if (!productId || !quantity || !unitPrice) {
      return NextResponse.json(
        { error: 'productId, quantity e unitPrice são obrigatórios' },
        { status: 400 }
      )
    }

    if (quantity <= 0 || unitPrice <= 0) {
      return NextResponse.json(
        { error: 'Quantity e unitPrice devem ser positivos' },
        { status: 400 }
      )
    }

    // Verificar se a ordem existe
    const ordem = await prisma.ordemServico.findFirst({
      where: {
        id: orderId,
        OR: [
          { userId },
          { user: { roleAssignments: { some: { role: { permissions: { has: 'orders:update_all' } } } } } }
        ]
      }
    })

    if (!ordem) {
      return NextResponse.json(
        { error: 'Ordem não encontrada ou sem permissão' },
        { status: 404 }
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

    // Verificar se já existe item para este produto
    const existingItem = await prisma.orderItem.findFirst({
      where: {
        orderId,
        productId
      }
    })

    let result

    if (existingItem) {
      // Atualizar quantidade do item existente
      result = await prisma.orderItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + quantity,
          totalPrice: (existingItem.quantity + quantity) * unitPrice
        },
        include: {
          product: {
            include: {
              creator: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      })
    } else {
      // Criar novo item
      result = await prisma.orderItem.create({
        data: {
          orderId,
          productId,
          quantity,
          unitPrice,
          totalPrice: quantity * unitPrice
        },
        include: {
          product: {
            include: {
              creator: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      })
    }

    // Registrar auditoria
    await auditMiddleware(request, {
      action: 'add_order_item',
      resource: 'order_item',
      resourceId: result.id,
      oldData: existingItem,
      newData: result
    })

    // Enviar notificação de produto usado
    try {
      const { emitProductUsedInOrder } = await import('@/services/notifications/product-event-handlers')
      await emitProductUsedInOrder(
        product,
        userId,
        orderId,
        ordem.titulo,
        quantity
      )
    } catch (notificationError) {
      console.error('Erro ao enviar notificação de produto usado:', notificationError)
      // Não falhar a operação por causa da notificação
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Item adicionado à ordem com sucesso'
    })

  } catch (error: any) {
    console.error('Erro ao adicionar item à ordem:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}