import { clientKeyService } from '@/services/client-access/client-key-service'
import { clientNotificationService } from '@/services/notifications/client-notification-service'

export interface CleanupJobConfig {
  enabled: boolean
  intervalMinutes: number
  warningHours: number[]
  batchSize: number
}

export class ClientKeyCleanupJob {
  private config: CleanupJobConfig
  private intervalId: NodeJS.Timeout | null = null

  constructor(config: CleanupJobConfig = {
    enabled: true,
    intervalMinutes: 60, // Executar a cada hora
    warningHours: [4, 1], // Avisar 4h e 1h antes de expirar
    batchSize: 100
  }) {
    this.config = config
  }

  start(): void {
    if (!this.config.enabled) {
      console.log('Client key cleanup job is disabled')
      return
    }

    console.log(`Starting client key cleanup job (interval: ${this.config.intervalMinutes}min)`)
    
    // Executar imediatamente
    this.runCleanup()

    // Agendar execuções periódicas
    this.intervalId = setInterval(() => {
      this.runCleanup()
    }, this.config.intervalMinutes * 60 * 1000)
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
      console.log('Client key cleanup job stopped')
    }
  }

  async runCleanup(): Promise<{
    expiredKeysProcessed: number
    warningsSent: number
    errors: string[]
  }> {
    const startTime = Date.now()
    const errors: string[] = []
    let expiredKeysProcessed = 0
    let warningsSent = 0

    try {
      console.log('Running client key cleanup job...')

      // 1. Processar chaves expiradas
      const expiredResult = await this.processExpiredKeys()
      expiredKeysProcessed = expiredResult.processed
      errors.push(...expiredResult.errors)

      // 2. Enviar avisos de expiração
      const warningResult = await this.sendExpirationWarnings()
      warningsSent = warningResult.sent
      errors.push(...warningResult.errors)

      // 3. Log de estatísticas
      await this.logCleanupStats({
        executionTime: Date.now() - startTime,
        expiredKeysProcessed,
        warningsSent,
        errors
      })

      console.log(`Cleanup job completed: ${expiredKeysProcessed} expired keys, ${warningsSent} warnings sent`)

    } catch (error) {
      const errorMessage = `Cleanup job failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      errors.push(errorMessage)
      console.error(errorMessage)
    }

    return { expiredKeysProcessed, warningsSent, errors }
  }

  private async processExpiredKeys(): Promise<{ processed: number; errors: string[] }> {
    const errors: string[] = []
    let processed = 0

    try {
      // Buscar chaves expiradas em lotes
      const expiredKeys = await this.findExpiredKeys(this.config.batchSize)

      for (const keyData of expiredKeys) {
        try {
          // Desativar chave expirada
          await this.deactivateExpiredKey(keyData.id)
          
          // Log da desativação
          await this.logKeyExpiration(keyData)
          
          processed++
        } catch (error) {
          errors.push(`Error processing expired key ${keyData.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }

    } catch (error) {
      errors.push(`Error finding expired keys: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    return { processed, errors }
  }

  private async sendExpirationWarnings(): Promise<{ sent: number; errors: string[] }> {
    const errors: string[] = []
    let sent = 0

    try {
      for (const hours of this.config.warningHours) {
        const keysNearExpiration = await this.findKeysNearExpiration(hours)

        for (const keyData of keysNearExpiration) {
          try {
            // Verificar se já foi enviado aviso para este horário
            const alreadySent = await this.wasWarningAlreadySent(keyData.id, hours)
            if (alreadySent) continue

            // Buscar dados do cliente
            const client = await this.findClientById(keyData.clientId)
            if (!client) continue

            // Enviar aviso de expiração
            const success = await clientNotificationService.sendKeyExpirationWarning(client, hours)
            
            if (success) {
              await this.markWarningAsSent(keyData.id, hours)
              sent++
            }

          } catch (error) {
            errors.push(`Error sending warning for key ${keyData.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
          }
        }
      }

    } catch (error) {
      errors.push(`Error sending expiration warnings: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    return { sent, errors }
  }

  // Métodos de banco de dados (implementar)

  private async findExpiredKeys(limit: number): Promise<any[]> {
    // TODO: Implementar busca de chaves expiradas
    return []
  }

  private async findKeysNearExpiration(hours: number): Promise<any[]> {
    // TODO: Implementar busca de chaves próximas do vencimento
    const expirationTime = new Date(Date.now() + hours * 60 * 60 * 1000)
    return []
  }

  private async deactivateExpiredKey(keyId: string): Promise<void> {
    // TODO: Implementar desativação no banco
    console.log(`Deactivating expired key: ${keyId}`)
  }

  private async findClientById(clientId: string): Promise<any> {
    // TODO: Implementar busca do cliente
    return null
  }

  private async wasWarningAlreadySent(keyId: string, hours: number): Promise<boolean> {
    // TODO: Implementar verificação de aviso já enviado
    return false
  }

  private async markWarningAsSent(keyId: string, hours: number): Promise<void> {
    // TODO: Implementar marcação de aviso enviado
    console.log(`Marking warning as sent for key ${keyId} (${hours}h)`)
  }

  private async logKeyExpiration(keyData: any): Promise<void> {
    // TODO: Implementar log de expiração
    console.log(`Key expired: ${keyData.id}`)
  }

  private async logCleanupStats(stats: {
    executionTime: number
    expiredKeysProcessed: number
    warningsSent: number
    errors: string[]
  }): Promise<void> {
    // TODO: Implementar log de estatísticas
    console.log('Cleanup stats:', stats)
  }
}

// Instância global do job
export const clientKeyCleanupJob = new ClientKeyCleanupJob()

// Auto-start em produção
if (process.env.NODE_ENV === 'production') {
  clientKeyCleanupJob.start()
}