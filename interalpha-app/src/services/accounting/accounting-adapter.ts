// Interface base para adaptadores de sistemas contábeis

import { AccountingEntry, SyncResult, DataConflict, Resolution } from '@/types/accounting'

export abstract class AccountingAdapter {
  protected apiKey: string
  protected baseUrl: string
  protected config: Record<string, any>

  constructor(apiKey: string, baseUrl: string, config: Record<string, any> = {}) {
    this.apiKey = apiKey
    this.baseUrl = baseUrl
    this.config = config
  }

  // Métodos abstratos que devem ser implementados por cada adaptador
  abstract testConnection(): Promise<boolean>
  abstract syncPayment(payment: any): Promise<SyncResult>
  abstract syncInvoice(invoice: any): Promise<SyncResult>
  abstract syncExpense(expense: any): Promise<SyncResult>
  abstract handleConflict(conflict: DataConflict): Promise<Resolution>
  abstract getExternalData(entityType: string, externalId: string): Promise<any>

  // Métodos comuns
  protected async makeRequest(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE', data?: any): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`
    
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          ...this.getCustomHeaders()
        },
        body: data ? JSON.stringify(data) : undefined
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`Erro na requisição para ${url}:`, error)
      throw error
    }
  }

  protected getCustomHeaders(): Record<string, string> {
    return {}
  }

  protected formatCurrency(amount: number): string {
    return (amount / 100).toFixed(2)
  }

  protected parseDate(date: Date): string {
    return date.toISOString().split('T')[0]
  }

  protected validateRequiredFields(data: any, requiredFields: string[]): void {
    const missingFields = requiredFields.filter(field => !data[field])
    if (missingFields.length > 0) {
      throw new Error(`Campos obrigatórios ausentes: ${missingFields.join(', ')}`)
    }
  }
}