const { auditNotificationService } = require('../src/services/notifications/audit-notification-service.ts')
const { emailService } = require('../src/services/notifications/email-service.ts')
const { smsService } = require('../src/services/notifications/sms-service.ts')

async function testNotificationSystem() {
  console.log('🧪 Testing Notification System...')

  try {
    // Teste 1: Verificar configuração dos serviços
    console.log('\n1. Testing service configuration...')
    
    const emailConfigured = await emailService.testConnection()
    console.log(`✅ Email service: ${emailConfigured ? 'Configured' : 'Not configured'}`)
    
    const smsConfigured = smsService.isConfigured()
    console.log(`✅ SMS service: ${smsConfigured ? 'Configured' : 'Not configured'}`)

    // Teste 2: Criar evento de segurança mock
    console.log('\n2. Creating mock security event...')
    const mockSecurityEvent = {
      id: 'test-' + Date.now(),
      type: 'MULTIPLE_FAILED_ATTEMPTS',
      severity: 'high',
      userId: 'test-user-123',
      ipAddress: '192.168.1.100',
      userAgent: 'Test User Agent',
      description: 'Teste do sistema de notificações - 5 tentativas de login falhadas',
      timestamp: new Date(),
      resolved: false,
      resolvedBy: null,
      resolvedAt: null,
      actions: [
        {
          action: 'alert_administrators',
          timestamp: new Date(),
          automated: true,
          details: { method: 'email_sms' }
        }
      ]
    }
    console.log('✅ Mock security event created:', mockSecurityEvent.id)

    // Teste 3: Testar notificação de evento de segurança
    console.log('\n3. Testing security event notification...')
    const securityNotificationSent = await auditNotificationService.sendSecurityEventNotification(
      mockSecurityEvent,
      {
        emails: ['test@example.com'],
        phones: ['+5511999999999']
      }
    )
    console.log(`✅ Security notification: ${securityNotificationSent ? 'Sent' : 'Failed'}`)

    // Teste 4: Testar alerta crítico
    console.log('\n4. Testing critical alert...')
    const criticalAlertSent = await auditNotificationService.sendCriticalAlert(
      'Sistema Comprometido',
      'Detectada atividade suspeita crítica no sistema. Verificação imediata necessária.',
      {
        emails: ['admin@example.com'],
        phones: ['+5511999999999']
      }
    )
    console.log(`✅ Critical alert: ${criticalAlertSent ? 'Sent' : 'Failed'}`)

    // Teste 5: Testar relatório de auditoria
    console.log('\n5. Testing audit report notification...')
    const mockReportData = {
      period: {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date()
      },
      summary: {
        totalEntries: 1250,
        successfulActions: 1180,
        failedActions: 70,
        securityEvents: 15,
        criticalEvents: 2
      }
    }

    const reportNotificationSent = await auditNotificationService.sendAuditReportNotification(
      'Relatório Mensal de Auditoria - Teste',
      mockReportData,
      'https://example.com/report.pdf',
      {
        emails: ['reports@example.com']
      }
    )
    console.log(`✅ Report notification: ${reportNotificationSent ? 'Sent' : 'Failed'}`)

    // Teste 6: Testar alerta de compliance
    console.log('\n6. Testing compliance alert...')
    const mockComplianceReport = {
      id: 'compliance-test-' + Date.now(),
      type: 'lgpd',
      period: {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date()
      },
      generatedBy: 'system',
      generatedAt: new Date(),
      status: 'non_compliant',
      findings: [
        {
          id: 'finding-1',
          severity: 'high',
          category: 'Retenção de Dados',
          description: 'Dados pessoais retidos além do período permitido',
          evidence: [],
          recommendation: 'Implementar política de exclusão automática',
          status: 'open'
        },
        {
          id: 'finding-2',
          severity: 'medium',
          category: 'Consentimento',
          description: 'Falta de registro de consentimento para alguns usuários',
          evidence: [],
          recommendation: 'Solicitar reconfirmação de consentimento',
          status: 'open'
        }
      ],
      recommendations: [
        'Implementar exclusão automática de dados',
        'Melhorar processo de consentimento'
      ]
    }

    const complianceAlertSent = await auditNotificationService.sendComplianceAlert(
      mockComplianceReport,
      {
        emails: ['compliance@example.com'],
        phones: ['+5511999999999']
      }
    )
    console.log(`✅ Compliance alert: ${complianceAlertSent ? 'Sent' : 'Failed'}`)

    // Teste 7: Obter estatísticas
    console.log('\n7. Getting notification statistics...')
    const stats = await auditNotificationService.getNotificationStats()
    console.log('✅ Notification stats:', {
      queueStats: stats.queue,
      emailConfigured: stats.services.emailConfigured,
      smsConfigured: stats.services.smsConfigured,
      recipientCounts: stats.recipients
    })

    // Teste 8: Testar sistema completo
    console.log('\n8. Testing complete notification system...')
    const testResults = await auditNotificationService.testNotifications({
      emails: ['test@example.com'],
      phones: ['+5511999999999']
    })
    console.log('✅ Complete system test:', testResults)

    console.log('\n🎉 All notification tests completed!')
    
    // Resumo dos resultados
    console.log('\n📊 Test Summary:')
    console.log(`- Email Service: ${emailConfigured ? '✅' : '❌'}`)
    console.log(`- SMS Service: ${smsConfigured ? '✅' : '❌'}`)
    console.log(`- Security Notifications: ${securityNotificationSent ? '✅' : '❌'}`)
    console.log(`- Critical Alerts: ${criticalAlertSent ? '✅' : '❌'}`)
    console.log(`- Report Notifications: ${reportNotificationSent ? '✅' : '❌'}`)
    console.log(`- Compliance Alerts: ${complianceAlertSent ? '✅' : '❌'}`)

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

// Execute tests
testNotificationSystem()
  .then(() => {
    console.log('\n✨ Notification system test completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Notification test suite failed:', error)
    process.exit(1)
  })