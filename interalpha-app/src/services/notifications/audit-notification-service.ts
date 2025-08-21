import { SecurityEventEntry, AlertRule, ComplianceReport } from '@/types/audit'
import { notificationQueueService } from './notification-queue-service'
import { emailService } from './email-service'
import { smsService } from './sms-service'

interface NotificationRecipients {
  emails: string[]
  phones: string[]
  roles?: string[]
}

interface NotificationSettings {
  enableEmail: boolean
  enableSMS: boolean
  enableWhatsApp: boolean
  cooldownMinutes: number
  severityThreshold: 'low' | 'medium' | 'high' | 'critical'
}

export class AuditNotificationService {
  private defaultRecipients: NotificationRecipients
  private settings: NotificationSettings
  private lastNotificationTimes: Map<string, Date> = new Map()

  constructor() {
    this.defaultRecipients = {
      emails: [
        'admin@interalpha.com',
        'security@interalpha.com'
      ],
      phones: [
        '+5511999999999' // Número de exemplo
      ],
      roles: ['admin', 'security_manager']
    }

    this.settings = {
      enableEmail: true,
      enableSMS: true,
      enableWhatsApp: false,
      cooldownMinutes: 60,
      severityThreshold: 'medium'
    }
  }

  async sendSecurityEventNotification(
    event: SecurityEventEntry,
    customRecipients?: Partial<NotificationRecipients>
  ): Promise<boolean> {
    try {
      // Check if notification should be sent based on severity threshold
      if (!this.shouldSendNotification(event.severity, event.type)) {
        console.log(`Notification skipped for event ${event.id} - below threshold or in cooldown`)
        return false
      }

      // Get recipients
      const recipients = this.mergeRecipients(customRecipients)

      // Check cooldown period
      const cooldownKey = `${event.type}_${event.ipAddress}`
      if (this.isInCooldown(cooldownKey)) {
        console.log(`Notification skipped for event ${event.id} - in cooldown period`)
        return false
      }

      // Determine priority based on severity
      const priority = this.getPriorityFromSeverity(event.severity)

      // Add to notification queue
      const jobId = await notificationQueueService.addSecurityAlertJob(
        {
          emails: this.settings.enableEmail ? recipients.emails : undefined,
          phones: this.settings.enableSMS ? recipients.phones : undefined
        },
        event,
        undefined,
        priority
      )

      // Update cooldown
      this.updateCooldown(cooldownKey)

      console.log(`Security event notification queued: ${jobId}`)
      return true

    } catch (error) {
      console.error('Error sending security event notification:', error)
      return false
    }
  }

  async sendComplianceAlert(
    complianceReport: ComplianceReport,
    customRecipients?: Partial<NotificationRecipients>
  ): Promise<boolean> {
    try {
      const recipients = this.mergeRecipients(customRecipients)
      
      // Determine severity from findings
      const severity = this.getComplianceSeverity(complianceReport.findings)
      
      if (!this.shouldSendNotification(severity, 'compliance_alert')) {
        console.log(`Compliance notification skipped - below threshold`)
        return false
      }

      const priority = this.getPriorityFromSeverity(severity)

      const jobId = await notificationQueueService.addComplianceAlertJob(
        {
          emails: this.settings.enableEmail ? recipients.emails : undefined,
          phones: this.settings.enableSMS ? recipients.phones : undefined
        },
        complianceReport.type,
        complianceReport.findings,
        severity,
        priority
      )

      console.log(`Compliance alert notification queued: ${jobId}`)
      return true

    } catch (error) {
      console.error('Error sending compliance alert:', error)
      return false
    }
  }

  async sendAuditReportNotification(
    reportTitle: string,
    reportData: any,
    downloadUrl?: string,
    customRecipients?: Partial<NotificationRecipients>
  ): Promise<boolean> {
    try {
      const recipients = this.mergeRecipients(customRecipients)

      const jobId = await notificationQueueService.addAuditReportJob(
        {
          emails: this.settings.enableEmail ? recipients.emails : undefined,
          phones: reportData.critical && this.settings.enableSMS ? recipients.phones : undefined
        },
        reportTitle,
        reportData,
        downloadUrl,
        reportData.critical ? 'high' : 'normal'
      )

      console.log(`Audit report notification queued: ${jobId}`)
      return true

    } catch (error) {
      console.error('Error sending audit report notification:', error)
      return false
    }
  }

  async sendCriticalAlert(
    title: string,
    message: string,
    customRecipients?: Partial<NotificationRecipients>
  ): Promise<boolean> {
    try {
      const recipients = this.mergeRecipients(customRecipients)

      // For critical alerts, send immediately without queue
      const promises: Promise<boolean>[] = []

      if (this.settings.enableEmail && recipients.emails.length > 0) {
        // Create a mock security event for critical alert
        const mockEvent: SecurityEventEntry = {
          id: 'critical-' + Date.now(),
          type: 'CRITICAL_SYSTEM_ALERT',
          severity: 'critical',
          description: message,
          ipAddress: 'system',
          timestamp: new Date(),
          resolved: false,
          actions: []
        }

        promises.push(emailService.sendSecurityAlert(recipients.emails, mockEvent))
      }

      if (this.settings.enableSMS && recipients.phones.length > 0) {
        promises.push(smsService.sendCriticalAlert(recipients.phones, title, message, this.settings.enableWhatsApp))
      }

      const results = await Promise.all(promises)
      const success = results.some(result => result)

      console.log(`Critical alert sent: ${success}`)
      return success

    } catch (error) {
      console.error('Error sending critical alert:', error)
      return false
    }
  }

  async testNotifications(
    testRecipients?: Partial<NotificationRecipients>
  ): Promise<{ email: boolean; sms: boolean }> {
    try {
      const recipients = testRecipients ? this.mergeRecipients(testRecipients) : this.defaultRecipients
      const results = { email: false, sms: false }

      // Test email
      if (this.settings.enableEmail && recipients.emails.length > 0) {
        results.email = await emailService.testConnection()
        if (results.email) {
          await notificationQueueService.addTestNotificationJob(
            { emails: recipients.emails.slice(0, 1) }, // Test with first email only
            'Teste do sistema de notificações por email'
          )
        }
      }

      // Test SMS
      if (this.settings.enableSMS && recipients.phones.length > 0) {
        results.sms = await smsService.sendTestMessage(
          recipients.phones[0], // Test with first phone only
          this.settings.enableWhatsApp
        )
      }

      console.log('Notification test results:', results)
      return results

    } catch (error) {
      console.error('Error testing notifications:', error)
      return { email: false, sms: false }
    }
  }

  async updateSettings(newSettings: Partial<NotificationSettings>): Promise<void> {
    this.settings = { ...this.settings, ...newSettings }
    console.log('Notification settings updated:', this.settings)
  }

  async updateDefaultRecipients(newRecipients: Partial<NotificationRecipients>): Promise<void> {
    this.defaultRecipients = { ...this.defaultRecipients, ...newRecipients }
    console.log('Default recipients updated:', this.defaultRecipients)
  }

  getSettings(): NotificationSettings {
    return { ...this.settings }
  }

  getDefaultRecipients(): NotificationRecipients {
    return { ...this.defaultRecipients }
  }

  async getNotificationStats(): Promise<any> {
    const queueStats = await notificationQueueService.getQueueStats()
    
    return {
      queue: queueStats,
      settings: this.settings,
      recipients: {
        emailCount: this.defaultRecipients.emails.length,
        phoneCount: this.defaultRecipients.phones.length
      },
      services: {
        emailConfigured: await emailService.testConnection(),
        smsConfigured: smsService.isConfigured()
      }
    }
  }

  private shouldSendNotification(severity: string, eventType: string): boolean {
    // Check severity threshold
    const severityLevels = { low: 1, medium: 2, high: 3, critical: 4 }
    const eventSeverityLevel = severityLevels[severity as keyof typeof severityLevels] || 1
    const thresholdLevel = severityLevels[this.settings.severityThreshold]

    return eventSeverityLevel >= thresholdLevel
  }

  private isInCooldown(key: string): boolean {
    const lastNotification = this.lastNotificationTimes.get(key)
    if (!lastNotification) return false

    const cooldownMs = this.settings.cooldownMinutes * 60 * 1000
    return Date.now() - lastNotification.getTime() < cooldownMs
  }

  private updateCooldown(key: string): void {
    this.lastNotificationTimes.set(key, new Date())
  }

  private mergeRecipients(customRecipients?: Partial<NotificationRecipients>): NotificationRecipients {
    if (!customRecipients) return this.defaultRecipients

    return {
      emails: [...this.defaultRecipients.emails, ...(customRecipients.emails || [])],
      phones: [...this.defaultRecipients.phones, ...(customRecipients.phones || [])],
      roles: [...(this.defaultRecipients.roles || []), ...(customRecipients.roles || [])]
    }
  }

  private getPriorityFromSeverity(severity: string): 'low' | 'normal' | 'high' | 'critical' {
    switch (severity) {
      case 'critical': return 'critical'
      case 'high': return 'high'
      case 'medium': return 'normal'
      case 'low': return 'low'
      default: return 'normal'
    }
  }

  private getComplianceSeverity(findings: any[]): 'low' | 'medium' | 'high' | 'critical' {
    if (findings.some(f => f.severity === 'critical')) return 'critical'
    if (findings.some(f => f.severity === 'high')) return 'high'
    if (findings.some(f => f.severity === 'medium')) return 'medium'
    return 'low'
  }
}

export const auditNotificationService = new AuditNotificationService()