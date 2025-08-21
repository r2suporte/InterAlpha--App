import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding audit system...')

  // Criar configuração padrão de auditoria
  await prisma.auditConfig.upsert({
    where: { id: 'default' },
    update: {},
    create: {
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

  // Criar política de retenção padrão para logs de auditoria
  await prisma.dataRetentionPolicy.upsert({
    where: { id: 'default-audit-logs' },
    update: {},
    create: {
      id: 'default-audit-logs',
      name: 'Política Padrão - Logs de Auditoria',
      description: 'Política padrão de retenção para logs de auditoria (365 dias)',
      dataType: 'audit_logs',
      retentionDays: 365,
      deleteAfterDays: 365,
      enabled: true,
      createdBy: 'system'
    }
  })

  // Criar política de retenção padrão para logs de acesso
  await prisma.dataRetentionPolicy.upsert({
    where: { id: 'default-access-logs' },
    update: {},
    create: {
      id: 'default-access-logs',
      name: 'Política Padrão - Logs de Acesso',
      description: 'Política padrão de retenção para logs de acesso (180 dias)',
      dataType: 'access_logs',
      retentionDays: 180,
      deleteAfterDays: 180,
      enabled: true,
      createdBy: 'system'
    }
  })

  // Criar política de retenção padrão para eventos de segurança
  await prisma.dataRetentionPolicy.upsert({
    where: { id: 'default-security-events' },
    update: {},
    create: {
      id: 'default-security-events',
      name: 'Política Padrão - Eventos de Segurança',
      description: 'Política padrão de retenção para eventos de segurança (730 dias)',
      dataType: 'security_events',
      retentionDays: 730,
      deleteAfterDays: 730,
      enabled: true,
      createdBy: 'system'
    }
  })

  // Criar regra de alerta para tentativas de login falhadas
  await prisma.alertRule.upsert({
    where: { id: 'failed-login-attempts' },
    update: {},
    create: {
      id: 'failed-login-attempts',
      name: 'Múltiplas Tentativas de Login Falhadas',
      description: 'Alerta quando há mais de 5 tentativas de login falhadas em 15 minutos',
      enabled: true,
      conditions: [
        {
          field: 'action',
          operator: 'equals',
          value: 'login',
          timeWindow: 15
        },
        {
          field: 'success',
          operator: 'equals',
          value: false
        },
        {
          field: 'count',
          operator: 'greater_than',
          value: 5
        }
      ],
      actions: [
        {
          type: 'email',
          config: {
            recipients: ['admin@interalpha.com'],
            subject: 'Alerta de Segurança: Múltiplas tentativas de login falhadas'
          }
        }
      ],
      cooldownMinutes: 60,
      createdBy: 'system'
    }
  })

  // Criar regra de alerta para eventos críticos de segurança
  await prisma.alertRule.upsert({
    where: { id: 'critical-security-events' },
    update: {},
    create: {
      id: 'critical-security-events',
      name: 'Eventos Críticos de Segurança',
      description: 'Alerta imediato para eventos de segurança críticos',
      enabled: true,
      conditions: [
        {
          field: 'severity',
          operator: 'equals',
          value: 'critical'
        }
      ],
      actions: [
        {
          type: 'email',
          config: {
            recipients: ['admin@interalpha.com', 'security@interalpha.com'],
            subject: 'CRÍTICO: Evento de segurança detectado'
          }
        },
        {
          type: 'sms',
          config: {
            recipients: ['+5511999999999'],
            message: 'Evento crítico de segurança detectado no InterAlpha'
          }
        }
      ],
      cooldownMinutes: 5,
      createdBy: 'system'
    }
  })

  console.log('✅ Audit system seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding audit system:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })