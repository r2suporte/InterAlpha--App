import twilio from 'twilio'
import { SecurityEventEntry } from '@/types/audit'

interface SMSConfig {
  accountSid: string
  authToken: string
  phoneNumber: string
  whatsappNumber?: string
}

export class SMSService {
  private client: twilio.Twilio | null = null
  private config: SMSConfig | null = null

  constructor() {
    this.initializeClient()
  }

  private initializeClient(): void {
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const phoneNumber = process.env.TWILIO_PHONE_NUMBER

    if (accountSid && authToken && phoneNumber) {
      this.config = {
        accountSid,
        authToken,
        phoneNumber,
        whatsappNumber: process.env.TWILIO_WHATSAPP_NUMBER
      }
      this.client = twilio(accountSid, authToken)
      console.log('SMS Service initialized successfully')
    } else {
      console.warn('SMS Service not initialized - missing Twilio credentials')
    }
  }

  async sendSecurityAlert(
    phoneNumbers: string[],
    event: SecurityEventEntry,
    useWhatsApp: boolean = false
  ): Promise<boolean> {
    if (!this.client || !this.config) {
      console.error('SMS Service not initialized')
      return false
    }

    try {
      const message = this.generateSecurityAlertMessage(event)
      const fromNumber = useWhatsApp && this.config.whatsappNumber 
        ? this.config.whatsappNumber 
        : this.config.phoneNumber

      const promises = phoneNumbers.map(async (phoneNumber) => {
        try {
          const result = await this.client!.messages.create({
            body: message,
            from: fromNumber,
            to: useWhatsApp ? `whatsapp:${phoneNumber}` : phoneNumber
          })
          
          console.log(`SMS sent to ${phoneNumber}:`, result.sid)
          return true
        } catch (error) {
          console.error(`Error sending SMS to ${phoneNumber}:`, error)
          return false
        }
      })

      const results = await Promise.all(promises)
      return results.some(result => result) // Return true if at least one SMS was sent

    } catch (error) {
      console.error('Error sending security alert SMS:', error)
      return false
    }
  }

  async sendCriticalAlert(
    phoneNumbers: string[],
    title: string,
    message: string,
    useWhatsApp: boolean = false
  ): Promise<boolean> {
    if (!this.client || !this.config) {
      console.error('SMS Service not initialized')
      return false
    }

    try {
      const fullMessage = `🚨 CRÍTICO - InterAlpha\n\n${title}\n\n${message}\n\nAcesse: ${process.env.NEXTAUTH_URL}/auditoria`
      const fromNumber = useWhatsApp && this.config.whatsappNumber 
        ? this.config.whatsappNumber 
        : this.config.phoneNumber

      const promises = phoneNumbers.map(async (phoneNumber) => {
        try {
          const result = await this.client!.messages.create({
            body: fullMessage,
            from: fromNumber,
            to: useWhatsApp ? `whatsapp:${phoneNumber}` : phoneNumber
          })
          
          console.log(`Critical alert SMS sent to ${phoneNumber}:`, result.sid)
          return true
        } catch (error) {
          console.error(`Error sending critical alert SMS to ${phoneNumber}:`, error)
          return false
        }
      })

      const results = await Promise.all(promises)
      return results.some(result => result)

    } catch (error) {
      console.error('Error sending critical alert SMS:', error)
      return false
    }
  }

  async sendComplianceAlert(
    phoneNumbers: string[],
    complianceType: string,
    findingsCount: number,
    severity: 'low' | 'medium' | 'high' | 'critical',
    useWhatsApp: boolean = false
  ): Promise<boolean> {
    if (!this.client || !this.config) {
      console.error('SMS Service not initialized')
      return false
    }

    try {
      const severityEmoji = this.getSeverityEmoji(severity)
      const message = `${severityEmoji} Compliance ${complianceType.toUpperCase()}\n\n${findingsCount} não conformidade(s) detectada(s)\n\nSeveridade: ${this.getSeverityText(severity)}\n\nAcesse: ${process.env.NEXTAUTH_URL}/auditoria/relatorios`
      
      const fromNumber = useWhatsApp && this.config.whatsappNumber 
        ? this.config.whatsappNumber 
        : this.config.phoneNumber

      const promises = phoneNumbers.map(async (phoneNumber) => {
        try {
          const result = await this.client!.messages.create({
            body: message,
            from: fromNumber,
            to: useWhatsApp ? `whatsapp:${phoneNumber}` : phoneNumber
          })
          
          console.log(`Compliance alert SMS sent to ${phoneNumber}:`, result.sid)
          return true
        } catch (error) {
          console.error(`Error sending compliance alert SMS to ${phoneNumber}:`, error)
          return false
        }
      })

      const results = await Promise.all(promises)
      return results.some(result => result)

    } catch (error) {
      console.error('Error sending compliance alert SMS:', error)
      return false
    }
  }

  async sendTestMessage(phoneNumber: string, useWhatsApp: boolean = false): Promise<boolean> {
    if (!this.client || !this.config) {
      console.error('SMS Service not initialized')
      return false
    }

    try {
      const message = `🧪 Teste do Sistema de Notificações InterAlpha\n\nEsta é uma mensagem de teste para verificar se as notificações estão funcionando corretamente.\n\nData: ${new Date().toLocaleString('pt-BR')}`
      
      const fromNumber = useWhatsApp && this.config.whatsappNumber 
        ? this.config.whatsappNumber 
        : this.config.phoneNumber

      const result = await this.client.messages.create({
        body: message,
        from: fromNumber,
        to: useWhatsApp ? `whatsapp:${phoneNumber}` : phoneNumber
      })

      console.log(`Test SMS sent to ${phoneNumber}:`, result.sid)
      return true

    } catch (error) {
      console.error(`Error sending test SMS to ${phoneNumber}:`, error)
      return false
    }
  }

  async getAccountInfo(): Promise<any> {
    if (!this.client) {
      return null
    }

    try {
      const account = await this.client.api.accounts(this.config!.accountSid).fetch()
      return {
        friendlyName: account.friendlyName,
        status: account.status,
        type: account.type
      }
    } catch (error) {
      console.error('Error fetching Twilio account info:', error)
      return null
    }
  }

  async sendSMS(options: {
    to: string
    message: string
  }): Promise<boolean> {
    if (!this.client || !this.config) {
      console.error('SMS Service not initialized')
      return false
    }

    try {
      const result = await this.client.messages.create({
        body: options.message,
        from: this.config.phoneNumber,
        to: options.to
      })

      console.log(`SMS sent to ${options.to}:`, result.sid)
      return true
    } catch (error) {
      console.error(`Error sending SMS to ${options.to}:`, error)
      return false
    }
  }

  isConfigured(): boolean {
    return this.client !== null && this.config !== null
  }

  private generateSecurityAlertMessage(event: SecurityEventEntry): string {
    const severityEmoji = this.getSeverityEmoji(event.severity)
    const eventDescription = this.getEventTypeDescription(event.type)
    
    let message = `${severityEmoji} ALERTA DE SEGURANÇA\n\n`
    message += `Tipo: ${eventDescription}\n`
    message += `Severidade: ${this.getSeverityText(event.severity)}\n`
    message += `IP: ${event.ipAddress}\n`
    
    if (event.userId) {
      message += `Usuário: ${event.userId}\n`
    }
    
    message += `\n${event.description}\n`
    message += `\nHora: ${event.timestamp.toLocaleString('pt-BR')}\n`
    message += `\nAcesse: ${process.env.NEXTAUTH_URL}/auditoria/seguranca`

    // Limit message length for SMS (160 characters for single SMS, 1600 for concatenated)
    if (message.length > 1500) {
      message = message.substring(0, 1450) + '...\n\nVer mais: ' + process.env.NEXTAUTH_URL + '/auditoria'
    }

    return message
  }

  private getSeverityEmoji(severity: string): string {
    switch (severity) {
      case 'critical': return '🔴'
      case 'high': return '🟠'
      case 'medium': return '🟡'
      case 'low': return '🟢'
      default: return '⚪'
    }
  }

  private getSeverityText(severity: string): string {
    switch (severity) {
      case 'critical': return 'Crítica'
      case 'high': return 'Alta'
      case 'medium': return 'Média'
      case 'low': return 'Baixa'
      default: return 'Desconhecida'
    }
  }

  private getEventTypeDescription(type: string): string {
    const descriptions: Record<string, string> = {
      'SUSPICIOUS_LOGIN': 'Login Suspeito',
      'MULTIPLE_FAILED_ATTEMPTS': 'Múltiplas Tentativas Falhadas',
      'UNUSUAL_ACCESS_PATTERN': 'Acesso Incomum',
      'PRIVILEGE_ESCALATION_ATTEMPT': 'Escalação de Privilégios',
      'DATA_BREACH_ATTEMPT': 'Tentativa de Violação',
      'UNAUTHORIZED_API_ACCESS': 'Acesso Não Autorizado',
      'MALICIOUS_REQUEST': 'Requisição Maliciosa',
      'ACCOUNT_TAKEOVER_ATTEMPT': 'Sequestro de Conta',
      'BRUTE_FORCE_ATTACK': 'Força Bruta',
      'SQL_INJECTION_ATTEMPT': 'Injeção SQL'
    }
    return descriptions[type] || type
  }
}

export const smsService = new SMSService()