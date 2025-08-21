import { Queue, Worker, Job } from 'bullmq'
import IORedis from 'ioredis'
import { emailService } from './email-service'
import { smsService } from './sms-service'
import { SecurityEventEntry } from '@/types/audit'

interface NotificationJob {
  type: 'security_alert' | 'audit_report' | 'compliance_alert' | 'test_notification'
  recipients: {
    emails?: string[]
    phones?: string[]
  }
  data: any
  priority?: 'low' | 'normal' | 'high' | 'critical'
  delay?: number
}

interface SecurityAlertJobData {
  event: SecurityEventEntry
  additionalContext?: any
}

interface AuditReportJobData {
  reportTitle: string
  reportData: any
  downloadUrl?: string
}

interface ComplianceAlertJobData {
  complianceType: string
  findings: any[]
  severity: 'low' | 'medium' | 'high' | 'critical'
}

interface TestNotificationJobData {
  message: string
  useWhatsApp?: boolean
}

export class NotificationQueueService {
  private redis: IORedis
  private notificationQueue: Queue
  private worker: Worker

  constructor() {
    this.redis = new IORedis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      maxRetriesPerRequest: null,
      retryDelayOnFailover: 100,
      lazyConnect: true
    })

    this.notificationQueue = new Queue('notifications', {
      connection: this.redis,
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    })

    this.worker = new Worker(
      'notifications',
      this.processNotificationJob.bind(this),
      {
        connection: this.redis,
        concurrency: 5,
      }
    )

    this.setupEventListeners()
  }

  private setupEventListeners(): void {
    this.worker.on('completed', (job: Job) => {
      console.log(`Notification job ${job.id} completed successfully`)
    })

    this.worker.on('failed', (job: Job | undefined, err: Error) => {
      console.error(`Notification job ${job?.id} failed:`, err.message)
    })

    this.worker.on('error', (err: Error) => {
      console.error('Notification worker error:', err)
    })

    this.redis.on('connect', () => {
      console.log('Connected to Redis for notifications')
    })

    this.redis.on('error', (err) => {
      console.error('Redis connection error:', err)
    })
  }

  async addSecurityAlertJob(
    recipients: { emails?: string[]; phones?: string[] },
    event: SecurityEventEntry,
    additionalContext?: any,
    priority: 'low' | 'normal' | 'high' | 'critical' = 'high'
  ): Promise<string> {
    const jobData: NotificationJob = {
      type: 'security_alert',
      recipients,
      data: { event, additionalContext } as SecurityAlertJobData,
      priority
    }

    const job = await this.notificationQueue.add(
      'security_alert',
      jobData,
      {
        priority: this.getPriorityValue(priority),
        delay: priority === 'critical' ? 0 : 1000, // Critical alerts sent immediately
      }
    )

    return job.id!
  }

  async addAuditReportJob(
    recipients: { emails?: string[]; phones?: string[] },
    reportTitle: string,
    reportData: any,
    downloadUrl?: string,
    priority: 'low' | 'normal' | 'high' | 'critical' = 'normal'
  ): Promise<string> {
    const jobData: NotificationJob = {
      type: 'audit_report',
      recipients,
      data: { reportTitle, reportData, downloadUrl } as AuditReportJobData,
      priority
    }

    const job = await this.notificationQueue.add(
      'audit_report',
      jobData,
      {
        priority: this.getPriorityValue(priority),
        delay: 5000, // Small delay for report notifications
      }
    )

    return job.id!
  }

  async addComplianceAlertJob(
    recipients: { emails?: string[]; phones?: string[] },
    complianceType: string,
    findings: any[],
    severity: 'low' | 'medium' | 'high' | 'critical',
    priority: 'low' | 'normal' | 'high' | 'critical' = 'high'
  ): Promise<string> {
    const jobData: NotificationJob = {
      type: 'compliance_alert',
      recipients,
      data: { complianceType, findings, severity } as ComplianceAlertJobData,
      priority
    }

    const job = await this.notificationQueue.add(
      'compliance_alert',
      jobData,
      {
        priority: this.getPriorityValue(priority),
        delay: severity === 'critical' ? 0 : 2000,
      }
    )

    return job.id!
  }

  async addTestNotificationJob(
    recipients: { emails?: string[]; phones?: string[] },
    message: string,
    useWhatsApp: boolean = false
  ): Promise<string> {
    const jobData: NotificationJob = {
      type: 'test_notification',
      recipients,
      data: { message, useWhatsApp } as TestNotificationJobData,
      priority: 'low'
    }

    const job = await this.notificationQueue.add(
      'test_notification',
      jobData,
      {
        priority: this.getPriorityValue('low'),
      }
    )

    return job.id!
  }

  private async processNotificationJob(job: Job<NotificationJob>): Promise<void> {
    const { type, recipients, data } = job.data

    console.log(`Processing notification job: ${type} (ID: ${job.id})`)

    try {
      switch (type) {
        case 'security_alert':
          await this.processSecurityAlert(recipients, data as SecurityAlertJobData)
          break

        case 'audit_report':
          await this.processAuditReport(recipients, data as AuditReportJobData)
          break

        case 'compliance_alert':
          await this.processComplianceAlert(recipients, data as ComplianceAlertJobData)
          break

        case 'test_notification':
          await this.processTestNotification(recipients, data as TestNotificationJobData)
          break

        default:
          throw new Error(`Unknown notification type: ${type}`)
      }

      console.log(`Notification job ${job.id} processed successfully`)

    } catch (error) {
      console.error(`Error processing notification job ${job.id}:`, error)
      throw error
    }
  }

  private async processSecurityAlert(
    recipients: { emails?: string[]; phones?: string[] },
    data: SecurityAlertJobData
  ): Promise<void> {
    const promises: Promise<boolean>[] = []

    // Send emails
    if (recipients.emails && recipients.emails.length > 0) {
      promises.push(
        emailService.sendSecurityAlert(recipients.emails, data.event, data.additionalContext)
      )
    }

    // Send SMS
    if (recipients.phones && recipients.phones.length > 0) {
      promises.push(
        smsService.sendSecurityAlert(recipients.phones, data.event, false)
      )
    }

    const results = await Promise.all(promises)
    
    if (!results.some(result => result)) {
      throw new Error('All notification attempts failed')
    }
  }

  private async processAuditReport(
    recipients: { emails?: string[]; phones?: string[] },
    data: AuditReportJobData
  ): Promise<void> {
    const promises: Promise<boolean>[] = []

    // Send emails (reports are typically sent via email only)
    if (recipients.emails && recipients.emails.length > 0) {
      promises.push(
        emailService.sendAuditReport(
          recipients.emails,
          data.reportTitle,
          data.reportData,
          data.downloadUrl
        )
      )
    }

    // For critical reports, also send SMS notification
    if (recipients.phones && recipients.phones.length > 0 && data.reportData.critical) {
      promises.push(
        smsService.sendCriticalAlert(
          recipients.phones,
          'Relatório Crítico Disponível',
          `Relatório: ${data.reportTitle}\nVerifique seu email para detalhes.`,
          false
        )
      )
    }

    const results = await Promise.all(promises)
    
    if (!results.some(result => result)) {
      throw new Error('All notification attempts failed')
    }
  }

  private async processComplianceAlert(
    recipients: { emails?: string[]; phones?: string[] },
    data: ComplianceAlertJobData
  ): Promise<void> {
    const promises: Promise<boolean>[] = []

    // Send emails
    if (recipients.emails && recipients.emails.length > 0) {
      promises.push(
        emailService.sendComplianceAlert(
          recipients.emails,
          data.complianceType,
          data.findings,
          data.severity
        )
      )
    }

    // Send SMS for high/critical compliance issues
    if (recipients.phones && recipients.phones.length > 0 && 
        (data.severity === 'high' || data.severity === 'critical')) {
      promises.push(
        smsService.sendComplianceAlert(
          recipients.phones,
          data.complianceType,
          data.findings.length,
          data.severity,
          false
        )
      )
    }

    const results = await Promise.all(promises)
    
    if (!results.some(result => result)) {
      throw new Error('All notification attempts failed')
    }
  }

  private async processTestNotification(
    recipients: { emails?: string[]; phones?: string[] },
    data: TestNotificationJobData
  ): Promise<void> {
    const promises: Promise<boolean>[] = []

    // Send test emails
    if (recipients.emails && recipients.emails.length > 0) {
      const testEmailPromises = recipients.emails.map(email =>
        emailService.sendSecurityAlert(
          [email],
          {
            id: 'test-' + Date.now(),
            type: 'SUSPICIOUS_LOGIN',
            severity: 'medium',
            description: `Teste de notificação: ${data.message}`,
            ipAddress: '127.0.0.1',
            timestamp: new Date(),
            resolved: false,
            actions: []
          } as SecurityEventEntry
        )
      )
      promises.push(...testEmailPromises)
    }

    // Send test SMS
    if (recipients.phones && recipients.phones.length > 0) {
      const testSMSPromises = recipients.phones.map(phone =>
        smsService.sendTestMessage(phone, data.useWhatsApp)
      )
      promises.push(...testSMSPromises)
    }

    const results = await Promise.all(promises)
    
    if (!results.some(result => result)) {
      throw new Error('All test notification attempts failed')
    }
  }

  private getPriorityValue(priority: 'low' | 'normal' | 'high' | 'critical'): number {
    switch (priority) {
      case 'critical': return 1
      case 'high': return 2
      case 'normal': return 3
      case 'low': return 4
      default: return 3
    }
  }

  async getQueueStats(): Promise<any> {
    const waiting = await this.notificationQueue.getWaiting()
    const active = await this.notificationQueue.getActive()
    const completed = await this.notificationQueue.getCompleted()
    const failed = await this.notificationQueue.getFailed()

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      total: waiting.length + active.length + completed.length + failed.length
    }
  }

  async clearQueue(): Promise<void> {
    await this.notificationQueue.obliterate({ force: true })
    console.log('Notification queue cleared')
  }

  async close(): Promise<void> {
    await this.worker.close()
    await this.notificationQueue.close()
    await this.redis.quit()
    console.log('Notification queue service closed')
  }
}

export const notificationQueueService = new NotificationQueueService()