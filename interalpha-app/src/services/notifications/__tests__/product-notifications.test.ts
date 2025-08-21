/**
 * Testes para o sistema de notificações de produtos
 */

import { Product } from '@/types/product'
import { productNotifications } from '../product-notifications'
import { enrichProductWithCalculations } from '@/lib/utils/product-utils'

// Mock do NotificationService
jest.mock('../notification-service', () => ({
  NotificationService: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({
      id: 'test-notification-id',
      success: true
    })
  }))
}))

describe('ProductNotifications', () => {
  const mockProduct: Product = {
    id: 'test-product-id',
    partNumber: 'TEST-001',
    description: 'Produto de teste',
    costPrice: 100,
    salePrice: 150,
    imageUrl: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'test-user-id'
  }

  const mockUserId = 'test-user-id'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('notifyProductCreated', () => {
    it('deve enviar notificação quando produto é criado', async () => {
      await productNotifications.notifyProductCreated(mockProduct, mockUserId)

      // Verificar se o método send foi chamado
      const notificationService = (productNotifications as any).notificationService
      expect(notificationService.send).toHaveBeenCalledWith({
        userId: mockUserId,
        type: 'product_created',
        title: 'Produto Criado',
        message: `Produto ${mockProduct.partNumber} foi cadastrado com sucesso`,
        priority: 'medium',
        category: 'products',
        data: {
          productId: mockProduct.id,
          partNumber: mockProduct.partNumber,
          description: mockProduct.description,
          profitMargin: expect.any(Number)
        },
        channels: ['in_app']
      })
    })

    it('deve notificar margem baixa quando produto tem margem menor que 10%', async () => {
      const lowMarginProduct = {
        ...mockProduct,
        salePrice: 105 // Margem de 5%
      }

      await productNotifications.notifyProductCreated(lowMarginProduct, mockUserId)

      const notificationService = (productNotifications as any).notificationService
      
      // Deve ter enviado 2 notificações: criação + margem baixa
      expect(notificationService.send).toHaveBeenCalledTimes(2)
    })
  })

  describe('notifyProductUpdated', () => {
    it('deve enviar notificação quando produto é atualizado', async () => {
      const updatedProduct = {
        ...mockProduct,
        description: 'Produto atualizado'
      }

      await productNotifications.notifyProductUpdated(mockProduct, updatedProduct, mockUserId)

      const notificationService = (productNotifications as any).notificationService
      expect(notificationService.send).toHaveBeenCalledWith({
        userId: mockUserId,
        type: 'product_updated',
        title: 'Produto Atualizado',
        message: `Produto ${updatedProduct.partNumber} foi atualizado`,
        priority: 'low',
        category: 'products',
        data: {
          productId: updatedProduct.id,
          partNumber: updatedProduct.partNumber,
          changes: expect.any(Object)
        },
        channels: ['in_app']
      })
    })

    it('deve notificar mudança significativa de preço', async () => {
      const updatedProduct = {
        ...mockProduct,
        salePrice: 200 // Aumento de 33%
      }

      await productNotifications.notifyProductUpdated(mockProduct, updatedProduct, mockUserId)

      const notificationService = (productNotifications as any).notificationService
      
      // Deve ter enviado múltiplas notificações
      expect(notificationService.send).toHaveBeenCalledTimes(3) // update + price change + margin change
    })
  })

  describe('notifyLowProfitMargin', () => {
    it('deve enviar notificação com prioridade urgente para margem negativa', async () => {
      const negativeMarginProduct = enrichProductWithCalculations({
        ...mockProduct,
        salePrice: 80 // Margem negativa
      })

      await productNotifications.notifyLowProfitMargin(negativeMarginProduct, mockUserId)

      const notificationService = (productNotifications as any).notificationService
      expect(notificationService.send).toHaveBeenCalledWith({
        userId: mockUserId,
        type: 'low_profit_margin',
        title: 'Margem de Lucro Baixa',
        message: `Produto ${negativeMarginProduct.partNumber} tem margem de ${negativeMarginProduct.profitMargin.toFixed(1)}%`,
        priority: 'urgent',
        category: 'products',
        data: {
          productId: negativeMarginProduct.id,
          partNumber: negativeMarginProduct.partNumber,
          profitMargin: negativeMarginProduct.profitMargin,
          threshold: 10
        },
        channels: ['in_app', 'email', 'sms']
      })
    })

    it('deve enviar notificação com prioridade alta para margem muito baixa', async () => {
      const lowMarginProduct = enrichProductWithCalculations({
        ...mockProduct,
        salePrice: 103 // Margem de 3%
      })

      await productNotifications.notifyLowProfitMargin(lowMarginProduct, mockUserId)

      const notificationService = (productNotifications as any).notificationService
      expect(notificationService.send).toHaveBeenCalledWith(
        expect.objectContaining({
          priority: 'high',
          channels: ['in_app', 'email']
        })
      )
    })
  })

  describe('notifyProductUsedInOrder', () => {
    it('deve enviar notificação quando produto é usado em ordem', async () => {
      const orderId = 'test-order-id'
      const orderTitle = 'Ordem de Teste'
      const quantity = 2

      await productNotifications.notifyProductUsedInOrder(
        mockProduct,
        orderId,
        orderTitle,
        quantity,
        mockUserId
      )

      const notificationService = (productNotifications as any).notificationService
      expect(notificationService.send).toHaveBeenCalledWith({
        userId: mockUserId,
        type: 'product_used_in_order',
        title: 'Produto Utilizado',
        message: `${quantity}x ${mockProduct.partNumber} usado na ordem "${orderTitle}"`,
        priority: 'low',
        category: 'orders',
        data: {
          productId: mockProduct.id,
          partNumber: mockProduct.partNumber,
          orderId,
          orderTitle,
          quantity
        },
        channels: ['in_app']
      })
    })
  })

  describe('error handling', () => {
    it('deve tratar erros graciosamente', async () => {
      const notificationService = (productNotifications as any).notificationService
      notificationService.send.mockRejectedValueOnce(new Error('Erro de teste'))

      // Não deve lançar erro
      await expect(
        productNotifications.notifyProductCreated(mockProduct, mockUserId)
      ).resolves.not.toThrow()
    })
  })
})