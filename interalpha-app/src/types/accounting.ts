// Tipos para integração com sistemas contábeis

export interface AccountingSystem {
  id: string
  name: string
  type: 'omie' | 'contabilizei' | 'sage' | 'generic'
  baseUrl: string
  apiKey: string
  isActive: boolean
  config: Record<string, any>
}

export interface SyncResult {
  success: boolean
  externalId?: string
  errorMessage?: string
  timestamp: Date
  retryCount: number
}

export interface DataConflict {
  entityType: string
  entityId: string
  localData: any
  externalData: any
  conflictFields: string[]
  timestamp: Date
}

export interface Resolution {
  action: 'use_local' | 'use_external' | 'merge' | 'manual'
  resolvedData?: any
  notes?: string
}

export interface AccountingEntry {
  id: string
  type: 'payment' | 'invoice' | 'expense'
  amount: number
  description: string
  date: Date
  accountCode?: string
  categoryId?: string
  clientId?: string
  metadata: Record<string, any>
}

export interface SyncStatus {
  entityType: string
  entityId: string
  externalId?: string
  status: 'pending' | 'success' | 'failed' | 'conflict'
  lastSyncAt?: Date
  errorMessage?: string
  retryCount: number
  nextRetryAt?: Date
}

export interface SyncConfig {
  autoSync: boolean
  syncInterval: number // em minutos
  maxRetries: number
  retryDelay: number // em minutos
  conflictResolution: 'manual' | 'local_wins' | 'external_wins'
  enabledEntities: string[]
}

export interface AccountingWebhook {
  id: string
  event: string
  data: any
  timestamp: Date
  processed: boolean
}