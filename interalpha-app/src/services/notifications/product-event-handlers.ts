/**
 * Handlers de eventos para notificações automáticas de produtos
 */

import { Product, ProductWithCalculations } from '@/types/product'
import { productNotifications } from './product-notifications'
import { enrichProductWithCalculations } from '@/lib/utils/product-utils'

export interface ProductEvent {
  type: 'created' | 'updated' | 'deleted' | 'used_in_order' | 'low_margin_detected'
  product: Product
  userId: string
  metadata?: Record<string, any>
}

export class ProductEventHandlers {
  
  /**
   * Processar evento de produto
   */
  static async handleProductEvent(event: ProductEvent): Promise<void> {
    try {
      switch (event.type) {
        case 'created':
          await this.handleProductCreated(event)
          break
        case 'updated':
          await this.handleProductUpdated(event)
          break
        case 'deleted':
          await this.handleProductDeleted(event)
          break
        case 'used_in_order':
          await this.handleProductUsedInOrder(event)
          break
        case 'low_margin_detected':
          await this.handleLowMarginDetected(event)
          break
        default:
          console.warn(`Tipo de evento não reconhecido: ${event.type}`)
      }
    } catch (error) {
      console.error(`Erro ao processar evento de produto ${event.type}:`, error)
    }
  }

  /**
   * Handler para produto criado
   */
  private static async handleProductCreated(event: ProductEvent): Promise<void> {
    const enrichedProduct = enrichProductWithCalculations(event.product)
    
    // Notificação básica de criação
    await productNotifications.notifyProductCreated(event.product, event.userId)
    
    // Verificar margem baixa
    if (enrichedProduct.profitMargin < 10) {
      await productNotifications.notifyLowProfitMargin(enrichedProduct, event.userId)
    }
    
    // Notificar gestores sobre novos produtos (opcional)
    await this.notifyManagersNewProduct(enrichedProduct, event.userId)
  }

  /**
   * Handler para produto atualizado
   */
  private static async handleProductUpdated(event: ProductEvent): Promise<void> {
    const oldProduct = event.metadata?.oldProduct as Product
    if (!oldProduct) return

    await productNotifications.notifyProductUpdated(oldProduct, event.product, event.userId)
    
    // Verificar se produto foi desativado
    if (oldProduct.isActive && !event.product.isActive) {
      await this.handleProductDeactivated(event.product, event.userId)
    }
    
    // Verificar se produto foi reativado
    if (!oldProduct.isActive && event.product.isActive) {
      await this.handleProductReactivated(event.product, event.userId)
    }
  }

  /**
   * Handler para produto excluído
   */
  private static async handleProductDeleted(event: ProductEvent): Promise<void> {
    await productNotifications.notifyProductDeleted(event.product, event.userId)
    
    // Notificar gestores sobre exclusão (se produto tinha vendas significativas)
    if (event.metadata?.hadSignificantSales) {
      await this.notifyManagersProductDeleted(event.product, event.userId)
    }
  }

  /**
   * Handler para produto usado em ordem
   */
  private static async handleProductUsedInOrder(event: ProductEvent): Promise<void> {
    const { orderId, orderTitle, quantity } = event.metadata || {}
    
    if (orderId && orderTitle && quantity) {
      await productNotifications.notifyProductUsedInOrder(
        event.product,
        orderId,
        orderTitle,
        quantity,
        event.userId
      )
    }
  }

  /**
   * Handler para margem baixa detectada
   */
  private static async handleLowMarginDetected(event: ProductEvent): Promise<void> {
    const enrichedProduct = enrichProductWithCalculations(event.product)
    await productNotifications.notifyLowProfitMargin(enrichedProduct, event.userId)
  }

  /**
   * Notificar gestores sobre novo produto
   */
  private static async notifyManagersNewProduct(
    product: ProductWithCalculations, 
    createdBy: string
  ): Promise<void> {
    // Implementar lógica para encontrar gestores
    // Por enquanto, apenas log
    console.log(`Novo produto criado: ${product.partNumber} por ${createdBy}`)
  }

  /**
   * Notificar sobre produto desativado
   */
  private static async handleProductDeactivated(product: Product, userId: string): Promise<void> {
    // Implementar notificação específica para desativação
    console.log(`Produto desativado: ${product.partNumber}`)
  }

  /**
   * Notificar sobre produto reativado
   */
  private static async handleProductReactivated(product: Product, userId: string): Promise<void> {
    // Implementar notificação específica para reativação
    console.log(`Produto reativado: ${product.partNumber}`)
  }

  /**
   * Notificar gestores sobre produto excluído
   */
  private static async notifyManagersProductDeleted(product: Product, deletedBy: string): Promise<void> {
    // Implementar notificação para gestores
    console.log(`Produto com vendas significativas excluído: ${product.partNumber}`)
  }
}

/**
 * Função utilitária para disparar eventos de produto
 */
export async function emitProductEvent(event: ProductEvent): Promise<void> {
  await ProductEventHandlers.handleProductEvent(event)
}

/**
 * Funções de conveniência para eventos específicos
 */
export async function emitProductCreated(product: Product, userId: string): Promise<void> {
  await emitProductEvent({
    type: 'created',
    product,
    userId
  })
}

export async function emitProductUpdated(
  product: Product, 
  userId: string, 
  oldProduct: Product
): Promise<void> {
  await emitProductEvent({
    type: 'updated',
    product,
    userId,
    metadata: { oldProduct }
  })
}

export async function emitProductDeleted(
  product: Product, 
  userId: string, 
  hadSignificantSales: boolean = false
): Promise<void> {
  await emitProductEvent({
    type: 'deleted',
    product,
    userId,
    metadata: { hadSignificantSales }
  })
}

export async function emitProductUsedInOrder(
  product: Product,
  userId: string,
  orderId: string,
  orderTitle: string,
  quantity: number
): Promise<void> {
  await emitProductEvent({
    type: 'used_in_order',
    product,
    userId,
    metadata: { orderId, orderTitle, quantity }
  })
}

export async function emitLowMarginDetected(product: Product, userId: string): Promise<void> {
  await emitProductEvent({
    type: 'low_margin_detected',
    product,
    userId
  })
}