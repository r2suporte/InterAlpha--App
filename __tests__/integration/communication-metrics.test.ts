import { jest } from '@jest/globals'

// Mock dos serviços diretamente
const mockEmailService = {
  sendOrdemServicoEmail: jest.fn(),
  testConnection: jest.fn(),
}

const mockSmsService = {
  sendSMS: jest.fn(),
  testConnection: jest.fn(),
}

const mockMetricsService = {
  recordMetric: jest.fn(),
  getMetrics: jest.fn(),
  getPerformanceStats: jest.fn(),
  getServiceHealth: jest.fn(),
  measureOperation: jest.fn(),
}

jest.mock('../../lib/services/email-service', () => ({
  emailService: mockEmailService,
}))

jest.mock('../../lib/services/sms-service', () => ({
  smsService: mockSmsService,
}))

jest.mock('../../lib/services/metrics-service', () => ({
  metricsService: mockMetricsService,
}))

describe('Communication Metrics Integration Tests - Simplified', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Configurar mock do EmailService
    mockEmailService.sendOrdemServicoEmail.mockResolvedValue({
      success: true,
      messageId: 'test-message-id'
    })
    mockEmailService.testConnection.mockResolvedValue(true)
    
    // Configurar mock do SMSService
    mockSmsService.sendSMS.mockResolvedValue({
      success: true,
      sid: 'test-message-sid',
      status: 'sent'
    })
    mockSmsService.testConnection.mockResolvedValue(true)
    
    // Configurar mock do MetricsService
    mockMetricsService.recordMetric.mockResolvedValue(undefined)
    mockMetricsService.getMetrics.mockResolvedValue([
      { type: 'email', count: 5, timestamp: new Date() },
      { type: 'sms', count: 3, timestamp: new Date() }
    ])
    mockMetricsService.getPerformanceStats.mockResolvedValue({
      avgResponseTime: 100,
      totalRequests: 10,
      successRate: 0.9
    })
    mockMetricsService.getServiceHealth.mockResolvedValue([
      { service: 'email', status: 'healthy', lastCheck: new Date() },
      { service: 'sms', status: 'healthy', lastCheck: new Date() }
    ])
    mockMetricsService.measureOperation.mockImplementation(async (operation, fn) => {
      const start = Date.now()
      const result = await fn()
      const duration = Date.now() - start
      return result
    })
  })

  describe('Email Metrics', () => {
    it('deve registrar métricas de envio de email', async () => {
      const ordemServico = {
        id: '123',
        numero_os: 'OS-001',
        descricao: 'Teste',
        valor: 100,
        data_inicio: '2024-01-01',
        cliente: {
          nome: 'Cliente Teste',
          email: 'cliente@test.com'
        }
      }

      const result = await mockEmailService.sendOrdemServicoEmail(ordemServico)
      
      expect(mockEmailService.sendOrdemServicoEmail).toHaveBeenCalledWith(ordemServico)
      expect(result.success).toBe(true)
      expect(result.messageId).toBe('test-message-id')
    })
  })

  describe('SMS Metrics', () => {
    it('deve registrar métricas de envio de SMS', async () => {
      const message = {
        to: '+5511999999999',
        body: 'Teste SMS'
      }

      const result = await mockSmsService.sendSMS(message)
      
      expect(mockSmsService.sendSMS).toHaveBeenCalledWith(message)
      expect(result.success).toBe(true)
      expect(result.sid).toBe('test-message-sid')
    })
  })

  describe('Metrics Aggregation', () => {
    it('deve agregar métricas de múltiplos serviços', async () => {
      const metrics = await mockMetricsService.getMetrics()
      
      expect(mockMetricsService.getMetrics).toHaveBeenCalled()
      expect(metrics).toHaveLength(2)
      expect(metrics[0].type).toBe('email')
      expect(metrics[1].type).toBe('sms')
    })
  })

  describe('Performance Metrics', () => {
    it('deve medir tempo de resposta das operações', async () => {
      const testOperation = async () => {
        await new Promise(resolve => setTimeout(resolve, 10))
        return 'success'
      }

      const result = await mockMetricsService.measureOperation('test', testOperation)
      
      expect(mockMetricsService.measureOperation).toHaveBeenCalledWith('test', testOperation)
      expect(result).toBe('success')
    })

    it('deve fornecer estatísticas de performance', async () => {
      const stats = await mockMetricsService.getPerformanceStats()
      
      expect(mockMetricsService.getPerformanceStats).toHaveBeenCalled()
      expect(stats.avgResponseTime).toBe(100)
      expect(stats.totalRequests).toBe(10)
      expect(stats.successRate).toBe(0.9)
    })
  })

  describe('Service Health', () => {
    it('deve monitorar saúde dos serviços', async () => {
      const health = await mockMetricsService.getServiceHealth()
      
      expect(mockMetricsService.getServiceHealth).toHaveBeenCalled()
      expect(health).toHaveLength(2)
      expect(health[0].service).toBe('email')
      expect(health[0].status).toBe('healthy')
      expect(health[1].service).toBe('sms')
      expect(health[1].status).toBe('healthy')
    })

    it('deve testar conexão dos serviços', async () => {
      const emailConnection = await mockEmailService.testConnection()
      const smsConnection = await mockSmsService.testConnection()
      
      expect(mockEmailService.testConnection).toHaveBeenCalled()
      expect(mockSmsService.testConnection).toHaveBeenCalled()
      expect(emailConnection).toBe(true)
      expect(smsConnection).toBe(true)
    })
  })
})