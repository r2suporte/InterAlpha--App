const { auditService } = require('../src/services/audit/audit-service.ts')

async function testAuditSystem() {
  console.log('🧪 Testing Audit System...')

  try {
    // Teste 1: Criar entrada de auditoria
    console.log('\n1. Testing audit entry creation...')
    const auditEntry = await auditService.logAction(
      'test-user-123',
      'employee',
      'create_client',
      'clients',
      {
        resourceId: 'client-456',
        newData: { name: 'Test Client', email: 'test@example.com' },
        ipAddress: '192.168.1.1',
        userAgent: 'Test Agent',
        metadata: { test: true }
      }
    )
    console.log('✅ Audit entry created:', auditEntry.id)

    // Teste 2: Criar log de acesso
    console.log('\n2. Testing access log creation...')
    const accessLog = await auditService.logAccess(
      'test-user-123',
      'employee',
      'login',
      {
        ipAddress: '192.168.1.1',
        userAgent: 'Test Agent',
        location: 'São Paulo, BR',
        success: true,
        sessionDuration: 3600
      }
    )
    console.log('✅ Access log created:', accessLog.id)

    // Teste 3: Criar evento de segurança
    console.log('\n3. Testing security event creation...')
    const securityEvent = await auditService.logSecurityEvent(
      'SUSPICIOUS_LOGIN',
      'MEDIUM',
      'Login from unusual location detected',
      {
        userId: 'test-user-123',
        ipAddress: '192.168.1.1',
        userAgent: 'Test Agent',
        details: {
          location: 'Unknown Location',
          previousLocations: ['São Paulo, BR']
        }
      }
    )
    console.log('✅ Security event created:', securityEvent.id)

    // Teste 4: Buscar logs de auditoria
    console.log('\n4. Testing audit logs retrieval...')
    const auditLogs = await auditService.getAuditLogs({
      userId: 'test-user-123',
      page: 1,
      limit: 10
    })
    console.log('✅ Retrieved audit logs:', auditLogs.total, 'entries')

    // Teste 5: Buscar logs de acesso
    console.log('\n5. Testing access logs retrieval...')
    const accessLogs = await auditService.getAccessLogs({
      userId: 'test-user-123',
      page: 1,
      limit: 10
    })
    console.log('✅ Retrieved access logs:', accessLogs.total, 'entries')

    // Teste 6: Buscar eventos de segurança
    console.log('\n6. Testing security events retrieval...')
    const securityEvents = await auditService.getSecurityEvents({
      userId: 'test-user-123',
      page: 1,
      limit: 10
    })
    console.log('✅ Retrieved security events:', securityEvents.total, 'entries')

    // Teste 7: Obter configurações
    console.log('\n7. Testing audit config retrieval...')
    const config = await auditService.getAuditConfig()
    console.log('✅ Retrieved audit config:', config.enableAuditLogging ? 'enabled' : 'disabled')

    // Teste 8: Gerar relatório
    console.log('\n8. Testing audit report generation...')
    const report = await auditService.generateAuditReport(
      'Test Report',
      'Report generated for testing purposes',
      {
        userId: 'test-user-123',
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
        endDate: new Date()
      },
      'test-admin',
      'json'
    )
    console.log('✅ Generated audit report:', report.id)

    console.log('\n🎉 All tests passed! Audit system is working correctly.')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

// Execute tests
testAuditSystem()
  .then(() => {
    console.log('\n✨ Test completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Test suite failed:', error)
    process.exit(1)
  })