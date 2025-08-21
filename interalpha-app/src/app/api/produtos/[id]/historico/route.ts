import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ProductService } from '@/lib/services/product-service'

/**
 * GET /api/produtos/[id]/historico - Buscar histórico de alterações do produto
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
      return NextResponse.json(
        { success: false, error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    const { id } = params
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200)
    const offset = parseInt(searchParams.get('offset') || '0')
    const actionType = searchParams.get('actionType') // 'created', 'updated', 'deleted', etc.
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID do produto é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se produto existe
    const product = await ProductService.getProductById(id)
    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Produto não encontrado' },
        { status: 404 }
      )
    }

    // Buscar histórico de auditoria
    const auditHistory = await getProductAuditHistory(id, {
      limit,
      offset,
      actionType
    })
    
    // Buscar histórico de uso em ordens
    const usageHistory = await getProductUsageHistory(id, {
      limit: Math.min(limit, 20)
    })
    
    // Buscar alterações de preço
    const priceHistory = await getProductPriceHistory(id)
    
    return NextResponse.json({
      success: true,
      data: {
        product: {
          id: product.id,
          partNumber: product.partNumber,
          description: product.description,
          currentPrices: {
            costPrice: product.costPrice,
            salePrice: product.salePrice
          }
        },
        audit: auditHistory,
        usage: usageHistory,
        priceChanges: priceHistory,
        summary: {
          totalAuditEntries: auditHistory.total,
          totalUsages: usageHistory.total,
          totalPriceChanges: priceHistory.length,
          firstCreated: product.createdAt,
          lastModified: product.updatedAt
        }
      },
      meta: {
        limit,
        offset,
        actionType,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Erro ao buscar histórico do produto:', error)
    
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
 * Busca histórico de auditoria do produto
 */
async function getProductAuditHistory(productId: string, options: {
  limit: number
  offset: number
  actionType?: string | null
}) {
  try {
    // TODO: Implementar com sistema de auditoria real
    // const auditEntries = await prisma.auditEntry.findMany({
    //   where: {
    //     resource: 'product',
    //     resourceId: productId,
    //     ...(options.actionType && { action: options.actionType })
    //   },
    //   include: {
    //     user: {
    //       select: { name: true, email: true }
    //     }
    //   },
    //   orderBy: { timestamp: 'desc' },
    //   take: options.limit,
    //   skip: options.offset
    // })
    
    // Mock data para demonstração
    const mockAuditEntries = [
      {
        id: 'audit-1',
        action: 'product_created',
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 dias atrás
        userId: 'user-1',
        user: { name: 'João Silva', email: 'joao@empresa.com' },
        oldData: null,
        newData: {
          partNumber: 'PROD-001',
          description: 'Produto inicial',
          costPrice: 50.00,
          salePrice: 75.00
        },
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0...'
      },
      {
        id: 'audit-2',
        action: 'product_updated',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 dias atrás
        userId: 'user-2',
        user: { name: 'Maria Santos', email: 'maria@empresa.com' },
        oldData: {
          description: 'Produto inicial',
          salePrice: 75.00
        },
        newData: {
          description: 'Produto atualizado com nova descrição',
          salePrice: 80.00
        },
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0...'
      }
    ]
    
    return {
      entries: mockAuditEntries.map(entry => ({
        ...entry,
        changes: entry.oldData ? getChangedFields(entry.oldData, entry.newData) : [],
        actionDescription: getActionDescription(entry.action, entry.oldData, entry.newData)
      })),
      total: mockAuditEntries.length
    }
    
  } catch (error) {
    console.error('Erro ao buscar auditoria:', error)
    return { entries: [], total: 0 }
  }
}

/**
 * Busca histórico de uso do produto em ordens
 */
async function getProductUsageHistory(productId: string, options: { limit: number }) {
  try {
    // TODO: Implementar busca real no banco
    // const usageEntries = await prisma.orderItem.findMany({
    //   where: { productId },
    //   include: {
    //     order: {
    //       select: {
    //         id: true,
    //         titulo: true,
    //         createdAt: true,
    //         cliente: {
    //           select: { nome: true }
    //         },
    //         user: {
    //           select: { name: true, email: true }
    //         }
    //       }
    //     }
    //   },
    //   orderBy: { createdAt: 'desc' },
    //   take: options.limit
    // })
    
    // Mock data
    const mockUsageEntries = [
      {
        id: 'usage-1',
        quantity: 2,
        unitPrice: 80.00,
        totalPrice: 160.00,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        order: {
          id: 'order-1',
          titulo: 'Manutenção equipamento A',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          cliente: { nome: 'Cliente ABC' },
          user: { name: 'João Silva', email: 'joao@empresa.com' }
        }
      }
    ]
    
    return {
      entries: mockUsageEntries,
      total: mockUsageEntries.length,
      totalQuantityUsed: mockUsageEntries.reduce((sum, entry) => sum + entry.quantity, 0),
      totalRevenue: mockUsageEntries.reduce((sum, entry) => sum + entry.totalPrice, 0)
    }
    
  } catch (error) {
    console.error('Erro ao buscar histórico de uso:', error)
    return { entries: [], total: 0, totalQuantityUsed: 0, totalRevenue: 0 }
  }
}

/**
 * Busca histórico de alterações de preço
 */
async function getProductPriceHistory(productId: string) {
  try {
    // TODO: Implementar busca real de alterações de preço
    // Pode ser extraído do audit log filtrando por mudanças de preço
    
    // Mock data
    const mockPriceHistory = [
      {
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        costPrice: { old: null, new: 50.00 },
        salePrice: { old: null, new: 75.00 },
        margin: { old: null, new: 50.00 },
        reason: 'Criação do produto',
        changedBy: 'João Silva'
      },
      {
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        costPrice: { old: 50.00, new: 50.00 },
        salePrice: { old: 75.00, new: 80.00 },
        margin: { old: 50.00, new: 60.00 },
        reason: 'Ajuste de preço de venda',
        changedBy: 'Maria Santos'
      }
    ]
    
    return mockPriceHistory
    
  } catch (error) {
    console.error('Erro ao buscar histórico de preços:', error)
    return []
  }
}

/**
 * Identifica campos alterados entre duas versões
 */
function getChangedFields(oldData: any, newData: any): Array<{
  field: string
  oldValue: any
  newValue: any
  fieldLabel: string
}> {
  const changes = []
  const fieldLabels: Record<string, string> = {
    partNumber: 'Part Number',
    description: 'Descrição',
    costPrice: 'Preço de Custo',
    salePrice: 'Preço de Venda',
    isActive: 'Status',
    imageUrl: 'Imagem'
  }
  
  for (const field in newData) {
    if (oldData[field] !== newData[field]) {
      changes.push({
        field,
        oldValue: oldData[field],
        newValue: newData[field],
        fieldLabel: fieldLabels[field] || field
      })
    }
  }
  
  return changes
}

/**
 * Gera descrição da ação de auditoria
 */
function getActionDescription(action: string, oldData: any, newData: any): string {
  switch (action) {
    case 'product_created':
      return 'Produto criado'
    case 'product_updated':
      const changes = oldData ? getChangedFields(oldData, newData) : []
      if (changes.length === 1) {
        return `${changes[0].fieldLabel} alterado`
      } else if (changes.length > 1) {
        return `${changes.length} campos alterados`
      }
      return 'Produto atualizado'
    case 'product_deleted':
      return 'Produto excluído'
    case 'product_viewed':
      return 'Produto visualizado'
    default:
      return action.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
  }
}