/**
 * Testes para OrdemServicoService
 */

import { OrdemServicoService } from '../ordem-servico-service'
import { prisma } from '@/lib/prisma'

// Mock do Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    ordemServico: {
      create: jest.fn(),
      update: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      delete: jest.fn()
    },
    orderItem: {
      createMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    },
    product: {
      findUnique: jest.fn()
    },
    $transaction: jest.fn()
  }
}))

describe('OrdemServicoService', () => {
  let service: OrdemServicoService
  const mockUserId = 'user-123'

  beforeEach(() => {
    service = new OrdemServicoService()
    jest.clearAllMocks()
  })

  describe('create', () => {
    it('deve criar ordem sem produtos', async () => {
      const mockOrdem = {
        id: 'ordem-123',
        titulo: 'Teste',
        clienteId: 'client-123',
        userId: mockUserId
      }

      const mockOrdemCompleta = {
        ...mockOrdem,
        cliente: { id: 'client-123', nome: 'Cliente Teste' },
        user: { id: mockUserId, name: 'User Teste' },
        items: []
      }

      // Mock da transação
      ;(prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        // Mock do create
        ;(prisma.ordemServico.create as jest.Mock).mockResolvedValue(mockOrdem)
        
        // Mock do findUnique
        ;(prisma.ordemServico.findUnique as jest.Mock).mockResolvedValue(mockOrdemCompleta)
        
        return callback(prisma)
      })

      const result = await service.create({
        titulo: 'Teste',
        clienteId: 'client-123'
      }, mockUserId)

      expect(result).toEqual(mockOrdemCompleta)
      expect(prisma.$transaction).toHaveBeenCalled()
    })

    it('deve criar ordem com produtos', async () => {
      const mockProduct = {
        id: 'product-123',
        salePrice: 100
      }

      const mockOrdem = {
        id: 'ordem-123',
        titulo: 'Teste',
        clienteId: 'client-123',
        userId: mockUserId
      }

      const mockOrdemCompleta = {
        ...mockOrdem,
        cliente: { id: 'client-123', nome: 'Cliente Teste' },
        user: { id: mockUserId, name: 'User Teste' },
        items: [{
          id: 'item-123',
          productId: 'product-123',
          quantity: 2,
          unitPrice: 100,
          totalPrice: 200
        }]
      }

      // Mock do produto
      ;(prisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct)

      // Mock da transação
      ;(prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        ;(prisma.ordemServico.create as jest.Mock).mockResolvedValue(mockOrdem)
        ;(prisma.orderItem.createMany as jest.Mock).mockResolvedValue({ count: 1 })
        ;(prisma.ordemServico.findUnique as jest.Mock).mockResolvedValue(mockOrdemCompleta)
        
        return callback(prisma)
      })

      const result = await service.create({
        titulo: 'Teste',
        clienteId: 'client-123',
        items: [{
          productId: 'product-123',
          quantity: 2
        }]
      }, mockUserId)

      expect(result).toEqual(mockOrdemCompleta)
      expect(prisma.product.findUnique).toHaveBeenCalledWith({
        where: { id: 'product-123' }
      })
    })

    it('deve falhar se produto não existir', async () => {
      // Mock produto não encontrado
      ;(prisma.product.findUnique as jest.Mock).mockResolvedValue(null)

      await expect(service.create({
        titulo: 'Teste',
        clienteId: 'client-123',
        items: [{
          productId: 'product-inexistente',
          quantity: 1
        }]
      }, mockUserId)).rejects.toThrow('Produto não encontrado: product-inexistente')
    })
  })

  describe('addItem', () => {
    it('deve adicionar novo item', async () => {
      const mockOrdem = {
        id: 'ordem-123',
        userId: mockUserId
      }

      const mockProduct = {
        id: 'product-123',
        salePrice: 50
      }

      const mockItem = {
        id: 'item-123',
        orderId: 'ordem-123',
        productId: 'product-123',
        quantity: 1,
        unitPrice: 50,
        totalPrice: 50,
        product: mockProduct
      }

      ;(prisma.ordemServico.findFirst as jest.Mock).mockResolvedValue(mockOrdem)
      ;(prisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct)
      ;(prisma.orderItem.findFirst as jest.Mock).mockResolvedValue(null) // Não existe item
      ;(prisma.orderItem.create as jest.Mock).mockResolvedValue(mockItem)

      const result = await service.addItem('ordem-123', {
        productId: 'product-123',
        quantity: 1
      }, mockUserId)

      expect(result).toEqual(mockItem)
      expect(prisma.orderItem.create).toHaveBeenCalledWith({
        data: {
          orderId: 'ordem-123',
          productId: 'product-123',
          quantity: 1,
          unitPrice: 50,
          totalPrice: 50,
          description: undefined
        },
        include: {
          product: true
        }
      })
    })

    it('deve incrementar quantidade se item já existir', async () => {
      const mockOrdem = {
        id: 'ordem-123',
        userId: mockUserId
      }

      const mockProduct = {
        id: 'product-123',
        salePrice: 50
      }

      const mockExistingItem = {
        id: 'item-123',
        quantity: 2,
        unitPrice: 50
      }

      const mockUpdatedItem = {
        ...mockExistingItem,
        quantity: 3,
        totalPrice: 150,
        product: mockProduct
      }

      ;(prisma.ordemServico.findFirst as jest.Mock).mockResolvedValue(mockOrdem)
      ;(prisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct)
      ;(prisma.orderItem.findFirst as jest.Mock).mockResolvedValue(mockExistingItem)
      ;(prisma.orderItem.update as jest.Mock).mockResolvedValue(mockUpdatedItem)

      const result = await service.addItem('ordem-123', {
        productId: 'product-123',
        quantity: 1
      }, mockUserId)

      expect(result).toEqual(mockUpdatedItem)
      expect(prisma.orderItem.update).toHaveBeenCalledWith({
        where: { id: 'item-123' },
        data: {
          quantity: 3,
          totalPrice: 150
        },
        include: {
          product: true
        }
      })
    })

    it('deve falhar se usuário não tiver permissão', async () => {
      ;(prisma.ordemServico.findFirst as jest.Mock).mockResolvedValue(null)

      await expect(service.addItem('ordem-123', {
        productId: 'product-123',
        quantity: 1
      }, 'outro-user')).rejects.toThrow('Ordem não encontrada ou sem permissão')
    })
  })

  describe('recalculateTotals', () => {
    it('deve calcular totais corretamente', async () => {
      const mockOrdem = {
        id: 'ordem-123',
        valor: 100,
        items: [
          { totalPrice: 50 },
          { totalPrice: 30 }
        ]
      }

      // Mock do findById
      jest.spyOn(service, 'findById').mockResolvedValue(mockOrdem as any)

      const result = await service.recalculateTotals('ordem-123')

      expect(result).toEqual({
        valorServico: 100,
        valorProdutos: 80,
        valorTotal: 180
      })
    })
  })

  describe('findMany', () => {
    it('deve listar ordens com paginação', async () => {
      const mockOrdens = [
        {
          id: 'ordem-1',
          valor: 100,
          items: [{ totalPrice: 50 }],
          _count: { items: 1, pagamentos: 0 }
        }
      ]

      ;(prisma.ordemServico.findMany as jest.Mock).mockResolvedValue(mockOrdens)
      ;(prisma.ordemServico.count as jest.Mock).mockResolvedValue(1)

      const result = await service.findMany({
        userId: mockUserId,
        page: 1,
        limit: 10
      })

      expect(result.ordens).toHaveLength(1)
      expect(result.ordens[0].valorProdutos).toBe(50)
      expect(result.ordens[0].valorTotal).toBe(150)
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        pages: 1
      })
    })
  })
})