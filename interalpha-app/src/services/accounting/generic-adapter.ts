// Adaptador genérico para sistemas contábeis com API REST

import { AccountingAdapter } from './accounting-adapter'
import { SyncResult, DataConflict, Resolution } from '@/types/accounting'

export class GenericAdapter extends AccountingAdapter {
  constructor(apiKey: string, baseUrl: string, config: Record<string, any> = {}) {
    super(apiKey, baseUrl, config)
  }

  async testConnection(): Promise<boolean> {
    try {
      const testEndpoint = this.config.testEndpoint || '/health'
      await this.makeRequest(testEndpoint, 'GET')
      return true
    } catch (error) {
      console.error('Erro ao testar conexão:', error)
      return false
    }
  }

  async syncPayment(payment: any): Promise<SyncResult> {
    try {
      this.validateRequiredFields(payment, ['valor', 'descricao', 'data'])

      const paymentData = {
        id: payment.id,
        amount: this.formatCurrency(payment.valor),
        description: payment.descricao,
        date: this.parseDate(new Date(payment.data)),
        type: 'income',
        category: this.config.defaultPaymentCategory || 'services',
        client_id: payment.clienteId,
        metadata: {
          source: 'interalpha',
          original_id: payment.id
        }
      }

      const endpoint = this.config.endpoints?.payments || '/payments'
      const response = await this.makeRequest(endpoint, 'POST', paymentData)

      return {
        success: true,
        externalId: response.id?.toString(),
        timestamp: new Date(),
        retryCount: 0
      }
    } catch (error) {
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date(),
        retryCount: 0
      }
    }
  }

  async syncInvoice(invoice: any): Promise<SyncResult> {
    try {
      this.validateRequiredFields(invoice, ['numero', 'valor', 'clienteId'])

      const invoiceData = {
        id: invoice.id,
        number: invoice.numero,
        amount: this.formatCurrency(invoice.valor),
        client_id: invoice.clienteId,
        due_date: this.parseDate(new Date(invoice.dataVencimento)),
        status: invoice.status || 'pending',
        items: invoice.itens?.map((item: any) => ({
          description: item.descricao,
          quantity: item.quantidade || 1,
          unit_price: this.formatCurrency(item.valorUnitario),
          total: this.formatCurrency(item.valorTotal || item.valorUnitario)
        })) || [],
        metadata: {
          source: 'interalpha',
          original_id: invoice.id
        }
      }

      const endpoint = this.config.endpoints?.invoices || '/invoices'
      const response = await this.makeRequest(endpoint, 'POST', invoiceData)

      return {
        success: true,
        externalId: response.id?.toString(),
        timestamp: new Date(),
        retryCount: 0
      }
    } catch (error) {
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date(),
        retryCount: 0
      }
    }
  }

  async syncExpense(expense: any): Promise<SyncResult> {
    try {
      this.validateRequiredFields(expense, ['valor', 'descricao', 'data'])

      const expenseData = {
        id: expense.id,
        amount: this.formatCurrency(expense.valor),
        description: expense.descricao,
        date: this.parseDate(new Date(expense.data)),
        type: 'expense',
        category: this.config.defaultExpenseCategory || 'operational',
        metadata: {
          source: 'interalpha',
          original_id: expense.id
        }
      }

      const endpoint = this.config.endpoints?.expenses || '/expenses'
      const response = await this.makeRequest(endpoint, 'POST', expenseData)

      return {
        success: true,
        externalId: response.id?.toString(),
        timestamp: new Date(),
        retryCount: 0
      }
    } catch (error) {
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date(),
        retryCount: 0
      }
    }
  }

  async handleConflict(conflict: DataConflict): Promise<Resolution> {
    // Estratégia simples: usar dados locais por padrão
    // Pode ser customizada via configuração
    const strategy = this.config.conflictResolution || 'local_wins'

    switch (strategy) {
      case 'local_wins':
        return {
          action: 'use_local',
          resolvedData: conflict.localData,
          notes: 'Usando dados locais (configuração padrão)'
        }
      case 'external_wins':
        return {
          action: 'use_external',
          resolvedData: conflict.externalData,
          notes: 'Usando dados externos (configuração)'
        }
      default:
        return {
          action: 'manual',
          notes: 'Conflito requer resolução manual'
        }
    }
  }

  async getExternalData(entityType: string, externalId: string): Promise<any> {
    try {
      let endpoint = ''

      switch (entityType) {
        case 'payment':
          endpoint = this.config.endpoints?.payments || '/payments'
          break
        case 'invoice':
          endpoint = this.config.endpoints?.invoices || '/invoices'
          break
        case 'expense':
          endpoint = this.config.endpoints?.expenses || '/expenses'
          break
        default:
          throw new Error(`Tipo de entidade não suportado: ${entityType}`)
      }

      const response = await this.makeRequest(`${endpoint}/${externalId}`, 'GET')
      return response
    } catch (error) {
      console.error(`Erro ao buscar dados externos:`, error)
      throw error
    }
  }

  protected getCustomHeaders(): Record<string, string> {
    const headers: Record<string, string> = {}
    
    if (this.config.customHeaders) {
      Object.assign(headers, this.config.customHeaders)
    }

    return headers
  }
}