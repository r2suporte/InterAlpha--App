import { prisma } from '@/lib/prisma'
import { 
  AuditEntry, 
  AccessLogEntry, 
  SecurityEventEntry, 
  AuditFilters,
  AccessLogFilters,
  SecurityEventFilters,
  AuditReport,
  ComplianceReport,
  AlertRule,
  DataRetentionPolicy,
  ComplianceType,
  ComplianceFinding
} from '@/types/audit'

export class AuditDatabaseService {
  
  // ==================== AUDIT ENTRIES ====================
  
  async saveAuditEntry(entry: AuditEntry): Promise<void> {
    await prisma.auditEntry.create({
      data: {
        id: entry.id,
        userId: entry.userId,
        userType: entry.userType,
        action: entry.action,
        resource: entry.resource,
        resourceId: entry.resourceId,
        oldData: entry.oldData,
        newData: entry.newData,
        result: entry.result,
        reason: entry.reason,
        timestamp: entry.timestamp,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        sessionId: entry.sessionId,
        metadata: entry.metadata
      }
    })
  }

  async findAuditEntries(
    filters: AuditFilters, 
    limit: number, 
    offset: number
  ): Promise<{ entries: AuditEntry[]; total: number }> {
    const where: any = {}

    if (filters.userId) where.userId = filters.userId
    if (filters.userType) where.userType = filters.userType
    if (filters.action) where.action = { contains: filters.action, mode: 'insensitive' }
    if (filters.resource) where.resource = { contains: filters.resource, mode: 'insensitive' }
    if (filters.result) where.result = filters.result
    if (filters.ipAddress) where.ipAddress = filters.ipAddress
    
    if (filters.startDate || filters.endDate) {
      where.timestamp = {}
      if (filters.startDate) where.timestamp.gte = filters.startDate
      if (filters.endDate) where.timestamp.lte = filters.endDate
    }

    const [entries, total] = await Promise.all([
      prisma.auditEntry.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.auditEntry.count({ where })
    ])

    return {
      entries: entries.map(this.mapPrismaToAuditEntry),
      total
    }
  }

  async countAuditEntriesOlderThan(date: Date): Promise<number> {
    return await prisma.auditEntry.count({
      where: {
        timestamp: { lt: date }
      }
    })
  }

  async countAuditEntriesBetweenDates(startDate: Date, endDate: Date): Promise<number> {
    return await prisma.auditEntry.count({
      where: {
        timestamp: {
          gte: startDate,
          lte: endDate
        }
      }
    })
  }

  async deleteAuditEntriesOlderThan(date: Date): Promise<number> {
    const result = await prisma.auditEntry.deleteMany({
      where: {
        timestamp: { lt: date }
      }
    })
    return result.count
  }

  // ==================== ACCESS LOG ENTRIES ====================

  async saveAccessLogEntry(entry: AccessLogEntry): Promise<void> {
    await prisma.accessLogEntry.create({
      data: {
        id: entry.id,
        userId: entry.userId,
        userType: entry.userType,
        action: entry.action,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        location: entry.location,
        success: entry.success,
        failureReason: entry.failureReason,
        timestamp: entry.timestamp,
        sessionDuration: entry.sessionDuration,
        metadata: entry.metadata
      }
    })
  }

  async findAccessLogEntries(
    filters: AccessLogFilters, 
    limit: number, 
    offset: number
  ): Promise<{ entries: AccessLogEntry[]; total: number }> {
    const where: any = {}

    if (filters.userId) where.userId = filters.userId
    if (filters.userType) where.userType = filters.userType
    if (filters.action) where.action = filters.action
    if (filters.success !== undefined) where.success = filters.success
    if (filters.ipAddress) where.ipAddress = filters.ipAddress
    
    if (filters.startDate || filters.endDate) {
      where.timestamp = {}
      if (filters.startDate) where.timestamp.gte = filters.startDate
      if (filters.endDate) where.timestamp.lte = filters.endDate
    }

    const [entries, total] = await Promise.all([
      prisma.accessLogEntry.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.accessLogEntry.count({ where })
    ])

    return {
      entries: entries.map(this.mapPrismaToAccessLogEntry),
      total
    }
  }

  async countRecentFailedLogins(userId: string, ipAddress: string, minutes: number): Promise<number> {
    const since = new Date(Date.now() - minutes * 60 * 1000)
    
    return await prisma.accessLogEntry.count({
      where: {
        userId,
        ipAddress,
        success: false,
        timestamp: { gte: since }
      }
    })
  }

  async getUserPreviousLocations(userId: string): Promise<string[]> {
    const locations = await prisma.accessLogEntry.findMany({
      where: {
        userId,
        success: true,
        location: { not: null }
      },
      select: { location: true },
      distinct: ['location'],
      take: 10,
      orderBy: { timestamp: 'desc' }
    })

    return locations.map(l => l.location!).filter(Boolean)
  }

  async countAccessLogsOlderThan(date: Date): Promise<number> {
    return await prisma.accessLogEntry.count({
      where: {
        timestamp: { lt: date }
      }
    })
  }

  async countAccessLogsBetweenDates(startDate: Date, endDate: Date): Promise<number> {
    return await prisma.accessLogEntry.count({
      where: {
        timestamp: {
          gte: startDate,
          lte: endDate
        }
      }
    })
  }

  async deleteAccessLogsOlderThan(date: Date): Promise<number> {
    const result = await prisma.accessLogEntry.deleteMany({
      where: {
        timestamp: { lt: date }
      }
    })
    return result.count
  }

  // ==================== SECURITY EVENT ENTRIES ====================

  async saveSecurityEventEntry(entry: SecurityEventEntry): Promise<void> {
    await prisma.securityEventEntry.create({
      data: {
        id: entry.id,
        type: entry.type,
        severity: entry.severity,
        userId: entry.userId,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        description: entry.description,
        details: entry.details,
        timestamp: entry.timestamp,
        resolved: entry.resolved,
        resolvedBy: entry.resolvedBy,
        resolvedAt: entry.resolvedAt,
        actions: {
          create: entry.actions.map(action => ({
            action: action.action,
            timestamp: action.timestamp,
            automated: action.automated,
            details: action.details
          }))
        }
      }
    })
  }

  async findSecurityEventEntries(
    filters: SecurityEventFilters, 
    limit: number, 
    offset: number
  ): Promise<{ entries: SecurityEventEntry[]; total: number }> {
    const where: any = {}

    if (filters.type) where.type = filters.type
    if (filters.severity) where.severity = filters.severity
    if (filters.userId) where.userId = filters.userId
    if (filters.resolved !== undefined) where.resolved = filters.resolved
    
    if (filters.startDate || filters.endDate) {
      where.timestamp = {}
      if (filters.startDate) where.timestamp.gte = filters.startDate
      if (filters.endDate) where.timestamp.lte = filters.endDate
    }

    const [entries, total] = await Promise.all([
      prisma.securityEventEntry.findMany({
        where,
        include: { actions: true },
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.securityEventEntry.count({ where })
    ])

    return {
      entries: entries.map(this.mapPrismaToSecurityEventEntry),
      total
    }
  }

  async updateSecurityEventResolution(
    eventId: string, 
    resolvedBy: string, 
    resolution?: string
  ): Promise<void> {
    await prisma.securityEventEntry.update({
      where: { id: eventId },
      data: {
        resolved: true,
        resolvedBy,
        resolvedAt: new Date(),
        details: {
          path: ['resolution'],
          set: resolution
        }
      }
    })
  }

  async countSecurityEvents(filters: { startDate: Date; endDate: Date }): Promise<{ total: number; critical: number }> {
    const where = {
      timestamp: {
        gte: filters.startDate,
        lte: filters.endDate
      }
    }

    const [total, critical] = await Promise.all([
      prisma.securityEventEntry.count({ where }),
      prisma.securityEventEntry.count({
        where: {
          ...where,
          severity: 'critical'
        }
      })
    ])

    return { total, critical }
  }

  async countSecurityEventsOlderThan(date: Date): Promise<number> {
    return await prisma.securityEventEntry.count({
      where: {
        timestamp: { lt: date }
      }
    })
  }

  async countSecurityEventsBetweenDates(startDate: Date, endDate: Date): Promise<number> {
    return await prisma.securityEventEntry.count({
      where: {
        timestamp: {
          gte: startDate,
          lte: endDate
        }
      }
    })
  }

  async deleteSecurityEventsOlderThan(date: Date): Promise<number> {
    const result = await prisma.securityEventEntry.deleteMany({
      where: {
        timestamp: { lt: date }
      }
    })
    return result.count
  }

  // ==================== AUDIT REPORTS ====================

  async saveAuditReport(report: AuditReport): Promise<void> {
    await prisma.auditReport.create({
      data: {
        id: report.id,
        title: report.title,
        description: report.description,
        generatedBy: report.generatedBy,
        generatedAt: report.generatedAt,
        startDate: report.period.startDate,
        endDate: report.period.endDate,
        filters: report.filters,
        summary: report.summary,
        data: report.data,
        format: report.format,
        downloadUrl: report.downloadUrl
      }
    })
  }

  async findAuditReports(
    filters: any, 
    limit: number, 
    offset: number
  ): Promise<{ reports: AuditReport[]; total: number }> {
    const where: any = {}

    if (filters.generatedBy) where.generatedBy = filters.generatedBy
    if (filters.format) where.format = filters.format
    
    if (filters.startDate || filters.endDate) {
      where.generatedAt = {}
      if (filters.startDate) where.generatedAt.gte = filters.startDate
      if (filters.endDate) where.generatedAt.lte = filters.endDate
    }

    const [reports, total] = await Promise.all([
      prisma.auditReport.findMany({
        where,
        orderBy: { generatedAt: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.auditReport.count({ where })
    ])

    return {
      reports: reports.map(this.mapPrismaToAuditReport),
      total
    }
  }

  async findAuditReportById(reportId: string): Promise<AuditReport | null> {
    const report = await prisma.auditReport.findUnique({
      where: { id: reportId }
    })

    return report ? this.mapPrismaToAuditReport(report) : null
  }

  async removeAuditReport(reportId: string): Promise<void> {
    await prisma.auditReport.delete({
      where: { id: reportId }
    })
  }

  // ==================== COMPLIANCE REPORTS ====================

  async saveComplianceReport(report: ComplianceReport): Promise<void> {
    await prisma.complianceReport.create({
      data: {
        id: report.id,
        type: report.type,
        startDate: report.period.startDate,
        endDate: report.period.endDate,
        generatedBy: report.generatedBy,
        generatedAt: report.generatedAt,
        status: report.status,
        recommendations: report.recommendations,
        downloadUrl: report.downloadUrl,
        findings: {
          create: report.findings.map(finding => ({
            id: finding.id,
            severity: finding.severity,
            category: finding.category,
            description: finding.description,
            evidence: finding.evidence,
            recommendation: finding.recommendation,
            status: finding.status
          }))
        }
      }
    })
  }

  async findComplianceReports(
    filters: any, 
    limit: number, 
    offset: number
  ): Promise<{ reports: ComplianceReport[]; total: number }> {
    const where: any = {}

    if (filters.type) where.type = filters.type
    if (filters.status) where.status = filters.status
    if (filters.generatedBy) where.generatedBy = filters.generatedBy
    
    if (filters.startDate || filters.endDate) {
      where.generatedAt = {}
      if (filters.startDate) where.generatedAt.gte = filters.startDate
      if (filters.endDate) where.generatedAt.lte = filters.endDate
    }

    const [reports, total] = await Promise.all([
      prisma.complianceReport.findMany({
        where,
        include: { findings: true },
        orderBy: { generatedAt: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.complianceReport.count({ where })
    ])

    return {
      reports: reports.map(this.mapPrismaToComplianceReport),
      total
    }
  }

  // ==================== ALERT RULES ====================

  async saveAlertRule(rule: AlertRule): Promise<void> {
    await prisma.alertRule.upsert({
      where: { id: rule.id },
      create: {
        id: rule.id,
        name: rule.name,
        description: rule.description,
        enabled: rule.enabled,
        conditions: rule.conditions,
        actions: rule.actions,
        cooldownMinutes: rule.cooldownMinutes,
        createdBy: rule.createdBy,
        createdAt: rule.createdAt,
        lastTriggered: rule.lastTriggered,
        triggerCount: rule.triggerCount
      },
      update: {
        name: rule.name,
        description: rule.description,
        enabled: rule.enabled,
        conditions: rule.conditions,
        actions: rule.actions,
        cooldownMinutes: rule.cooldownMinutes,
        lastTriggered: rule.lastTriggered,
        triggerCount: rule.triggerCount
      }
    })
  }

  async findAlertRules(
    filters: any, 
    limit: number, 
    offset: number
  ): Promise<{ rules: AlertRule[]; total: number }> {
    const where: any = {}

    if (filters.enabled !== undefined) where.enabled = filters.enabled
    if (filters.createdBy) where.createdBy = filters.createdBy

    const [rules, total] = await Promise.all([
      prisma.alertRule.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.alertRule.count({ where })
    ])

    return {
      rules: rules.map(this.mapPrismaToAlertRule),
      total
    }
  }

  async findAlertRuleById(ruleId: string): Promise<AlertRule | null> {
    const rule = await prisma.alertRule.findUnique({
      where: { id: ruleId }
    })

    return rule ? this.mapPrismaToAlertRule(rule) : null
  }

  async removeAlertRule(ruleId: string): Promise<void> {
    await prisma.alertRule.delete({
      where: { id: ruleId }
    })
  }

  // ==================== RETENTION POLICIES ====================

  async saveRetentionPolicy(policy: DataRetentionPolicy): Promise<void> {
    await prisma.dataRetentionPolicy.upsert({
      where: { id: policy.id },
      create: {
        id: policy.id,
        name: policy.name,
        description: policy.description,
        dataType: policy.dataType,
        retentionDays: policy.retentionDays,
        archiveAfterDays: policy.archiveAfterDays,
        deleteAfterDays: policy.deleteAfterDays,
        enabled: policy.enabled,
        createdBy: policy.createdBy,
        createdAt: policy.createdAt,
        lastExecuted: policy.lastExecuted
      },
      update: {
        name: policy.name,
        description: policy.description,
        retentionDays: policy.retentionDays,
        archiveAfterDays: policy.archiveAfterDays,
        deleteAfterDays: policy.deleteAfterDays,
        enabled: policy.enabled,
        lastExecuted: policy.lastExecuted
      }
    })
  }

  async findRetentionPolicies(
    filters: any, 
    limit: number, 
    offset: number
  ): Promise<{ policies: DataRetentionPolicy[]; total: number }> {
    const where: any = {}

    if (filters.dataType) where.dataType = filters.dataType
    if (filters.enabled !== undefined) where.enabled = filters.enabled
    if (filters.createdBy) where.createdBy = filters.createdBy

    const [policies, total] = await Promise.all([
      prisma.dataRetentionPolicy.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.dataRetentionPolicy.count({ where })
    ])

    return {
      policies: policies.map(this.mapPrismaToRetentionPolicy),
      total
    }
  }

  async findRetentionPolicyById(policyId: string): Promise<DataRetentionPolicy | null> {
    const policy = await prisma.dataRetentionPolicy.findUnique({
      where: { id: policyId }
    })

    return policy ? this.mapPrismaToRetentionPolicy(policy) : null
  }

  async removeRetentionPolicy(policyId: string): Promise<void> {
    await prisma.dataRetentionPolicy.delete({
      where: { id: policyId }
    })
  }

  async updateRetentionPolicyLastExecution(policyId: string, date: Date): Promise<void> {
    await prisma.dataRetentionPolicy.update({
      where: { id: policyId },
      data: { lastExecuted: date }
    })
  }

  // ==================== EXPORT JOBS ====================

  async saveExportJob(exportJob: any): Promise<void> {
    await prisma.exportJob.create({
      data: {
        id: exportJob.id,
        dataTypes: exportJob.dataTypes,
        format: exportJob.format,
        filters: exportJob.filters,
        includeMetadata: exportJob.includeMetadata,
        compression: exportJob.compression,
        requestedBy: exportJob.requestedBy,
        status: exportJob.status,
        progress: exportJob.progress,
        createdAt: exportJob.createdAt,
        completedAt: exportJob.completedAt,
        downloadUrl: exportJob.downloadUrl,
        filename: exportJob.filename,
        fileSize: exportJob.fileSize,
        mimeType: exportJob.mimeType,
        errorMessage: exportJob.errorMessage
      }
    })
  }

  async findExportJobs(
    filters: any, 
    limit: number, 
    offset: number
  ): Promise<{ exports: any[]; total: number }> {
    const where: any = {}

    if (filters.requestedBy) where.requestedBy = filters.requestedBy
    if (filters.status) where.status = filters.status

    const [exports, total] = await Promise.all([
      prisma.exportJob.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.exportJob.count({ where })
    ])

    return { exports, total }
  }

  async findExportJobById(exportId: string): Promise<any> {
    return await prisma.exportJob.findUnique({
      where: { id: exportId }
    })
  }

  // ==================== CONFIG ====================

  async getAuditConfig(): Promise<any> {
    const config = await prisma.auditConfig.findUnique({
      where: { id: 'default' }
    })

    if (!config) {
      // Create default config if it doesn't exist
      return await prisma.auditConfig.create({
        data: {
          id: 'default',
          enableAuditLogging: true,
          enableAccessLogging: true,
          enableSecurityEvents: true,
          logRetentionDays: 365,
          enableRealTimeAlerts: true,
          alertCooldownMinutes: 60,
          enableAutoArchiving: false,
          archiveAfterDays: 90,
          enableCompliance: true,
          complianceTypes: ['lgpd'],
          enableExport: true,
          maxExportRecords: 100000,
          enableAnonymization: false,
          anonymizeAfterDays: 730,
          updatedBy: 'system'
        }
      })
    }

    return config
  }

  async updateAuditConfig(config: any): Promise<any> {
    return await prisma.auditConfig.upsert({
      where: { id: 'default' },
      create: {
        id: 'default',
        ...config
      },
      update: config
    })
  }

  // ==================== MAPPING FUNCTIONS ====================

  private mapPrismaToAuditEntry(entry: any): AuditEntry {
    return {
      id: entry.id,
      userId: entry.userId,
      userType: entry.userType as 'client' | 'employee',
      action: entry.action,
      resource: entry.resource,
      resourceId: entry.resourceId,
      oldData: entry.oldData,
      newData: entry.newData,
      result: entry.result as 'success' | 'failure',
      reason: entry.reason,
      timestamp: entry.timestamp,
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
      sessionId: entry.sessionId,
      metadata: entry.metadata
    }
  }

  private mapPrismaToAccessLogEntry(entry: any): AccessLogEntry {
    return {
      id: entry.id,
      userId: entry.userId,
      userType: entry.userType as 'client' | 'employee',
      action: entry.action as 'login' | 'logout' | 'access_denied' | 'session_expired',
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
      location: entry.location,
      success: entry.success,
      failureReason: entry.failureReason,
      timestamp: entry.timestamp,
      sessionDuration: entry.sessionDuration,
      metadata: entry.metadata
    }
  }

  private mapPrismaToSecurityEventEntry(entry: any): SecurityEventEntry {
    return {
      id: entry.id,
      type: entry.type,
      severity: entry.severity,
      userId: entry.userId,
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
      description: entry.description,
      details: entry.details,
      timestamp: entry.timestamp,
      resolved: entry.resolved,
      resolvedBy: entry.resolvedBy,
      resolvedAt: entry.resolvedAt,
      actions: entry.actions.map((action: any) => ({
        action: action.action,
        timestamp: action.timestamp,
        automated: action.automated,
        details: action.details
      }))
    }
  }

  private mapPrismaToAuditReport(report: any): AuditReport {
    return {
      id: report.id,
      title: report.title,
      description: report.description,
      generatedBy: report.generatedBy,
      generatedAt: report.generatedAt,
      period: {
        startDate: report.startDate,
        endDate: report.endDate
      },
      filters: report.filters,
      summary: report.summary,
      data: report.data,
      format: report.format as 'json' | 'csv' | 'pdf',
      downloadUrl: report.downloadUrl
    }
  }

  private mapPrismaToComplianceReport(report: any): ComplianceReport {
    return {
      id: report.id,
      type: report.type as ComplianceType,
      period: {
        startDate: report.startDate,
        endDate: report.endDate
      },
      generatedBy: report.generatedBy,
      generatedAt: report.generatedAt,
      status: report.status as 'compliant' | 'non_compliant' | 'partial',
      findings: report.findings.map((finding: any) => ({
        id: finding.id,
        severity: finding.severity as 'low' | 'medium' | 'high' | 'critical',
        category: finding.category,
        description: finding.description,
        evidence: finding.evidence,
        recommendation: finding.recommendation,
        status: finding.status as 'open' | 'in_progress' | 'resolved'
      })),
      recommendations: report.recommendations,
      downloadUrl: report.downloadUrl
    }
  }

  private mapPrismaToAlertRule(rule: any): AlertRule {
    return {
      id: rule.id,
      name: rule.name,
      description: rule.description,
      enabled: rule.enabled,
      conditions: rule.conditions,
      actions: rule.actions,
      cooldownMinutes: rule.cooldownMinutes,
      createdBy: rule.createdBy,
      createdAt: rule.createdAt,
      lastTriggered: rule.lastTriggered,
      triggerCount: rule.triggerCount
    }
  }

  private mapPrismaToRetentionPolicy(policy: any): DataRetentionPolicy {
    return {
      id: policy.id,
      name: policy.name,
      description: policy.description,
      dataType: policy.dataType as 'audit_logs' | 'access_logs' | 'security_events',
      retentionDays: policy.retentionDays,
      archiveAfterDays: policy.archiveAfterDays,
      deleteAfterDays: policy.deleteAfterDays,
      enabled: policy.enabled,
      createdBy: policy.createdBy,
      createdAt: policy.createdAt,
      lastExecuted: policy.lastExecuted
    }
  }
}

export const auditDatabaseService = new AuditDatabaseService()