import crypto from 'crypto'
import { auditDatabaseService } from './audit-database-service'
import { 
  AuditEntry, 
  AccessLogEntry, 
  SecurityEventEntry, 
  SecurityEventType, 
  SecuritySeverity,
  AuditFilters,
  AccessLogFilters,
  SecurityEventFilters,
  AuditReport,
  AuditSummary,
  SecurityAction,
  ComplianceType,
  ComplianceReport,
  ComplianceFinding,
  AlertRule,
  DataRetentionPolicy
} from '@/types/audit'

export class AuditService {
  
  // ==================== AUDIT LOGS ====================
  
  async logAction(
    userId: string,
    userType: 'client' | 'employee',
    action: string,
    resource: string,
    options: {
      resourceId?: string
      oldData?: any
      newData?: any
      result?: 'success' | 'failure'
      reason?: string
      ipAddress: string
      userAgent: string
      sessionId?: string
      metadata?: any
    }
  ): Promise<AuditEntry> {
    try {
      const entry: AuditEntry = {
        id: crypto.randomUUID(),
        userId,
        userType,
        action,
        resource,
        resourceId: options.resourceId,
        oldData: options.oldData,
        newData: options.newData,
        result: options.result || 'success',
        reason: options.reason,
        timestamp: new Date(),
        ipAddress: options.ipAddress,
        userAgent: options.userAgent,
        sessionId: options.sessionId,
        metadata: options.metadata
      }

      await this.saveAuditEntry(entry)

      // Verificar se precisa disparar alertas
      await this.checkAlertRules(entry)

      return entry

    } catch (error) {
      console.error('Error logging audit action:', error)
      throw error
    }
  }

  async getAuditLogs(filters: AuditFilters): Promise<{
    entries: AuditEntry[]
    total: number
    page: number
    totalPages: number
  }> {
    try {
      const page = filters.page || 1
      const limit = filters.limit || 50
      const offset = (page - 1) * limit

      const { entries, total } = await this.findAuditEntries(filters, limit, offset)
      const totalPages = Math.ceil(total / limit)

      return {
        entries,
        total,
        page,
        totalPages
      }

    } catch (error) {
      console.error('Error getting audit logs:', error)
      throw error
    }
  }

  // ==================== ACCESS LOGS ====================

  async logAccess(
    userId: string,
    userType: 'client' | 'employee',
    action: 'login' | 'logout' | 'access_denied' | 'session_expired',
    options: {
      ipAddress: string
      userAgent: string
      location?: string
      success: boolean
      failureReason?: string
      sessionDuration?: number
      metadata?: any
    }
  ): Promise<AccessLogEntry> {
    try {
      const entry: AccessLogEntry = {
        id: crypto.randomUUID(),
        userId,
        userType,
        action,
        ipAddress: options.ipAddress,
        userAgent: options.userAgent,
        location: options.location,
        success: options.success,
        failureReason: options.failureReason,
        timestamp: new Date(),
        sessionDuration: options.sessionDuration,
        metadata: options.metadata
      }

      await this.saveAccessLogEntry(entry)

      // Detectar padrões suspeitos
      if (!options.success) {
        await this.detectSuspiciousActivity(entry)
      }

      return entry

    } catch (error) {
      console.error('Error logging access:', error)
      throw error
    }
  }

  async getAccessLogs(filters: AccessLogFilters): Promise<{
    entries: AccessLogEntry[]
    total: number
    page: number
    totalPages: number
  }> {
    try {
      const page = filters.page || 1
      const limit = filters.limit || 50
      const offset = (page - 1) * limit

      const { entries, total } = await this.findAccessLogEntries(filters, limit, offset)
      const totalPages = Math.ceil(total / limit)

      return {
        entries,
        total,
        page,
        totalPages
      }

    } catch (error) {
      console.error('Error getting access logs:', error)
      throw error
    }
  }

  // ==================== SECURITY EVENTS ====================

  async logSecurityEvent(
    type: SecurityEventType,
    severity: SecuritySeverity,
    description: string,
    options: {
      userId?: string
      ipAddress: string
      userAgent?: string
      details: any
      autoResolve?: boolean
    }
  ): Promise<SecurityEventEntry> {
    try {
      const actions: SecurityAction[] = []

      // Ações automáticas baseadas na severidade
      if (severity === SecuritySeverity.CRITICAL) {
        actions.push({
          action: 'alert_administrators',
          timestamp: new Date(),
          automated: true,
          details: { method: 'email_sms' }
        })
      }

      if (type === SecurityEventType.BRUTE_FORCE_ATTACK && options.userId) {
        actions.push({
          action: 'temporary_account_lock',
          timestamp: new Date(),
          automated: true,
          details: { duration: '30_minutes' }
        })
      }

      const entry: SecurityEventEntry = {
        id: crypto.randomUUID(),
        type,
        severity,
        userId: options.userId,
        ipAddress: options.ipAddress,
        userAgent: options.userAgent,
        description,
        details: options.details,
        timestamp: new Date(),
        resolved: options.autoResolve || false,
        actions
      }

      await this.saveSecurityEventEntry(entry)

      // Executar ações automáticas
      await this.executeSecurityActions(entry, actions)

      return entry

    } catch (error) {
      console.error('Error logging security event:', error)
      throw error
    }
  }

  async getSecurityEvents(filters: SecurityEventFilters): Promise<{
    entries: SecurityEventEntry[]
    total: number
    page: number
    totalPages: number
  }> {
    try {
      const page = filters.page || 1
      const limit = filters.limit || 50
      const offset = (page - 1) * limit

      const { entries, total } = await this.findSecurityEventEntries(filters, limit, offset)
      const totalPages = Math.ceil(total / limit)

      return {
        entries,
        total,
        page,
        totalPages
      }

    } catch (error) {
      console.error('Error getting security events:', error)
      throw error
    }
  }

  async resolveSecurityEvent(
    eventId: string,
    resolvedBy: string,
    resolution?: string
  ): Promise<boolean> {
    try {
      await this.updateSecurityEventResolution(eventId, resolvedBy, resolution)
      
      // Log da resolução
      await this.logAction(
        resolvedBy,
        'employee',
        'resolve_security_event',
        'security_events',
        {
          resourceId: eventId,
          ipAddress: '',
          userAgent: '',
          metadata: { resolution }
        }
      )

      return true

    } catch (error) {
      console.error('Error resolving security event:', error)
      return false
    }
  }

  // ==================== RELATÓRIOS DE AUDITORIA ====================

  async generateAuditReport(
    title: string,
    description: string,
    filters: AuditFilters,
    generatedBy: string,
    format: 'json' | 'csv' | 'pdf' = 'json'
  ): Promise<AuditReport> {
    try {
      const reportId = crypto.randomUUID()
      
      // Obter dados do relatório
      const { entries } = await this.getAuditLogs({ ...filters, limit: 10000 })
      
      // Gerar resumo
      const summary = await this.generateAuditSummary(entries)

      const report: AuditReport = {
        id: reportId,
        title,
        description,
        generatedBy,
        generatedAt: new Date(),
        period: {
          startDate: filters.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate: filters.endDate || new Date()
        },
        filters,
        summary,
        data: entries,
        format
      }

      // Salvar relatório
      await this.saveAuditReport(report)

      // Gerar arquivo se necessário
      if (format !== 'json') {
        report.downloadUrl = await this.generateReportFile(report)
      }

      return report

    } catch (error) {
      console.error('Error generating audit report:', error)
      throw error
    }
  }

  private async generateAuditSummary(entries: AuditEntry[]): Promise<AuditSummary> {
    const summary: AuditSummary = {
      totalEntries: entries.length,
      successfulActions: entries.filter(e => e.result === 'success').length,
      failedActions: entries.filter(e => e.result === 'failure').length,
      uniqueUsers: new Set(entries.map(e => e.userId)).size,
      topActions: [],
      topResources: [],
      securityEvents: 0,
      criticalEvents: 0
    }

    // Calcular top actions
    const actionCounts = entries.reduce((acc, entry) => {
      acc[entry.action] = (acc[entry.action] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    summary.topActions = Object.entries(actionCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([action, count]) => ({ action, count }))

    // Calcular top resources
    const resourceCounts = entries.reduce((acc, entry) => {
      acc[entry.resource] = (acc[entry.resource] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    summary.topResources = Object.entries(resourceCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([resource, count]) => ({ resource, count }))

    // Contar eventos de segurança (implementar busca)
    const securityEvents = await this.countSecurityEvents({
      startDate: new Date(Math.min(...entries.map(e => e.timestamp.getTime()))),
      endDate: new Date(Math.max(...entries.map(e => e.timestamp.getTime())))
    })

    summary.securityEvents = securityEvents.total
    summary.criticalEvents = securityEvents.critical

    return summary
  }

  // ==================== DETECÇÃO DE ATIVIDADES SUSPEITAS ====================

  private async detectSuspiciousActivity(entry: AccessLogEntry): Promise<void> {
    try {
      // Detectar múltiplas tentativas de login falhadas
      const recentFailures = await this.countRecentFailedLogins(entry.userId, entry.ipAddress, 15) // 15 minutos

      if (recentFailures >= 5) {
        await this.logSecurityEvent(
          SecurityEventType.MULTIPLE_FAILED_ATTEMPTS,
          SecuritySeverity.HIGH,
          `${recentFailures} tentativas de login falhadas em 15 minutos`,
          {
            userId: entry.userId,
            ipAddress: entry.ipAddress,
            userAgent: entry.userAgent,
            details: {
              failureCount: recentFailures,
              timeWindow: '15_minutes',
              lastAttempt: entry.timestamp
            }
          }
        )
      }

      // Detectar login de localização incomum
      const isUnusualLocation = await this.isUnusualLocation(entry.userId, entry.location)
      if (isUnusualLocation && entry.location) {
        await this.logSecurityEvent(
          SecurityEventType.UNUSUAL_ACCESS_PATTERN,
          SecuritySeverity.MEDIUM,
          `Login de localização incomum: ${entry.location}`,
          {
            userId: entry.userId,
            ipAddress: entry.ipAddress,
            userAgent: entry.userAgent,
            details: {
              location: entry.location,
              previousLocations: await this.getUserPreviousLocations(entry.userId)
            }
          }
        )
      }

      // Detectar horário de acesso incomum
      const isUnusualTime = await this.isUnusualAccessTime(entry.userId, entry.timestamp)
      if (isUnusualTime) {
        await this.logSecurityEvent(
          SecurityEventType.UNUSUAL_ACCESS_PATTERN,
          SecuritySeverity.LOW,
          `Acesso em horário incomum: ${entry.timestamp.toLocaleTimeString()}`,
          {
            userId: entry.userId,
            ipAddress: entry.ipAddress,
            userAgent: entry.userAgent,
            details: {
              accessTime: entry.timestamp,
              usualAccessHours: await this.getUserUsualAccessHours(entry.userId)
            }
          }
        )
      }

    } catch (error) {
      console.error('Error detecting suspicious activity:', error)
    }
  }

  private async executeSecurityActions(event: SecurityEventEntry, actions: SecurityAction[]): Promise<void> {
    for (const action of actions) {
      try {
        switch (action.action) {
          case 'alert_administrators':
            await this.alertAdministrators(event)
            break
          
          case 'temporary_account_lock':
            if (event.userId) {
              await this.temporaryAccountLock(event.userId, action.details.duration)
            }
            break
          
          case 'require_2fa':
            if (event.userId) {
              await this.require2FA(event.userId)
            }
            break
          
          case 'block_ip':
            await this.blockIP(event.ipAddress, action.details.duration)
            break
        }
      } catch (error) {
        console.error(`Error executing security action ${action.action}:`, error)
      }
    }
  }

  private async checkAlertRules(entry: AuditEntry): Promise<void> {
    // TODO: Implementar verificação de regras de alerta
    console.log('Checking alert rules for entry:', entry.id)
  }

  // ==================== RELATÓRIOS E EXPORTAÇÃO ====================

  async getAuditReports(filters: any): Promise<{
    reports: AuditReport[]
    total: number
    page: number
    totalPages: number
  }> {
    try {
      const page = filters.page || 1
      const limit = filters.limit || 20
      const offset = (page - 1) * limit

      const { reports, total } = await this.findAuditReports(filters, limit, offset)
      const totalPages = Math.ceil(total / limit)

      return {
        reports,
        total,
        page,
        totalPages
      }

    } catch (error) {
      console.error('Error getting audit reports:', error)
      throw error
    }
  }

  async getAuditReport(reportId: string): Promise<AuditReport | null> {
    try {
      return await this.findAuditReportById(reportId)
    } catch (error) {
      console.error('Error getting audit report:', error)
      throw error
    }
  }

  async deleteAuditReport(reportId: string, userId: string): Promise<boolean> {
    try {
      const report = await this.findAuditReportById(reportId)
      if (!report || report.generatedBy !== userId) {
        return false
      }

      await this.removeAuditReport(reportId)
      return true

    } catch (error) {
      console.error('Error deleting audit report:', error)
      return false
    }
  }

  // ==================== COMPLIANCE ====================

  async generateComplianceReport(
    type: ComplianceType,
    period: { startDate: Date; endDate: Date },
    generatedBy: string,
    options: { includeRecommendations?: boolean } = {}
  ): Promise<ComplianceReport> {
    try {
      const reportId = crypto.randomUUID()
      
      // Obter dados relevantes para compliance
      const auditData = await this.getAuditLogs({
        startDate: period.startDate,
        endDate: period.endDate,
        limit: 10000
      })

      const securityEvents = await this.getSecurityEvents({
        startDate: period.startDate,
        endDate: period.endDate,
        limit: 10000
      })

      // Analisar compliance baseado no tipo
      const findings = await this.analyzeCompliance(type, auditData.entries, securityEvents.entries)
      
      const status = this.determineComplianceStatus(findings)
      const recommendations = options.includeRecommendations 
        ? await this.generateComplianceRecommendations(type, findings)
        : []

      const report: ComplianceReport = {
        id: reportId,
        type,
        period,
        generatedBy,
        generatedAt: new Date(),
        status,
        findings,
        recommendations
      }

      await this.saveComplianceReport(report)

      return report

    } catch (error) {
      console.error('Error generating compliance report:', error)
      throw error
    }
  }

  async getComplianceReports(filters: any): Promise<{
    reports: ComplianceReport[]
    total: number
    page: number
    totalPages: number
  }> {
    try {
      const page = filters.page || 1
      const limit = filters.limit || 20
      const offset = (page - 1) * limit

      const { reports, total } = await this.findComplianceReports(filters, limit, offset)
      const totalPages = Math.ceil(total / limit)

      return {
        reports,
        total,
        page,
        totalPages
      }

    } catch (error) {
      console.error('Error getting compliance reports:', error)
      throw error
    }
  }

  // ==================== REGRAS DE ALERTA ====================

  async createAlertRule(ruleData: Omit<AlertRule, 'id' | 'createdAt' | 'lastTriggered' | 'triggerCount'>): Promise<AlertRule> {
    try {
      const rule: AlertRule = {
        id: crypto.randomUUID(),
        ...ruleData,
        createdAt: new Date(),
        triggerCount: 0
      }

      await this.saveAlertRule(rule)
      return rule

    } catch (error) {
      console.error('Error creating alert rule:', error)
      throw error
    }
  }

  async getAlertRules(filters: any): Promise<{
    rules: AlertRule[]
    total: number
    page: number
    totalPages: number
  }> {
    try {
      const page = filters.page || 1
      const limit = filters.limit || 20
      const offset = (page - 1) * limit

      const { rules, total } = await this.findAlertRules(filters, limit, offset)
      const totalPages = Math.ceil(total / limit)

      return {
        rules,
        total,
        page,
        totalPages
      }

    } catch (error) {
      console.error('Error getting alert rules:', error)
      throw error
    }
  }

  async getAlertRule(ruleId: string): Promise<AlertRule | null> {
    try {
      return await this.findAlertRuleById(ruleId)
    } catch (error) {
      console.error('Error getting alert rule:', error)
      throw error
    }
  }

  async updateAlertRule(ruleId: string, updates: Partial<AlertRule>): Promise<AlertRule | null> {
    try {
      const rule = await this.findAlertRuleById(ruleId)
      if (!rule) return null

      const updatedRule = { ...rule, ...updates }
      await this.saveAlertRule(updatedRule)
      
      return updatedRule

    } catch (error) {
      console.error('Error updating alert rule:', error)
      throw error
    }
  }

  async deleteAlertRule(ruleId: string): Promise<boolean> {
    try {
      const rule = await this.findAlertRuleById(ruleId)
      if (!rule) return false

      await this.removeAlertRule(ruleId)
      return true

    } catch (error) {
      console.error('Error deleting alert rule:', error)
      return false
    }
  }

  async testAlertRule(ruleId: string, testData: any): Promise<any> {
    try {
      const rule = await this.findAlertRuleById(ruleId)
      if (!rule) return null

      const result = await this.evaluateAlertConditions(rule.conditions, testData)
      
      return {
        ruleId,
        testData,
        conditionsMatched: result.matched,
        matchedConditions: result.details,
        wouldTrigger: result.matched
      }

    } catch (error) {
      console.error('Error testing alert rule:', error)
      throw error
    }
  }

  // ==================== POLÍTICAS DE RETENÇÃO ====================

  async createRetentionPolicy(policyData: Omit<DataRetentionPolicy, 'id' | 'createdAt' | 'lastExecuted'>): Promise<DataRetentionPolicy> {
    try {
      const policy: DataRetentionPolicy = {
        id: crypto.randomUUID(),
        ...policyData,
        createdAt: new Date()
      }

      await this.saveRetentionPolicy(policy)
      return policy

    } catch (error) {
      console.error('Error creating retention policy:', error)
      throw error
    }
  }

  async getRetentionPolicies(filters: any): Promise<{
    policies: DataRetentionPolicy[]
    total: number
    page: number
    totalPages: number
  }> {
    try {
      const page = filters.page || 1
      const limit = filters.limit || 20
      const offset = (page - 1) * limit

      const { policies, total } = await this.findRetentionPolicies(filters, limit, offset)
      const totalPages = Math.ceil(total / limit)

      return {
        policies,
        total,
        page,
        totalPages
      }

    } catch (error) {
      console.error('Error getting retention policies:', error)
      throw error
    }
  }

  async getRetentionPolicy(policyId: string): Promise<DataRetentionPolicy | null> {
    try {
      return await this.findRetentionPolicyById(policyId)
    } catch (error) {
      console.error('Error getting retention policy:', error)
      throw error
    }
  }

  async updateRetentionPolicy(policyId: string, updates: Partial<DataRetentionPolicy>): Promise<DataRetentionPolicy | null> {
    try {
      const policy = await this.findRetentionPolicyById(policyId)
      if (!policy) return null

      const updatedPolicy = { ...policy, ...updates }
      await this.saveRetentionPolicy(updatedPolicy)
      
      return updatedPolicy

    } catch (error) {
      console.error('Error updating retention policy:', error)
      throw error
    }
  }

  async deleteRetentionPolicy(policyId: string): Promise<boolean> {
    try {
      const policy = await this.findRetentionPolicyById(policyId)
      if (!policy) return false

      await this.removeRetentionPolicy(policyId)
      return true

    } catch (error) {
      console.error('Error deleting retention policy:', error)
      return false
    }
  }

  async executeRetentionPolicy(policyId: string, options: { dryRun?: boolean; executedBy: string }): Promise<any> {
    try {
      const policy = await this.findRetentionPolicyById(policyId)
      if (!policy) return null

      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - policy.deleteAfterDays)

      const archiveDate = policy.archiveAfterDays 
        ? new Date(Date.now() - policy.archiveAfterDays * 24 * 60 * 60 * 1000)
        : null

      let result: any = {
        policyId,
        executedBy: options.executedBy,
        executedAt: new Date(),
        dryRun: options.dryRun || false,
        recordsToDelete: 0,
        recordsToArchive: 0,
        recordsDeleted: 0,
        recordsArchived: 0
      }

      // Contar registros que seriam afetados
      if (policy.dataType === 'audit_logs') {
        result.recordsToDelete = await this.countAuditEntriesOlderThan(cutoffDate)
        if (archiveDate) {
          result.recordsToArchive = await this.countAuditEntriesBetweenDates(archiveDate, cutoffDate)
        }
      } else if (policy.dataType === 'access_logs') {
        result.recordsToDelete = await this.countAccessLogsOlderThan(cutoffDate)
        if (archiveDate) {
          result.recordsToArchive = await this.countAccessLogsBetweenDates(archiveDate, cutoffDate)
        }
      } else if (policy.dataType === 'security_events') {
        result.recordsToDelete = await this.countSecurityEventsOlderThan(cutoffDate)
        if (archiveDate) {
          result.recordsToArchive = await this.countSecurityEventsBetweenDates(archiveDate, cutoffDate)
        }
      }

      // Executar se não for dry run
      if (!options.dryRun) {
        if (policy.dataType === 'audit_logs') {
          if (archiveDate) {
            result.recordsArchived = await this.archiveAuditEntriesBetweenDates(archiveDate, cutoffDate)
          }
          result.recordsDeleted = await this.deleteAuditEntriesOlderThan(cutoffDate)
        } else if (policy.dataType === 'access_logs') {
          if (archiveDate) {
            result.recordsArchived = await this.archiveAccessLogsBetweenDates(archiveDate, cutoffDate)
          }
          result.recordsDeleted = await this.deleteAccessLogsOlderThan(cutoffDate)
        } else if (policy.dataType === 'security_events') {
          if (archiveDate) {
            result.recordsArchived = await this.archiveSecurityEventsBetweenDates(archiveDate, cutoffDate)
          }
          result.recordsDeleted = await this.deleteSecurityEventsOlderThan(cutoffDate)
        }

        // Atualizar última execução
        await this.updateRetentionPolicyLastExecution(policyId, new Date())
      }

      return result

    } catch (error) {
      console.error('Error executing retention policy:', error)
      throw error
    }
  }

  // ==================== ESTATÍSTICAS ====================

  async getAuditStatistics(period: string, options: any = {}): Promise<any> {
    try {
      const { startDate, endDate } = this.parsePeriod(period)
      
      const stats = {
        period,
        startDate,
        endDate,
        auditLogs: await this.getAuditLogsStats(startDate, endDate, options),
        accessLogs: await this.getAccessLogsStats(startDate, endDate, options),
        securityEvents: await this.getSecurityEventsStats(startDate, endDate, options),
        topUsers: await this.getTopUsersStats(startDate, endDate, options),
        topActions: await this.getTopActionsStats(startDate, endDate, options),
        trends: options.includeDetails ? await this.getTrendsStats(startDate, endDate) : undefined
      }

      return stats

    } catch (error) {
      console.error('Error getting audit statistics:', error)
      throw error
    }
  }

  // ==================== EXPORTAÇÃO ====================

  async exportAuditData(options: {
    dataTypes: string[]
    format: string
    filters: any
    includeMetadata: boolean
    compression: boolean
    requestedBy: string
  }): Promise<any> {
    try {
      const exportId = crypto.randomUUID()
      
      const exportJob = {
        id: exportId,
        ...options,
        status: 'pending',
        createdAt: new Date(),
        progress: 0
      }

      await this.saveExportJob(exportJob)

      // Iniciar processamento em background
      this.processExportJob(exportId).catch(error => {
        console.error('Error processing export job:', error)
      })

      return {
        exportId,
        status: 'pending',
        message: 'Exportação iniciada. Use o ID para verificar o progresso.'
      }

    } catch (error) {
      console.error('Error starting export:', error)
      throw error
    }
  }

  async getExportStatus(filters: any): Promise<any> {
    try {
      const page = filters.page || 1
      const limit = filters.limit || 20
      const offset = (page - 1) * limit

      const { exports, total } = await this.findExportJobs(filters, limit, offset)
      const totalPages = Math.ceil(total / limit)

      return {
        exports,
        total,
        page,
        totalPages
      }

    } catch (error) {
      console.error('Error getting export status:', error)
      throw error
    }
  }

  async getExportData(exportId: string, userId: string): Promise<any> {
    try {
      const exportJob = await this.findExportJobById(exportId)
      
      if (!exportJob || exportJob.requestedBy !== userId) {
        return null
      }

      return exportJob

    } catch (error) {
      console.error('Error getting export data:', error)
      throw error
    }
  }

  async getExportFileStream(exportId: string): Promise<ReadableStream> {
    try {
      // TODO: Implementar stream do arquivo
      return new ReadableStream()
    } catch (error) {
      console.error('Error getting export file stream:', error)
      throw error
    }
  }

  // ==================== MÉTODOS AUXILIARES ====================

  private async countRecentFailedLogins(userId: string, ipAddress: string, minutes: number): Promise<number> {
    return await auditDatabaseService.countRecentFailedLogins(userId, ipAddress, minutes)
  }

  private async isUnusualLocation(userId: string, location?: string): Promise<boolean> {
    // TODO: Implementar verificação de localização
    return false
  }

  private async getUserPreviousLocations(userId: string): Promise<string[]> {
    return await auditDatabaseService.getUserPreviousLocations(userId)
  }

  private async isUnusualAccessTime(userId: string, timestamp: Date): Promise<boolean> {
    // TODO: Implementar verificação de horário
    const hour = timestamp.getHours()
    return hour < 6 || hour > 22 // Fora do horário comercial
  }

  private async getUserUsualAccessHours(userId: string): Promise<{ start: number; end: number }> {
    // TODO: Implementar análise de padrões de acesso
    return { start: 8, end: 18 }
  }

  private async alertAdministrators(event: SecurityEventEntry): Promise<void> {
    try {
      const { auditNotificationService } = await import('../notifications/audit-notification-service')
      await auditNotificationService.sendSecurityEventNotification(event)
      console.log('Administrators alerted about security event:', event.id)
    } catch (error) {
      console.error('Error alerting administrators:', error)
    }
  }

  private async temporaryAccountLock(userId: string, duration: string): Promise<void> {
    // TODO: Implementar bloqueio temporário
    console.log(`Temporarily locking account ${userId} for ${duration}`)
  }

  private async require2FA(userId: string): Promise<void> {
    // TODO: Implementar exigência de 2FA
    console.log(`Requiring 2FA for user ${userId}`)
  }

  private async blockIP(ipAddress: string, duration: string): Promise<void> {
    // TODO: Implementar bloqueio de IP
    console.log(`Blocking IP ${ipAddress} for ${duration}`)
  }

  private async generateReportFile(report: AuditReport): Promise<string> {
    // TODO: Implementar geração de arquivo
    return `/reports/${report.id}.${report.format}`
  }

  // ==================== MÉTODOS DE BANCO ====================

  private async saveAuditEntry(entry: AuditEntry): Promise<void> {
    await auditDatabaseService.saveAuditEntry(entry)
  }

  private async findAuditEntries(filters: AuditFilters, limit: number, offset: number): Promise<{ entries: AuditEntry[]; total: number }> {
    return await auditDatabaseService.findAuditEntries(filters, limit, offset)
  }

  private async saveAccessLogEntry(entry: AccessLogEntry): Promise<void> {
    await auditDatabaseService.saveAccessLogEntry(entry)
  }

  private async findAccessLogEntries(filters: AccessLogFilters, limit: number, offset: number): Promise<{ entries: AccessLogEntry[]; total: number }> {
    return await auditDatabaseService.findAccessLogEntries(filters, limit, offset)
  }

  private async saveSecurityEventEntry(entry: SecurityEventEntry): Promise<void> {
    await auditDatabaseService.saveSecurityEventEntry(entry)
  }

  private async findSecurityEventEntries(filters: SecurityEventFilters, limit: number, offset: number): Promise<{ entries: SecurityEventEntry[]; total: number }> {
    return await auditDatabaseService.findSecurityEventEntries(filters, limit, offset)
  }

  private async updateSecurityEventResolution(eventId: string, resolvedBy: string, resolution?: string): Promise<void> {
    await auditDatabaseService.updateSecurityEventResolution(eventId, resolvedBy, resolution)
  }

  private async countSecurityEvents(filters: { startDate: Date; endDate: Date }): Promise<{ total: number; critical: number }> {
    return await auditDatabaseService.countSecurityEvents(filters)
  }

  private async saveAuditReport(report: AuditReport): Promise<void> {
    await auditDatabaseService.saveAuditReport(report)
  }

  // ==================== MÉTODOS AUXILIARES ADICIONAIS ====================

  private async findAuditReports(filters: any, limit: number, offset: number): Promise<{ reports: AuditReport[]; total: number }> {
    return await auditDatabaseService.findAuditReports(filters, limit, offset)
  }

  private async findAuditReportById(reportId: string): Promise<AuditReport | null> {
    return await auditDatabaseService.findAuditReportById(reportId)
  }

  private async removeAuditReport(reportId: string): Promise<void> {
    await auditDatabaseService.removeAuditReport(reportId)
  }

  private async analyzeCompliance(type: ComplianceType, auditEntries: AuditEntry[], securityEvents: SecurityEventEntry[]): Promise<ComplianceFinding[]> {
    // TODO: Implementar análise de compliance
    return []
  }

  private determineComplianceStatus(findings: ComplianceFinding[]): 'compliant' | 'non_compliant' | 'partial' {
    if (findings.length === 0) return 'compliant'
    
    const criticalFindings = findings.filter(f => f.severity === 'critical' || f.severity === 'high')
    if (criticalFindings.length > 0) return 'non_compliant'
    
    return 'partial'
  }

  private async generateComplianceRecommendations(type: ComplianceType, findings: ComplianceFinding[]): Promise<string[]> {
    // TODO: Implementar geração de recomendações
    return []
  }

  private async saveComplianceReport(report: ComplianceReport): Promise<void> {
    await auditDatabaseService.saveComplianceReport(report)
  }

  private async findComplianceReports(filters: any, limit: number, offset: number): Promise<{ reports: ComplianceReport[]; total: number }> {
    return await auditDatabaseService.findComplianceReports(filters, limit, offset)
  }

  private async saveAlertRule(rule: AlertRule): Promise<void> {
    await auditDatabaseService.saveAlertRule(rule)
  }

  private async findAlertRules(filters: any, limit: number, offset: number): Promise<{ rules: AlertRule[]; total: number }> {
    return await auditDatabaseService.findAlertRules(filters, limit, offset)
  }

  private async findAlertRuleById(ruleId: string): Promise<AlertRule | null> {
    return await auditDatabaseService.findAlertRuleById(ruleId)
  }

  private async removeAlertRule(ruleId: string): Promise<void> {
    await auditDatabaseService.removeAlertRule(ruleId)
  }

  private async evaluateAlertConditions(conditions: AlertCondition[], testData: any): Promise<{ matched: boolean; details: any[] }> {
    // TODO: Implementar avaliação de condições
    return { matched: false, details: [] }
  }

  private async saveRetentionPolicy(policy: DataRetentionPolicy): Promise<void> {
    await auditDatabaseService.saveRetentionPolicy(policy)
  }

  private async findRetentionPolicies(filters: any, limit: number, offset: number): Promise<{ policies: DataRetentionPolicy[]; total: number }> {
    return await auditDatabaseService.findRetentionPolicies(filters, limit, offset)
  }

  private async findRetentionPolicyById(policyId: string): Promise<DataRetentionPolicy | null> {
    return await auditDatabaseService.findRetentionPolicyById(policyId)
  }

  private async removeRetentionPolicy(policyId: string): Promise<void> {
    await auditDatabaseService.removeRetentionPolicy(policyId)
  }

  private async updateRetentionPolicyLastExecution(policyId: string, date: Date): Promise<void> {
    await auditDatabaseService.updateRetentionPolicyLastExecution(policyId, date)
  }

  private async countAuditEntriesOlderThan(date: Date): Promise<number> {
    return await auditDatabaseService.countAuditEntriesOlderThan(date)
  }

  private async countAuditEntriesBetweenDates(startDate: Date, endDate: Date): Promise<number> {
    return await auditDatabaseService.countAuditEntriesBetweenDates(startDate, endDate)
  }

  private async countAccessLogsOlderThan(date: Date): Promise<number> {
    return await auditDatabaseService.countAccessLogsOlderThan(date)
  }

  private async countAccessLogsBetweenDates(startDate: Date, endDate: Date): Promise<number> {
    return await auditDatabaseService.countAccessLogsBetweenDates(startDate, endDate)
  }

  private async countSecurityEventsOlderThan(date: Date): Promise<number> {
    return await auditDatabaseService.countSecurityEventsOlderThan(date)
  }

  private async countSecurityEventsBetweenDates(startDate: Date, endDate: Date): Promise<number> {
    return await auditDatabaseService.countSecurityEventsBetweenDates(startDate, endDate)
  }

  private async archiveAuditEntriesBetweenDates(startDate: Date, endDate: Date): Promise<number> {
    // TODO: Implementar arquivamento (mover para tabela de arquivo)
    return 0
  }

  private async deleteAuditEntriesOlderThan(date: Date): Promise<number> {
    return await auditDatabaseService.deleteAuditEntriesOlderThan(date)
  }

  private async archiveAccessLogsBetweenDates(startDate: Date, endDate: Date): Promise<number> {
    // TODO: Implementar arquivamento (mover para tabela de arquivo)
    return 0
  }

  private async deleteAccessLogsOlderThan(date: Date): Promise<number> {
    return await auditDatabaseService.deleteAccessLogsOlderThan(date)
  }

  private async archiveSecurityEventsBetweenDates(startDate: Date, endDate: Date): Promise<number> {
    // TODO: Implementar arquivamento (mover para tabela de arquivo)
    return 0
  }

  private async deleteSecurityEventsOlderThan(date: Date): Promise<number> {
    return await auditDatabaseService.deleteSecurityEventsOlderThan(date)
  }

  private parsePeriod(period: string): { startDate: Date; endDate: Date } {
    const endDate = new Date()
    const startDate = new Date()

    switch (period) {
      case '24h':
        startDate.setHours(startDate.getHours() - 24)
        break
      case '7d':
        startDate.setDate(startDate.getDate() - 7)
        break
      case '30d':
        startDate.setDate(startDate.getDate() - 30)
        break
      case '90d':
        startDate.setDate(startDate.getDate() - 90)
        break
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1)
        break
      default:
        startDate.setDate(startDate.getDate() - 30)
    }

    return { startDate, endDate }
  }

  private async getAuditLogsStats(startDate: Date, endDate: Date, options: any): Promise<any> {
    // TODO: Implementar estatísticas de audit logs
    return {
      total: 0,
      successful: 0,
      failed: 0,
      byDay: []
    }
  }

  private async getAccessLogsStats(startDate: Date, endDate: Date, options: any): Promise<any> {
    // TODO: Implementar estatísticas de access logs
    return {
      total: 0,
      successful: 0,
      failed: 0,
      byDay: []
    }
  }

  private async getSecurityEventsStats(startDate: Date, endDate: Date, options: any): Promise<any> {
    // TODO: Implementar estatísticas de security events
    return {
      total: 0,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      resolved: 0,
      byDay: []
    }
  }

  private async getTopUsersStats(startDate: Date, endDate: Date, options: any): Promise<any[]> {
    // TODO: Implementar estatísticas de top users
    return []
  }

  private async getTopActionsStats(startDate: Date, endDate: Date, options: any): Promise<any[]> {
    // TODO: Implementar estatísticas de top actions
    return []
  }

  private async getTrendsStats(startDate: Date, endDate: Date): Promise<any> {
    // TODO: Implementar estatísticas de tendências
    return {}
  }

  private async saveExportJob(exportJob: any): Promise<void> {
    await auditDatabaseService.saveExportJob(exportJob)
  }

  private async processExportJob(exportId: string): Promise<void> {
    // TODO: Implementar processamento de exportação em background
    console.log('Processing export job:', exportId)
  }

  private async findExportJobs(filters: any, limit: number, offset: number): Promise<{ exports: any[]; total: number }> {
    return await auditDatabaseService.findExportJobs(filters, limit, offset)
  }

  private async findExportJobById(exportId: string): Promise<any> {
    return await auditDatabaseService.findExportJobById(exportId)
  }

  // ==================== BUSCA AVANÇADA ====================

  async searchAuditData(options: {
    query: string
    dataTypes: string[]
    filters: any
    sortBy: string
    sortOrder: string
    page: number
    limit: number
  }): Promise<any> {
    try {
      const results: any = {
        query: options.query,
        dataTypes: options.dataTypes,
        results: [],
        total: 0,
        page: options.page,
        totalPages: 0
      }

      // Buscar em cada tipo de dados solicitado
      for (const dataType of options.dataTypes) {
        let typeResults: any = []
        
        switch (dataType) {
          case 'audit_logs':
            typeResults = await this.searchAuditLogs(options)
            break
          case 'access_logs':
            typeResults = await this.searchAccessLogs(options)
            break
          case 'security_events':
            typeResults = await this.searchSecurityEvents(options)
            break
        }

        results.results.push({
          dataType,
          entries: typeResults.entries || [],
          total: typeResults.total || 0
        })

        results.total += typeResults.total || 0
      }

      results.totalPages = Math.ceil(results.total / options.limit)

      return results

    } catch (error) {
      console.error('Error searching audit data:', error)
      throw error
    }
  }

  private async searchAuditLogs(options: any): Promise<{ entries: AuditEntry[]; total: number }> {
    // TODO: Implementar busca em audit logs
    return { entries: [], total: 0 }
  }

  private async searchAccessLogs(options: any): Promise<{ entries: AccessLogEntry[]; total: number }> {
    // TODO: Implementar busca em access logs
    return { entries: [], total: 0 }
  }

  private async searchSecurityEvents(options: any): Promise<{ entries: SecurityEventEntry[]; total: number }> {
    // TODO: Implementar busca em security events
    return { entries: [], total: 0 }
  }

  // ==================== DASHBOARD ====================

  async getDashboardData(options: {
    period: string
    includeCharts: boolean
    includeAlerts: boolean
    userId?: string
    userType?: 'client' | 'employee'
  }): Promise<any> {
    try {
      const { startDate, endDate } = this.parsePeriod(options.period)
      
      const dashboard = {
        period: options.period,
        generatedAt: new Date(),
        summary: await this.getDashboardSummary(startDate, endDate, options),
        recentActivity: await this.getRecentActivity(options),
        securityAlerts: options.includeAlerts ? await this.getActiveSecurityAlerts() : undefined,
        charts: options.includeCharts ? await this.getDashboardCharts(startDate, endDate, options) : undefined,
        topUsers: await this.getTopActiveUsers(startDate, endDate, 10),
        topActions: await this.getTopActions(startDate, endDate, 10),
        complianceStatus: await this.getComplianceStatus()
      }

      return dashboard

    } catch (error) {
      console.error('Error getting dashboard data:', error)
      throw error
    }
  }

  private async getDashboardSummary(startDate: Date, endDate: Date, options: any): Promise<any> {
    // TODO: Implementar resumo do dashboard
    return {
      totalAuditLogs: 0,
      totalAccessLogs: 0,
      totalSecurityEvents: 0,
      activeUsers: 0,
      failedLogins: 0,
      criticalEvents: 0,
      complianceScore: 95
    }
  }

  private async getRecentActivity(options: any): Promise<any[]> {
    // TODO: Implementar atividade recente
    return []
  }

  private async getActiveSecurityAlerts(): Promise<any[]> {
    // TODO: Implementar alertas de segurança ativos
    return []
  }

  private async getDashboardCharts(startDate: Date, endDate: Date, options: any): Promise<any> {
    // TODO: Implementar dados dos gráficos
    return {
      auditLogsOverTime: [],
      accessLogsOverTime: [],
      securityEventsOverTime: [],
      userActivityHeatmap: [],
      actionDistribution: []
    }
  }

  private async getTopActiveUsers(startDate: Date, endDate: Date, limit: number): Promise<any[]> {
    // TODO: Implementar usuários mais ativos
    return []
  }

  private async getTopActions(startDate: Date, endDate: Date, limit: number): Promise<any[]> {
    // TODO: Implementar ações mais frequentes
    return []
  }

  private async getComplianceStatus(): Promise<any> {
    // TODO: Implementar status de compliance
    return {
      overall: 'compliant',
      lgpd: 'compliant',
      sox: 'partial',
      iso27001: 'compliant'
    }
  }

  // ==================== CONFIGURAÇÕES ====================

  async getAuditConfig(): Promise<any> {
    try {
      return await auditDatabaseService.getAuditConfig()
    } catch (error) {
      console.error('Error getting audit config:', error)
      throw error
    }
  }

  async updateAuditConfig(config: any): Promise<any> {
    try {
      const updatedConfig = await auditDatabaseService.updateAuditConfig(config)
      
      // Log da alteração de configuração
      await this.logAction(
        config.updatedBy,
        'employee',
        'update_audit_config',
        'audit_config',
        {
          newData: config,
          ipAddress: '',
          userAgent: '',
          metadata: { configUpdate: true }
        }
      )

      return updatedConfig
    } catch (error) {
      console.error('Error updating audit config:', error)
      throw error
    }
  }
}

export const auditService = new AuditService()