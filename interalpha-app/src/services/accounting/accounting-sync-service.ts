// Serviço principal para sincronização com sistemas contábeis

import { prisma } from '@/lib/prisma'
import { AccountingAdapter } from './accounting-adapter'
import { OmieAdapter } from './omie-adapter'
import { GenericAdapter } from './generic-adapter'
import { 
  AccountingSystem, 
  SyncResult, 
  SyncStatus, 
  SyncConfig, 
  DataConflict,
  Resolution 
} from '@/types/accounting'

export class AccountingSyncService {
  private adapters: Map<string, AccountingAdapter> = new Map()
  private config: SyncConfig

  constructor(config: SyncConfig) {
    this.config = config
  }

  // Inicializar adaptadores baseado nas configurações
  async initializeAdapters(): Promise<void> {
    try {
      const systems = await prisma.accountingSystem.findMany({
        where: { isActive: true }
      })

      for (const system of systems) {
        const adapter = this.createAdapter(system)
        if (adapter) {
          this.adapters.set(system.id, adapter)
        }
      }

      console.log(`Inicializados ${this.adapters.size} adaptadores contábeis`)
    } catch (error) {
      console.error('Erro ao inicializar adaptadores:', error)
      throw error
    }
  }

  private createAdapter(system: AccountingSystem): AccountingAdapter | null {
    try {
      switch (system.type) {
        case 'omie':
          return new OmieAdapter(
            system.config.appKey,
            system.config.appSecret,
            system.config
          )
        case 'generic':
          return new GenericAdapter(
            system.apiKey,
            system.baseUrl,
            system.config
          )
        default:
          console.warn(`Tipo de sistema não suportado: ${system.type}`)
          return null
      }
    } catch (error) {
      console.error(`Erro ao criar adaptador para ${system.name}:`, error)
      return null
    }
  }

  // Sincronizar pagamento com todos os sistemas ativos
  async syncPayment(payment: any): Promise<SyncStatus[]> {
    const results: SyncStatus[] = []

    for (const [systemId, adapter] of this.adapters) {
      try {
        // Verificar se já foi sincronizado
        const existingSync = await prisma.accountingSync.findFirst({
          where: {
            entityType: 'payment',
            entityId: payment.id,
            systemId
          }
        })

        if (existingSync && existingSync.status === 'success') {
          console.log(`Pagamento ${payment.id} já sincronizado com sistema ${systemId}`)
          continue
        }

        const result = await adapter.syncPayment(payment)
        
        const syncStatus: SyncStatus = {
          entityType: 'payment',
          entityId: payment.id,
          externalId: result.externalId,
          status: result.success ? 'success' : 'failed',
          lastSyncAt: result.success ? new Date() : undefined,
          errorMessage: result.errorMessage,
          retryCount: result.retryCount,
          nextRetryAt: result.success ? undefined : this.calculateNextRetry(result.retryCount)
        }

        // Salvar status no banco
        await this.saveSyncStatus(systemId, syncStatus)
        results.push(syncStatus)

        console.log(`Pagamento ${payment.id} sincronizado com ${systemId}: ${result.success ? 'sucesso' : 'falha'}`)
      } catch (error) {
        console.error(`Erro ao sincronizar pagamento ${payment.id} com ${systemId}:`, error)
        
        const syncStatus: SyncStatus = {
          entityType: 'payment',
          entityId: payment.id,
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Erro desconhecido',
          retryCount: 0,
          nextRetryAt: this.calculateNextRetry(0)
        }

        await this.saveSyncStatus(systemId, syncStatus)
        results.push(syncStatus)
      }
    }

    return results
  }

  // Sincronizar fatura com todos os sistemas ativos
  async syncInvoice(invoice: any): Promise<SyncStatus[]> {
    const results: SyncStatus[] = []

    for (const [systemId, adapter] of this.adapters) {
      try {
        const existingSync = await prisma.accountingSync.findFirst({
          where: {
            entityType: 'invoice',
            entityId: invoice.id,
            systemId
          }
        })

        if (existingSync && existingSync.status === 'success') {
          console.log(`Fatura ${invoice.id} já sincronizada com sistema ${systemId}`)
          continue
        }

        const result = await adapter.syncInvoice(invoice)
        
        const syncStatus: SyncStatus = {
          entityType: 'invoice',
          entityId: invoice.id,
          externalId: result.externalId,
          status: result.success ? 'success' : 'failed',
          lastSyncAt: result.success ? new Date() : undefined,
          errorMessage: result.errorMessage,
          retryCount: result.retryCount,
          nextRetryAt: result.success ? undefined : this.calculateNextRetry(result.retryCount)
        }

        await this.saveSyncStatus(systemId, syncStatus)
        results.push(syncStatus)

        console.log(`Fatura ${invoice.id} sincronizada com ${systemId}: ${result.success ? 'sucesso' : 'falha'}`)
      } catch (error) {
        console.error(`Erro ao sincronizar fatura ${invoice.id} com ${systemId}:`, error)
        
        const syncStatus: SyncStatus = {
          entityType: 'invoice',
          entityId: invoice.id,
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Erro desconhecido',
          retryCount: 0,
          nextRetryAt: this.calculateNextRetry(0)
        }

        await this.saveSyncStatus(systemId, syncStatus)
        results.push(syncStatus)
      }
    }

    return results
  }

  // Reprocessar sincronizações falhadas
  async retryFailedSyncs(): Promise<void> {
    try {
      const failedSyncs = await prisma.accountingSync.findMany({
        where: {
          status: 'failed',
          retryCount: { lt: this.config.maxRetries },
          OR: [
            { nextRetryAt: null },
            { nextRetryAt: { lte: new Date() } }
          ]
        }
      })

      console.log(`Reprocessando ${failedSyncs.length} sincronizações falhadas`)

      for (const sync of failedSyncs) {
        try {
          const adapter = this.adapters.get(sync.systemId)
          if (!adapter) {
            console.warn(`Adaptador não encontrado para sistema ${sync.systemId}`)
            continue
          }

          // Buscar dados da entidade
          const entityData = await this.getEntityData(sync.entityType, sync.entityId)
          if (!entityData) {
            console.warn(`Dados não encontrados para ${sync.entityType} ${sync.entityId}`)
            continue
          }

          let result: SyncResult
          switch (sync.entityType) {
            case 'payment':
              result = await adapter.syncPayment(entityData)
              break
            case 'invoice':
              result = await adapter.syncInvoice(entityData)
              break
            default:
              console.warn(`Tipo de entidade não suportado para retry: ${sync.entityType}`)
              continue
          }

          // Atualizar status
          await prisma.accountingSync.update({
            where: { id: sync.id },
            data: {
              status: result.success ? 'success' : 'failed',
              externalId: result.externalId,
              lastSyncAt: result.success ? new Date() : sync.lastSyncAt,
              errorMessage: result.errorMessage,
              retryCount: sync.retryCount + 1,
              nextRetryAt: result.success ? null : this.calculateNextRetry(sync.retryCount + 1)
            }
          })

          console.log(`Retry ${sync.entityType} ${sync.entityId}: ${result.success ? 'sucesso' : 'falha'}`)
        } catch (error) {
          console.error(`Erro no retry de ${sync.entityType} ${sync.entityId}:`, error)
          
          await prisma.accountingSync.update({
            where: { id: sync.id },
            data: {
              retryCount: sync.retryCount + 1,
              errorMessage: error instanceof Error ? error.message : 'Erro desconhecido',
              nextRetryAt: this.calculateNextRetry(sync.retryCount + 1)
            }
          })
        }
      }
    } catch (error) {
      console.error('Erro ao reprocessar sincronizações falhadas:', error)
      throw error
    }
  }

  // Detectar e resolver conflitos
  async resolveConflicts(): Promise<void> {
    try {
      const conflicts = await prisma.accountingSync.findMany({
        where: { status: 'conflict' }
      })

      console.log(`Resolvendo ${conflicts.length} conflitos`)

      for (const conflict of conflicts) {
        try {
          const adapter = this.adapters.get(conflict.systemId)
          if (!adapter) continue

          const localData = await this.getEntityData(conflict.entityType, conflict.entityId)
          const externalData = await adapter.getExternalData(conflict.entityType, conflict.externalId!)

          const dataConflict: DataConflict = {
            entityType: conflict.entityType,
            entityId: conflict.entityId,
            localData,
            externalData,
            conflictFields: this.detectConflictFields(localData, externalData),
            timestamp: new Date()
          }

          const resolution = await adapter.handleConflict(dataConflict)
          
          if (resolution.action !== 'manual') {
            // Aplicar resolução automática
            await this.applyResolution(conflict, resolution)
            
            await prisma.accountingSync.update({
              where: { id: conflict.id },
              data: {
                status: 'success',
                lastSyncAt: new Date(),
                errorMessage: null
              }
            })

            console.log(`Conflito resolvido automaticamente: ${conflict.entityType} ${conflict.entityId}`)
          } else {
            console.log(`Conflito requer resolução manual: ${conflict.entityType} ${conflict.entityId}`)
          }
        } catch (error) {
          console.error(`Erro ao resolver conflito ${conflict.id}:`, error)
        }
      }
    } catch (error) {
      console.error('Erro ao resolver conflitos:', error)
      throw error
    }
  }

  // Testar conectividade com todos os sistemas
  async testAllConnections(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {}

    for (const [systemId, adapter] of this.adapters) {
      try {
        results[systemId] = await adapter.testConnection()
      } catch (error) {
        console.error(`Erro ao testar conexão com ${systemId}:`, error)
        results[systemId] = false
      }
    }

    return results
  }

  // Métodos auxiliares privados
  private async saveSyncStatus(systemId: string, status: SyncStatus): Promise<void> {
    await prisma.accountingSync.upsert({
      where: {
        entityType_entityId_systemId: {
          entityType: status.entityType,
          entityId: status.entityId,
          systemId
        }
      },
      update: {
        externalId: status.externalId,
        status: status.status,
        lastSyncAt: status.lastSyncAt,
        errorMessage: status.errorMessage,
        retryCount: status.retryCount,
        nextRetryAt: status.nextRetryAt
      },
      create: {
        entityType: status.entityType,
        entityId: status.entityId,
        systemId,
        externalId: status.externalId,
        status: status.status,
        lastSyncAt: status.lastSyncAt,
        errorMessage: status.errorMessage,
        retryCount: status.retryCount,
        nextRetryAt: status.nextRetryAt
      }
    })
  }

  private calculateNextRetry(retryCount: number): Date {
    const baseDelay = this.config.retryDelay * 60 * 1000 // converter para ms
    const exponentialDelay = baseDelay * Math.pow(2, retryCount)
    return new Date(Date.now() + exponentialDelay)
  }

  private async getEntityData(entityType: string, entityId: string): Promise<any> {
    switch (entityType) {
      case 'payment':
        return await prisma.pagamento.findUnique({
          where: { id: entityId },
          include: { cliente: true }
        })
      case 'invoice':
        return await prisma.ordemServico.findUnique({
          where: { id: entityId },
          include: { 
            cliente: true,
            itens: true
          }
        })
      default:
        return null
    }
  }

  private detectConflictFields(localData: any, externalData: any): string[] {
    const conflicts: string[] = []
    
    // Comparar campos principais
    const fieldsToCompare = ['valor', 'descricao', 'data', 'status']
    
    for (const field of fieldsToCompare) {
      if (localData[field] !== externalData[field]) {
        conflicts.push(field)
      }
    }

    return conflicts
  }

  private async applyResolution(conflict: any, resolution: Resolution): Promise<void> {
    // Implementar lógica para aplicar a resolução
    // Por exemplo, atualizar dados locais ou externos conforme a resolução
    console.log(`Aplicando resolução ${resolution.action} para conflito ${conflict.id}`)
  }
}