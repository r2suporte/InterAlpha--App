/**
 * Sistema de notificações específicas para produtos
 */

import { Product, ProductWithCalculations } from '@/types/product'
import { NotificationService } from './notification-service'
import { enrichProductWithCalculations } from '@/lib/utils/product-utils'

export interface ProductNotificationData {
  productId: string
  partNumber: string
  description: string
  oldValue?: any
  newValue?: any
  threshold?: number
  currentValue?: number
}

export class ProductNotifications {
  private notificationService: NotificationService

  constructor() {
    this.notificationService = new NotificationService()
  }

  /**
   * Notificar quando um produto é criado
   */
  async notifyProductCreated(product: Product, createdBy: string): Promise<void> {
    try {
      const enrichedProduct = enrichProductWithCalculations(product)
      
      await this.notificationService.send({
        userId: createdBy,
        type: 'product_created',
        title: 'Produto Criado',
        message: `Produto ${product.partNumber} foi cadastrado com sucesso`,
        priority: 'medium',
        category: 'products',
        data: {
          productId: product.id,
          partNumber: product.partNumber,
          description: product.description,
          profitMargin: enrichedProduct.profitMargin
        },
        channels: ['in_app']
      })

      // Notificar gestores se margem for muito baixa
      if (enrichedProduct.profitMargin < 10) {
        await this.notifyLowProfitMargin(enrichedProduct, createdBy)
      }

    } catch (error) {
      console.error('Erro ao enviar notificação de produto criado:', error)
    }
  }

  /**
   * Notificar quando um produto é atualizado
   */
  async notifyProductUpdated(
    oldProduct: Product, 
    newProduct: Product, 
    updatedBy: string
  ): Promise<void> {
    try {
      const oldEnriched = enrichProductWithCalculations(oldProduct)
      const newEnriched = enrichProductWithCalculations(newProduct)

      // Notificação geral de atualização
      await this.notificationService.send({
        userId: updatedBy,
        type: 'product_updated',
        title: 'Produto Atualizado',
        message: `Produto ${newProduct.partNumber} foi atualizado`,
        priority: 'low',
        category: 'products',
        data: {
          productId: newProduct.id,
          partNumber: newProduct.partNumber,
          changes: this.getProductChanges(oldProduct, newProduct)
        },
        channels: ['in_app']
      })

      // Notificar mudanças significativas de preço
      const priceChangeThreshold = 0.1 // 10%
      const costPriceChange = Math.abs(newProduct.costPrice - oldProduct.costPrice) / oldProduct.costPrice
      const salePriceChange = Math.abs(newProduct.salePrice - oldProduct.salePrice) / oldProduct.salePrice

      if (costPriceChange > priceChangeThreshold || salePriceChange > priceChangeThreshold) {
        await this.notifySignificantPriceChange(oldEnriched, newEnriched, updatedBy)
      }

      // Notificar mudança de margem
      const marginDifference = Math.abs(newEnriched.profitMargin - oldEnriched.profitMargin)
      if (marginDifference > 5) { // Mudança de mais de 5%
        await this.notifyMarginChange(oldEnriched, newEnriched, updatedBy)
      }

    } catch (error) {
      console.error('Erro ao enviar notificação de produto atualizado:', error)
    }
  }

  /**
   * Notificar quando um produto é excluído
   */
  async notifyProductDeleted(product: Product, deletedBy: string): Promise<void> {
    try {
      await this.notificationService.send({
        userId: deletedBy,
        type: 'product_deleted',
        title: 'Produto Excluído',
        message: `Produto ${product.partNumber} foi excluído do sistema`,
        priority: 'medium',
        category: 'products',
        data: {
          productId: product.id,
          partNumber: product.partNumber,
          description: product.description
        },
        channels: ['in_app', 'email']
      })

    } catch (error) {
      console.error('Erro ao enviar notificação de produto excluído:', error)
    }
  }

  /**
   * Notificar margem de lucro baixa
   */
  async notifyLowProfitMargin(product: ProductWithCalculations, userId: string): Promise<void> {
    try {
      const severity = product.profitMargin < 0 ? 'urgent' : 
                     product.profitMargin < 5 ? 'high' : 'medium'

      await this.notificationService.send({
        userId,
        type: 'low_profit_margin',
        title: 'Margem de Lucro Baixa',
        message: `Produto ${product.partNumber} tem margem de ${product.profitMargin.toFixed(1)}%`,
        priority: severity,
        category: 'products',
        data: {
          productId: product.id,
          partNumber: product.partNumber,
          profitMargin: product.profitMargin,
          threshold: 10
        },
        channels: severity === 'urgent' ? ['in_app', 'email', 'sms'] : ['in_app', 'email']
      })

    } catch (error) {
      console.error('Erro ao enviar notificação de margem baixa:', error)
    }
  }

  /**
   * Notificar mudança significativa de preço
   */
  async notifySignificantPriceChange(
    oldProduct: ProductWithCalculations,
    newProduct: ProductWithCalculations,
    userId: string
  ): Promise<void> {
    try {
      const costChange = ((newProduct.costPrice - oldProduct.costPrice) / oldProduct.costPrice) * 100
      const saleChange = ((newProduct.salePrice - oldProduct.salePrice) / oldProduct.salePrice) * 100

      let message = `Produto ${newProduct.partNumber}: `
      const changes: string[] = []

      if (Math.abs(costChange) > 10) {
        changes.push(`custo ${costChange > 0 ? '+' : ''}${costChange.toFixed(1)}%`)
      }
      if (Math.abs(saleChange) > 10) {
        changes.push(`venda ${saleChange > 0 ? '+' : ''}${saleChange.toFixed(1)}%`)
      }

      message += changes.join(', ')

      await this.notificationService.send({
        userId,
        type: 'significant_price_change',
        title: 'Mudança Significativa de Preço',
        message,
        priority: 'high',
        category: 'products',
        data: {
          productId: newProduct.id,
          partNumber: newProduct.partNumber,
          oldCostPrice: oldProduct.costPrice,
          newCostPrice: newProduct.costPrice,
          oldSalePrice: oldProduct.salePrice,
          newSalePrice: newProduct.salePrice,
          costChange,
          saleChange
        },
        channels: ['in_app', 'email']
      })

    } catch (error) {
      console.error('Erro ao enviar notificação de mudança de preço:', error)
    }
  }

  /**
   * Notificar mudança de margem
   */
  async notifyMarginChange(
    oldProduct: ProductWithCalculations,
    newProduct: ProductWithCalculations,
    userId: string
  ): Promise<void> {
    try {
      const marginDifference = newProduct.profitMargin - oldProduct.profitMargin
      const isImprovement = marginDifference > 0

      await this.notificationService.send({
        userId,
        type: 'margin_change',
        title: `Margem ${isImprovement ? 'Melhorou' : 'Piorou'}`,
        message: `Produto ${newProduct.partNumber}: margem ${isImprovement ? 'aumentou' : 'diminuiu'} ${Math.abs(marginDifference).toFixed(1)}%`,
        priority: isImprovement ? 'low' : 'medium',
        category: 'products',
        data: {
          productId: newProduct.id,
          partNumber: newProduct.partNumber,
          oldMargin: oldProduct.profitMargin,
          newMargin: newProduct.profitMargin,
          difference: marginDifference
        },
        channels: ['in_app']
      })

    } catch (error) {
      console.error('Erro ao enviar notificação de mudança de margem:', error)
    }
  }

  /**
   * Notificar produto usado em ordem de serviço
   */
  async notifyProductUsedInOrder(
    product: Product,
    orderId: string,
    orderTitle: string,
    quantity: number,
    userId: string
  ): Promise<void> {
    try {
      await this.notificationService.send({
        userId,
        type: 'product_used_in_order',
        title: 'Produto Utilizado',
        message: `${quantity}x ${product.partNumber} usado na ordem "${orderTitle}"`,
        priority: 'low',
        category: 'orders',
        data: {
          productId: product.id,
          partNumber: product.partNumber,
          orderId,
          orderTitle,
          quantity
        },
        channels: ['in_app']
      })

    } catch (error) {
      console.error('Erro ao enviar notificação de produto usado:', error)
    }
  }

  /**
   * Notificar produtos mais vendidos (relatório semanal)
   */
  async notifyTopSellingProducts(
    products: Array<{ product: ProductWithCalculations; quantitySold: number; revenue: number }>,
    userId: string,
    period: string
  ): Promise<void> {
    try {
      const topProduct = products[0]
      
      await this.notificationService.send({
        userId,
        type: 'top_selling_products',
        title: 'Relatório de Produtos Mais Vendidos',
        message: `${period}: ${topProduct.product.partNumber} liderou com ${topProduct.quantitySold} unidades vendidas`,
        priority: 'low',
        category: 'products',
        data: {
          period,
          topProducts: products.slice(0, 5).map(p => ({
            productId: p.product.id,
            partNumber: p.product.partNumber,
            quantitySold: p.quantitySold,
            revenue: p.revenue
          }))
        },
        channels: ['in_app', 'email']
      })

    } catch (error) {
      console.error('Erro ao enviar notificação de produtos mais vendidos:', error)
    }
  }

  /**
   * Obter mudanças entre produtos
   */
  private getProductChanges(oldProduct: Product, newProduct: Product): Record<string, any> {
    const changes: Record<string, any> = {}

    if (oldProduct.description !== newProduct.description) {
      changes.description = { old: oldProduct.description, new: newProduct.description }
    }

    if (oldProduct.costPrice !== newProduct.costPrice) {
      changes.costPrice = { old: oldProduct.costPrice, new: newProduct.costPrice }
    }

    if (oldProduct.salePrice !== newProduct.salePrice) {
      changes.salePrice = { old: oldProduct.salePrice, new: newProduct.salePrice }
    }

    if (oldProduct.imageUrl !== newProduct.imageUrl) {
      changes.imageUrl = { old: oldProduct.imageUrl, new: newProduct.imageUrl }
    }

    if (oldProduct.isActive !== newProduct.isActive) {
      changes.isActive = { old: oldProduct.isActive, new: newProduct.isActive }
    }

    return changes
  }
}

// Instância singleton
export const productNotifications = new ProductNotifications()

// Funções de conveniência
export async function notifyProductCreated(product: Product, createdBy: string): Promise<void> {
  return productNotifications.notifyProductCreated(product, createdBy)
}

export async function notifyProductUpdated(
  oldProduct: Product, 
  newProduct: Product, 
  updatedBy: string
): Promise<void> {
  return productNotifications.notifyProductUpdated(oldProduct, newProduct, updatedBy)
}

export async function notifyProductDeleted(product: Product, deletedBy: string): Promise<void> {
  return productNotifications.notifyProductDeleted(product, deletedBy)
}

export async function notifyLowProfitMargin(product: ProductWithCalculations, userId: string): Promise<void> {
  return productNotifications.notifyLowProfitMargin(product, userId)
}