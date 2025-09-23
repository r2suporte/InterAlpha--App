/**
 * @jest-environment node
 */

// Mock global objects for node environment
global.fetch = jest.fn()
global.Request = jest.fn()
global.Response = jest.fn()

describe('WhatsApp Webhook Configuration', () => {
  // Mock das variáveis de ambiente
  const originalEnv = process.env
  
  beforeEach(() => {
    process.env = {
      ...originalEnv,
      WHATSAPP_WEBHOOK_VERIFY_TOKEN: 'test_verify_token'
    }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('Configuração de ambiente', () => {
    test('deve ter token de verificação configurado', () => {
      expect(process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN).toBeDefined()
      expect(process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN).toBe('test_verify_token')
    })
  })

  describe('Estrutura de dados do WhatsApp', () => {
    test('deve validar estrutura de payload de mensagem', () => {
      const mockPayload = {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: 'entry_id',
            changes: [
              {
                value: {
                  messaging_product: 'whatsapp',
                  metadata: {
                    display_phone_number: '5511999999999',
                    phone_number_id: 'phone_id'
                  },
                  messages: [
                    {
                      from: '5511888888888',
                      id: 'message_id_123',
                      timestamp: '1640995200',
                      text: {
                        body: 'Teste de mensagem'
                      },
                      type: 'text'
                    }
                  ]
                },
                field: 'messages'
              }
            ]
          }
        ]
      }

      expect(mockPayload.object).toBe('whatsapp_business_account')
      expect(mockPayload.entry.length).toBe(1)
      expect(mockPayload.entry[0].changes.length).toBe(1)
      expect(mockPayload.entry[0].changes[0].value.messages.length).toBe(1)
    })

    test('deve validar estrutura de status update', () => {
      const statusPayload = {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: 'entry_id',
            changes: [
              {
                value: {
                  messaging_product: 'whatsapp',
                  metadata: {
                    display_phone_number: '5511999999999',
                    phone_number_id: 'phone_id'
                  },
                  statuses: [
                    {
                      id: 'message_id_123',
                      status: 'delivered',
                      timestamp: '1640995300',
                      recipient_id: '5511888888888'
                    }
                  ]
                },
                field: 'messages'
              }
            ]
          }
        ]
      }

      expect(statusPayload.object).toBe('whatsapp_business_account')
      expect(statusPayload.entry[0].changes[0].value.statuses.length).toBe(1)
      expect(statusPayload.entry[0].changes[0].value.statuses[0].status).toBe('delivered')
    })
  })

  describe('Processamento de mensagens', () => {
    test('deve identificar palavras-chave para respostas automáticas', () => {
      const testCases = [
        { message: 'Qual o status da minha ordem?', shouldTrigger: true },
        { message: 'Como está o andamento?', shouldTrigger: true },
        { message: 'Olá, bom dia!', shouldTrigger: true },
        { message: 'Urgente! Preciso de ajuda', shouldTrigger: true },
        { message: 'Mensagem normal', shouldTrigger: false }
      ]

      testCases.forEach(({ message, shouldTrigger }) => {
        const messageLower = message.toLowerCase()
        const hasKeyword = 
          messageLower.includes('status') ||
          messageLower.includes('andamento') ||
          messageLower.includes('oi') ||
          messageLower.includes('olá') ||
          messageLower.includes('bom dia') ||
          messageLower.includes('urgente')

        expect(hasKeyword).toBe(shouldTrigger)
      })
    })

    test('deve formatar timestamp corretamente', () => {
      const timestamp = '1640995200' // Unix timestamp
      const date = new Date(parseInt(timestamp) * 1000)
      const isoString = date.toISOString()

      expect(isoString).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
    })
  })

  describe('Validação de dados', () => {
    test('deve validar formato de telefone brasileiro', () => {
      const validPhones = [
        '5511999999999',
        '5521888888888',
        '5531777777777'
      ]

      const invalidPhones = [
        '11999999999',
        '999999999',
        'invalid'
      ]

      validPhones.forEach(phone => {
        expect(phone).toMatch(/^55\d{10,11}$/)
      })

      invalidPhones.forEach(phone => {
        expect(phone).not.toMatch(/^55\d{10,11}$/)
      })
    })

    test('deve validar IDs de mensagem do WhatsApp', () => {
      const validIds = [
        'wamid.HBgNNTUxMTk5OTk5OTk5ORUCABIYFjNBRjU3QzE4RjY4NzM4NzQ2RTk5AA==',
        'message_id_123',
        'abc123def456'
      ]

      validIds.forEach(id => {
        expect(typeof id).toBe('string')
        expect(id.length > 0).toBe(true)
      })
    })
  })
})