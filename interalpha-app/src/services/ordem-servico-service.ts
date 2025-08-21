/**
 * Serviço para gerenciar ordens de serviço
 */

import { prisma } from '@/lib/prisma'

export interface CreateOrdemServicoData {
  titulo: string
  descricao?: string
  clienteId: string
  status?: string
  prioridade?: string
  valor?: number
  dataInicio?: Date
  dataFim?: Date
  items?: {
    productId: string
    quantity: number
    unitPrice?: number
    description?: string
  }[]
}

export interface UpdateOrdemServicoData {
  titulo?: string
  descricao?: string
  status?: string
  prioridade?: string
  valor?: number
  dataInicio?: Date
  dataFim?: Date
}

export interface OrderItemData {
  productId: string
  quantity: number
  unitPrice?: number
  description?: string
}

export class OrdemServicoService {
  /**
   * Criar nova ordem de serviço
   */
  async create(data: CreateOrdemServicoData, userId: string) {
    const { items, ...ordemData } = data

    // Processar itens se fornecidos
    let processedItems: any[] = []
    let valorProdutos = 0

    if (items && items.length > 0) {
      for (const item of items) {
        // Verificar se o produto existe
        const product = await prisma.product.findUnique({
          where: { id: item.productId }
        })

        if (!product) {
          throw new Error(`Produto não encontrado: ${item.productId}`)
        }

        // Usar preço do produto se não fornecido
        const unitPrice = item.unitPrice ?? product.salePrice
        const totalPrice = unitPrice * item.quantity

        processedItems.push({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice,
          totalPrice,
          description: item.description
        })

        valorProdutos += totalPrice
      }
    }

    // Criar ordem com itens em transação
    const result = await prisma.$transaction(async (tx) => {
      // Criar ordem
      const ordem = await tx.ordemServico.create({
        data: {
          ...ordemData,
          userId
        }
      })

      // Criar itens se existirem
      if (processedItems.length > 0) {
        await tx.orderItem.createMany({
          data: processedItems.map(item => ({
            orderId: ordem.id,
            ...item
          }))
        })
      }

      // Buscar ordem completa para retorno
      const ordemCompleta = await tx.ordemServico.findUnique({
        where: { id: ordem.id },
        include: {
          cliente: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          items: {
            include: {
              product: true
            }
          }
        }
      })

      return ordemCompleta
    })

    return result
  }

  /**
   * Atualizar ordem de serviço
   */
  async update(id: string, data: UpdateOrdemServicoData, userId: string) {
    // Verificar se a ordem existe e o usuário tem permissão
    const ordemExistente = await prisma.ordemServico.findFirst({
      where: {
        id,
        userId // Por enquanto, só o criador pode editar
      }
    })

    if (!ordemExistente) {
      throw new Error('Ordem não encontrada ou sem permissão')
    }

    // Atualizar ordem
    const ordemAtualizada = await prisma.ordemServico.update({
      where: { id },
      data,
      include: {
        cliente: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        items: {
          include: {
            product: true
          }
        }
      }
    })

    return ordemAtualizada
  }

  /**
   * Buscar ordem por ID
   */
  async findById(id: string, userId?: string) {
    const where: any = { id }
    
    if (userId) {
      where.OR = [
        { userId }, // Criador da ordem
        // TODO: Adicionar verificação de permissões
      ]
    }

    const ordem = await prisma.ordemServico.findFirst({
      where,
      include: {
        cliente: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        items: {
          include: {
            product: true
          },
          orderBy: { createdAt: 'asc' }
        },
        pagamentos: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!ordem) {
      return null
    }

    // Calcular valores
    const valorProdutos = ordem.items.reduce((sum, item) => sum + item.totalPrice, 0)
    const valorTotal = (ordem.valor || 0) + valorProdutos
    const valorPago = ordem.pagamentos
      .filter(p => p.status === 'PAGO')
      .reduce((sum, p) => sum + p.valor, 0)

    return {
      ...ordem,
      valorProdutos,
      valorTotal,
      valorPago,
      valorPendente: valorTotal - valorPago
    }
  }

  /**
   * Listar ordens com filtros
   */
  async findMany(filters: {
    userId?: string
    clienteId?: string
    status?: string
    search?: string
    page?: number
    limit?: number
  }) {
    const {
      userId,
      clienteId,
      status,
      search,
      page = 1,
      limit = 10
    } = filters

    // Construir filtros
    const where: any = {}

    if (userId) {
      where.OR = [
        { userId }, // Ordens criadas pelo usuário
        // TODO: Adicionar verificação de permissões
      ]
    }

    if (clienteId) {
      where.clienteId = clienteId
    }

    if (status) {
      where.status = status
    }

    if (search) {
      where.OR = [
        { titulo: { contains: search, mode: 'insensitive' } },
        { descricao: { contains: search, mode: 'insensitive' } },
        { cliente: { nome: { contains: search, mode: 'insensitive' } } }
      ]
    }

    // Buscar ordens com paginação
    const [ordens, total] = await Promise.all([
      prisma.ordemServico.findMany({
        where,
        include: {
          cliente: {
            select: {
              id: true,
              nome: true,
              email: true,
              telefone: true
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  partNumber: true,
                  description: true,
                  salePrice: true
                }
              }
            }
          },
          _count: {
            select: {
              items: true,
              pagamentos: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.ordemServico.count({ where })
    ])

    // Calcular valores totais para cada ordem
    const ordensWithTotals = ordens.map(ordem => {
      const valorProdutos = ordem.items.reduce((sum, item) => sum + item.totalPrice, 0)
      const valorTotal = (ordem.valor || 0) + valorProdutos
      
      return {
        ...ordem,
        valorProdutos,
        valorTotal,
        totalItems: ordem._count.items,
        totalPagamentos: ordem._count.pagamentos
      }
    })

    return {
      ordens: ordensWithTotals,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  }

  /**
   * Excluir ordem de serviço
   */
  async delete(id: string, userId: string) {
    // Verificar se a ordem existe e o usuário tem permissão
    const ordem = await prisma.ordemServico.findFirst({
      where: {
        id,
        userId // Por enquanto, só o criador pode excluir
      },
      include: {
        items: true,
        pagamentos: true
      }
    })

    if (!ordem) {
      throw new Error('Ordem não encontrada ou sem permissão')
    }

    // Verificar se a ordem pode ser excluída
    const pagamentosPagos = ordem.pagamentos.filter(p => p.status === 'PAGO')
    if (pagamentosPagos.length > 0) {
      throw new Error('Não é possível excluir ordem com pagamentos realizados')
    }

    // Excluir ordem (cascade vai excluir itens e pagamentos pendentes)
    await prisma.ordemServico.delete({
      where: { id }
    })

    return { success: true }
  }

  /**
   * Recalcular totais da ordem
   */
  async recalculateTotals(ordemId: string) {
    const ordem = await this.findById(ordemId)
    if (!ordem) {
      throw new Error('Ordem não encontrada')
    }

    const valorProdutos = ordem.items.reduce(
      (sum, item) => sum + item.totalPrice, 
      0
    )

    // Atualizar apenas se necessário
    // Por enquanto, não vamos alterar o valor da ordem automaticamente
    // Isso pode ser uma decisão de negócio

    return {
      valorServico: ordem.valor || 0,
      valorProdutos,
      valorTotal: (ordem.valor || 0) + valorProdutos
    }
  }

  /**
   * Adicionar item à ordem
   */
  async addItem(ordemId: string, itemData: OrderItemData, userId: string) {
    // Verificar se a ordem existe e o usuário tem permissão
    const ordem = await prisma.ordemServico.findFirst({
      where: {
        id: ordemId,
        userId
      }
    })

    if (!ordem) {
      throw new Error('Ordem não encontrada ou sem permissão')
    }

    // Verificar se o produto existe
    const product = await prisma.product.findUnique({
      where: { id: itemData.productId }
    })

    if (!product) {
      throw new Error('Produto não encontrado')
    }

    // Usar preço do produto se não fornecido
    const unitPrice = itemData.unitPrice ?? product.salePrice
    const totalPrice = unitPrice * itemData.quantity

    // Verificar se já existe item para este produto
    const existingItem = await prisma.orderItem.findFirst({
      where: {
        orderId: ordemId,
        productId: itemData.productId
      }
    })

    let result

    if (existingItem) {
      // Atualizar quantidade do item existente
      result = await prisma.orderItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + itemData.quantity,
          totalPrice: (existingItem.quantity + itemData.quantity) * unitPrice
        },
        include: {
          product: true
        }
      })
    } else {
      // Criar novo item
      result = await prisma.orderItem.create({
        data: {
          orderId: ordemId,
          productId: itemData.productId,
          quantity: itemData.quantity,
          unitPrice,
          totalPrice,
          description: itemData.description
        },
        include: {
          product: true
        }
      })
    }

    return result
  }

  /**
   * Remover item da ordem
   */
  async removeItem(itemId: string, userId: string) {
    // Buscar item com ordem para verificar permissão
    const item = await prisma.orderItem.findUnique({
      where: { id: itemId },
      include: {
        order: true
      }
    })

    if (!item) {
      throw new Error('Item não encontrado')
    }

    if (item.order.userId !== userId) {
      throw new Error('Sem permissão para remover este item')
    }

    // Remover item
    await prisma.orderItem.delete({
      where: { id: itemId }
    })

    return { success: true }
  }

  /**
   * Atualizar item da ordem
   */
  async updateItem(itemId: string, data: {
    quantity?: number
    unitPrice?: number
    description?: string
  }, userId: string) {
    // Buscar item com ordem para verificar permissão
    const item = await prisma.orderItem.findUnique({
      where: { id: itemId },
      include: {
        order: true,
        product: true
      }
    })

    if (!item) {
      throw new Error('Item não encontrado')
    }

    if (item.order.userId !== userId) {
      throw new Error('Sem permissão para atualizar este item')
    }

    // Preparar dados para atualização
    const updateData: any = { ...data }

    // Recalcular total se quantidade ou preço mudaram
    if (data.quantity !== undefined || data.unitPrice !== undefined) {
      const quantity = data.quantity ?? item.quantity
      const unitPrice = data.unitPrice ?? item.unitPrice
      updateData.totalPrice = quantity * unitPrice
    }

    // Atualizar item
    const updatedItem = await prisma.orderItem.update({
      where: { id: itemId },
      data: updateData,
      include: {
        product: true
      }
    })

    return updatedItem
  }
}