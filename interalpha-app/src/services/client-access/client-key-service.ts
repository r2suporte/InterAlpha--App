import crypto from 'crypto'
import { ClientAccessKey, ClientPermissions, SessionMetadata } from '@/types/auth'

export interface ClientKeyData {
  id: string
  keyHash: string
  clientId: string
  generatedBy: string
  expiresAt: Date
  isActive: boolean
  ipAddress?: string
  userAgent?: string
  createdAt: Date
  lastUsed?: Date
  usageCount: number
}

export interface GenerateKeyOptions {
  customTTL?: number // TTL customizado em milissegundos
  permissions?: Partial<ClientPermissions>
  metadata?: Partial<SessionMetadata>
}

export class ClientKeyService {
  private readonly DEFAULT_TTL = 24 * 60 * 60 * 1000 // 24 horas
  private readonly MAX_ACTIVE_KEYS_PER_CLIENT = 3
  private readonly KEY_LENGTH = 32

  async generateClientKey(
    clientId: string, 
    generatedBy: string,
    options: GenerateKeyOptions = {}
  ): Promise<ClientAccessKey> {
    try {
      // Verificar se o cliente existe
      const client = await this.findClientById(clientId)
      if (!client) {
        throw new Error('Cliente não encontrado')
      }

      // Verificar limite de chaves ativas
      await this.cleanupExpiredKeys(clientId)
      const activeKeysCount = await this.countActiveKeys(clientId)
      
      if (activeKeysCount >= this.MAX_ACTIVE_KEYS_PER_CLIENT) {
        throw new Error('Limite de chaves ativas excedido')
      }

      // Gerar chave única
      const key = this.generateSecureKey()
      const keyHash = this.hashKey(key)
      const ttl = options.customTTL || this.DEFAULT_TTL
      const expiresAt = new Date(Date.now() + ttl)

      // Criar registro no banco
      const keyData: ClientKeyData = {
        id: crypto.randomUUID(),
        keyHash,
        clientId,
        generatedBy,
        expiresAt,
        isActive: true,
        ipAddress: options.metadata?.ipAddress,
        userAgent: options.metadata?.userAgent,
        createdAt: new Date(),
        usageCount: 0
      }

      await this.saveClientKeyData(keyData)

      // Criar objeto de resposta
      const accessKey: ClientAccessKey = {
        key, // Retorna a chave não hasheada apenas uma vez
        clientId,
        expiresAt,
        permissions: {
          ...this.getDefaultClientPermissions(),
          ...options.permissions
        },
        metadata: {
          ipAddress: options.metadata?.ipAddress || '',
          userAgent: options.metadata?.userAgent || '',
          generatedAt: new Date()
        }
      }

      // Enviar notificação para o cliente
      await this.sendAccessKeyNotification(client, accessKey)

      // Log de auditoria
      await this.logKeyGeneration(clientId, generatedBy, keyData.id)

      return accessKey

    } catch (error) {
      console.error('Error generating client key:', error)
      throw error
    }
  }

  async validateClientKey(key: string): Promise<{
    valid: boolean
    session?: any
    error?: string
    keyData?: ClientKeyData
  }> {
    try {
      const keyHash = this.hashKey(key)
      const keyData = await this.findClientKeyByHash(keyHash)

      if (!keyData) {
        return { valid: false, error: 'INVALID_CLIENT_KEY' }
      }

      if (!keyData.isActive) {
        return { valid: false, error: 'KEY_REVOKED' }
      }

      if (new Date() > keyData.expiresAt) {
        // Marcar como inativa
        await this.deactivateKey(keyData.id)
        return { valid: false, error: 'KEY_EXPIRED' }
      }

      // Atualizar uso da chave
      await this.updateKeyUsage(keyData.id)

      // Buscar dados do cliente
      const client = await this.findClientById(keyData.clientId)
      if (!client) {
        return { valid: false, error: 'CLIENT_NOT_FOUND' }
      }

      // Criar sessão
      const session = {
        clientId: keyData.clientId,
        clientData: client,
        permissions: this.getDefaultClientPermissions(),
        expiresAt: keyData.expiresAt,
        keyId: keyData.id
      }

      return { valid: true, session, keyData }

    } catch (error) {
      console.error('Error validating client key:', error)
      return { valid: false, error: 'VALIDATION_ERROR' }
    }
  }

  async revokeClientKey(key: string, revokedBy?: string): Promise<boolean> {
    try {
      const keyHash = this.hashKey(key)
      const keyData = await this.findClientKeyByHash(keyHash)

      if (!keyData) {
        return false
      }

      await this.deactivateKey(keyData.id)
      await this.logKeyRevocation(keyData.clientId, revokedBy || 'system', keyData.id)

      return true
    } catch (error) {
      console.error('Error revoking client key:', error)
      return false
    }
  }

  async revokeAllClientKeys(clientId: string, revokedBy: string): Promise<number> {
    try {
      const activeKeys = await this.findActiveKeysByClient(clientId)
      let revokedCount = 0

      for (const keyData of activeKeys) {
        await this.deactivateKey(keyData.id)
        revokedCount++
      }

      if (revokedCount > 0) {
        await this.logKeyRevocation(clientId, revokedBy, null, `Revoked ${revokedCount} keys`)
      }

      return revokedCount
    } catch (error) {
      console.error('Error revoking all client keys:', error)
      return 0
    }
  }

  async getClientActiveKeys(clientId: string): Promise<ClientKeyData[]> {
    try {
      await this.cleanupExpiredKeys(clientId)
      return await this.findActiveKeysByClient(clientId)
    } catch (error) {
      console.error('Error getting client active keys:', error)
      return []
    }
  }

  async getKeyUsageStats(keyId: string): Promise<{
    usageCount: number
    lastUsed?: Date
    createdAt: Date
    isActive: boolean
  } | null> {
    try {
      const keyData = await this.findClientKeyById(keyId)
      if (!keyData) return null

      return {
        usageCount: keyData.usageCount,
        lastUsed: keyData.lastUsed,
        createdAt: keyData.createdAt,
        isActive: keyData.isActive
      }
    } catch (error) {
      console.error('Error getting key usage stats:', error)
      return null
    }
  }

  // Métodos privados auxiliares

  private generateSecureKey(): string {
    return crypto.randomBytes(this.KEY_LENGTH).toString('hex')
  }

  private hashKey(key: string): string {
    return crypto.createHash('sha256').update(key).digest('hex')
  }

  private getDefaultClientPermissions(): ClientPermissions {
    return {
      canViewOrders: true,
      canViewPayments: true,
      canViewDocuments: true,
      canChat: true
    }
  }

  private async cleanupExpiredKeys(clientId: string): Promise<void> {
    try {
      const expiredKeys = await this.findExpiredKeysByClient(clientId)
      for (const keyData of expiredKeys) {
        await this.deactivateKey(keyData.id)
      }
    } catch (error) {
      console.error('Error cleaning up expired keys:', error)
    }
  }

  private async sendAccessKeyNotification(client: any, accessKey: ClientAccessKey): Promise<void> {
    try {
      const notificationData = {
        clientName: client.name,
        clientEmail: client.email,
        clientPhone: client.phone,
        accessKey: accessKey.key,
        expiresAt: accessKey.expiresAt,
        portalUrl: `${process.env.NEXT_PUBLIC_APP_URL}/portal/client?key=${accessKey.key}`
      }

      // Enviar por email
      if (client.email) {
        await this.sendEmailNotification(notificationData)
      }

      // Enviar por SMS se disponível
      if (client.phone && client.preferences?.smsNotifications) {
        await this.sendSMSNotification(notificationData)
      }

    } catch (error) {
      console.error('Error sending access key notification:', error)
      // Não falhar a geração da chave por erro de notificação
    }
  }

  private async sendEmailNotification(data: any): Promise<void> {
    // TODO: Implementar envio de email
    console.log('Sending email notification:', {
      to: data.clientEmail,
      subject: 'Sua chave de acesso ao portal InterAlpha',
      key: data.accessKey,
      url: data.portalUrl
    })
  }

  private async sendSMSNotification(data: any): Promise<void> {
    // TODO: Implementar envio de SMS
    console.log('Sending SMS notification:', {
      to: data.clientPhone,
      message: `Sua chave de acesso: ${data.accessKey}. Válida até ${data.expiresAt.toLocaleString()}`
    })
  }

  // Métodos de banco de dados (implementar com Prisma/SQL)

  private async saveClientKeyData(keyData: ClientKeyData): Promise<void> {
    // TODO: Implementar salvamento no banco
    console.log('Saving client key data:', keyData.id)
  }

  private async findClientKeyByHash(keyHash: string): Promise<ClientKeyData | null> {
    // TODO: Implementar busca no banco
    return null
  }

  private async findClientKeyById(keyId: string): Promise<ClientKeyData | null> {
    // TODO: Implementar busca no banco
    return null
  }

  private async findClientById(clientId: string): Promise<any> {
    // TODO: Implementar busca no banco
    return {
      id: clientId,
      name: 'Cliente Teste',
      email: 'cliente@teste.com',
      phone: '+5511999999999',
      preferences: { smsNotifications: true }
    }
  }

  private async countActiveKeys(clientId: string): Promise<number> {
    // TODO: Implementar contagem no banco
    return 0
  }

  private async findActiveKeysByClient(clientId: string): Promise<ClientKeyData[]> {
    // TODO: Implementar busca no banco
    return []
  }

  private async findExpiredKeysByClient(clientId: string): Promise<ClientKeyData[]> {
    // TODO: Implementar busca no banco
    return []
  }

  private async deactivateKey(keyId: string): Promise<void> {
    // TODO: Implementar desativação no banco
    console.log('Deactivating key:', keyId)
  }

  private async updateKeyUsage(keyId: string): Promise<void> {
    // TODO: Implementar atualização no banco
    console.log('Updating key usage:', keyId)
  }

  private async logKeyGeneration(clientId: string, generatedBy: string, keyId: string): Promise<void> {
    // TODO: Implementar log de auditoria
    console.log('Key generation log:', { clientId, generatedBy, keyId })
  }

  private async logKeyRevocation(clientId: string, revokedBy: string, keyId: string | null, notes?: string): Promise<void> {
    // TODO: Implementar log de auditoria
    console.log('Key revocation log:', { clientId, revokedBy, keyId, notes })
  }
  // Métodos para compatibilidade com APIs existentes
  async generateKey(clientId: string, generatedBy: string, options: GenerateKeyOptions = {}): Promise<ClientAccessKey> {
    return this.generateClientKey(clientId, generatedBy, options)
  }

  async validateKey(key: string, clientId?: string): Promise<ClientAccessKey | null> {
    return this.validateClientKey(key, clientId)
  }

  async markKeyAsUsed(keyId: string, metadata?: Partial<SessionMetadata>): Promise<void> {
    try {
      const keyData = await this.findClientKeyById(keyId)
      if (!keyData) {
        throw new Error('Chave não encontrada')
      }

      // Atualizar uso da chave
      await this.updateKeyUsage(keyId, {
        lastUsed: new Date(),
        usageCount: keyData.usageCount + 1,
        metadata: metadata ? { ...keyData.metadata, ...metadata } : keyData.metadata
      })
    } catch (error) {
      console.error('Error marking key as used:', error)
      throw error
    }
  }

  private async updateKeyUsage(keyId: string, updates: {
    lastUsed: Date
    usageCount: number
    metadata?: any
  }): Promise<void> {
    // Implementação específica do banco de dados
    // Esta seria a implementação real com Prisma
    console.log('Updating key usage:', keyId, updates)
  }
}

export const clientKeyService = new ClientKeyService()