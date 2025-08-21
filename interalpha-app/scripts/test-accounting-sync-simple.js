#!/usr/bin/env node

/**
 * Script de teste simplificado para sincronização contábil
 * Testa apenas as funcionalidades do banco de dados e serviços
 */

const { PrismaClient } = require('@prisma/client')
const path = require('path')

// Importar serviços (simulando o ambiente Next.js)
const prisma = new PrismaClient()

// Dados de teste
const testData = {
  system: {
    name: 'Sistema Teste',
    type: 'generic',
    baseUrl: 'https://api.teste.com/v1',
    apiKey: 'test-api-key-123',
    config: {
      defaultPaymentCategory: 'services',
      defaultExpenseCategory: 'operational',
      endpoints: {
        payments: '/payments',
        invoices: '/invoices',
        expenses: '/expenses'
      }
    }
  },
  payment: {
    valor: 50000, // R$ 500,00 em centavos
    descricao: 'Pagamento de teste',
    dataPagamento: new Date(),
    status: 'CONFIRMADO',
    metodo: 'PIX'
  },
  invoice: {
    numero: 'INV-TEST-001',
    valor: 75000, // R$ 750,00 em centavos
    status: 'PENDENTE',
    dataVencimento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
    itens: [
      {
        descricao: 'Serviço de consultoria',
        quantidade: 1,
        valorUnitario: 75000,
        valorTotal: 75000
      }
    ]
  }
}

async function testDatabaseOperations() {
  console.log('🔧 Testando operações do banco de dados...')

  try {
    // 1. Criar usuário de teste
    const user = await prisma.user.upsert({
      where: { email: 'teste@accounting.com' },
      update: {},
      create: {
        clerkId: 'test-accounting-user',
        email: 'teste@accounting.com',
        name: 'Usuário Teste Contábil'
      }
    })
    console.log(`✅ Usuário criado: ${user.id}`)

    // 2. Criar cliente de teste
    const client = await prisma.cliente.upsert({
      where: { documento: '12345678901' },
      update: {},
      create: {
        nome: 'Cliente Teste Contábil',
        email: 'cliente@teste.com',
        documento: '12345678901',
        tipoDocumento: 'CPF',
        userId: user.id
      }
    })
    console.log(`✅ Cliente criado: ${client.id}`)

    // 3. Criar sistema contábil
    const system = await prisma.accountingSystem.create({
      data: testData.system
    })
    console.log(`✅ Sistema contábil criado: ${system.id}`)

    // 4. Criar pagamento de teste
    const payment = await prisma.pagamento.create({
      data: {
        ...testData.payment,
        userId: user.id
      }
    })
    console.log(`✅ Pagamento criado: ${payment.id}`)

    // 5. Criar ordem de serviço de teste
    const invoice = await prisma.ordemServico.create({
      data: {
        titulo: 'Ordem de Serviço Teste',
        descricao: 'Ordem de serviço para teste de sincronização contábil',
        status: 'CONCLUIDA',
        valor: testData.invoice.valor,
        userId: user.id,
        clienteId: client.id
      }
    })
    console.log(`✅ Ordem de serviço criada: ${invoice.id}`)

    // 6. Criar registro de sincronização
    const sync = await prisma.accountingSync.create({
      data: {
        entityType: 'payment',
        entityId: payment.id,
        systemId: system.id,
        status: 'pending',
        retryCount: 0
      }
    })
    console.log(`✅ Sincronização criada: ${sync.id}`)

    // 7. Simular sucesso na sincronização
    const updatedSync = await prisma.accountingSync.update({
      where: { id: sync.id },
      data: {
        status: 'success',
        externalId: 'ext-payment-123',
        lastSyncAt: new Date()
      }
    })
    console.log(`✅ Sincronização atualizada: ${updatedSync.status}`)

    // 8. Criar conflito de teste
    const conflict = await prisma.accountingConflict.create({
      data: {
        syncId: sync.id,
        localData: {
          valor: 50000,
          descricao: 'Pagamento local'
        },
        externalData: {
          valor: 55000,
          descricao: 'Pagamento externo'
        },
        conflictFields: ['valor', 'descricao']
      }
    })
    console.log(`✅ Conflito criado: ${conflict.id}`)

    // 9. Resolver conflito
    const resolvedConflict = await prisma.accountingConflict.update({
      where: { id: conflict.id },
      data: {
        resolution: 'use_local',
        resolvedData: conflict.localData,
        resolvedBy: user.id,
        resolvedAt: new Date(),
        notes: 'Teste de resolução automática'
      }
    })
    console.log(`✅ Conflito resolvido: ${resolvedConflict.resolution}`)

    // 10. Criar log de sincronização
    const syncLog = await prisma.accountingSyncLog.create({
      data: {
        syncId: sync.id,
        action: 'sync_completed',
        details: {
          externalId: 'ext-payment-123',
          duration: 1500
        }
      }
    })
    console.log(`✅ Log de sincronização criado: ${syncLog.id}`)

    return { user, client, system, payment, invoice, sync, conflict, syncLog }
  } catch (error) {
    console.error('❌ Erro nas operações do banco:', error)
    throw error
  }
}

async function testQueries() {
  console.log('🔧 Testando consultas do banco...')

  try {
    // 1. Listar sistemas contábeis
    const systems = await prisma.accountingSystem.findMany({
      include: {
        _count: {
          select: {
            syncRecords: true
          }
        }
      }
    })
    console.log(`✅ Encontrados ${systems.length} sistemas contábeis`)

    // 2. Listar sincronizações
    const syncs = await prisma.accountingSync.findMany({
      include: {
        system: {
          select: {
            name: true,
            type: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })
    console.log(`✅ Encontradas ${syncs.length} sincronizações`)

    // 3. Listar conflitos
    const conflicts = await prisma.accountingConflict.findMany({
      where: {
        resolvedAt: { not: null }
      }
    })
    console.log(`✅ Encontrados ${conflicts.length} conflitos resolvidos`)

    // 4. Estatísticas de sincronização
    const stats = await prisma.accountingSync.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    })
    console.log('✅ Estatísticas de sincronização:')
    stats.forEach(stat => {
      console.log(`  - ${stat.status}: ${stat._count.status}`)
    })

    // 5. Sincronizações por sistema
    const syncsBySystem = await prisma.accountingSync.groupBy({
      by: ['systemId'],
      _count: {
        systemId: true
      }
    })
    console.log(`✅ Sincronizações por sistema: ${syncsBySystem.length} sistemas`)

    return { systems, syncs, conflicts, stats, syncsBySystem }
  } catch (error) {
    console.error('❌ Erro nas consultas:', error)
    throw error
  }
}

async function testAdapterLogic() {
  console.log('🔧 Testando lógica dos adaptadores...')

  try {
    // Simular adaptador genérico
    const GenericAdapter = class {
      constructor(apiKey, baseUrl, config) {
        this.apiKey = apiKey
        this.baseUrl = baseUrl
        this.config = config
      }

      formatCurrency(amount) {
        return (amount / 100).toFixed(2)
      }

      parseDate(date) {
        return date.toISOString().split('T')[0]
      }

      validateRequiredFields(data, requiredFields) {
        const missingFields = requiredFields.filter(field => !data[field])
        if (missingFields.length > 0) {
          throw new Error(`Campos obrigatórios ausentes: ${missingFields.join(', ')}`)
        }
      }

      async syncPayment(payment) {
        try {
          this.validateRequiredFields(payment, ['valor', 'descricao'])

          const paymentData = {
            id: payment.id,
            amount: this.formatCurrency(payment.valor),
            description: payment.descricao,
            date: this.parseDate(new Date(payment.dataPagamento)),
            type: 'income',
            category: this.config.defaultPaymentCategory || 'services'
          }

          // Simular sucesso
          return {
            success: true,
            externalId: `ext-${payment.id}`,
            timestamp: new Date(),
            retryCount: 0
          }
        } catch (error) {
          return {
            success: false,
            errorMessage: error.message,
            timestamp: new Date(),
            retryCount: 0
          }
        }
      }
    }

    // Testar adaptador
    const adapter = new GenericAdapter('test-key', 'https://api.test.com', {
      defaultPaymentCategory: 'services'
    })

    const testPayment = {
      id: 'test-payment-123',
      valor: 50000,
      descricao: 'Pagamento de teste',
      dataPagamento: new Date()
    }

    const result = await adapter.syncPayment(testPayment)
    console.log(`✅ Teste do adaptador: ${result.success ? 'sucesso' : 'falha'}`)
    
    if (result.success) {
      console.log(`  - ID externo: ${result.externalId}`)
    } else {
      console.log(`  - Erro: ${result.errorMessage}`)
    }

    // Testar formatação
    console.log(`✅ Formatação de moeda: R$ ${adapter.formatCurrency(50000)}`)
    console.log(`✅ Formatação de data: ${adapter.parseDate(new Date())}`)

    // Testar validação
    try {
      adapter.validateRequiredFields({}, ['valor', 'descricao'])
    } catch (error) {
      console.log(`✅ Validação funcionando: ${error.message}`)
    }

    return { adapter, result }
  } catch (error) {
    console.error('❌ Erro na lógica dos adaptadores:', error)
    throw error
  }
}

async function cleanup() {
  console.log('🧹 Limpando dados de teste...')

  try {
    // Remover em ordem devido às dependências
    await prisma.accountingSyncLog.deleteMany({
      where: {
        details: {
          path: ['externalId'],
          equals: 'ext-payment-123'
        }
      }
    })

    await prisma.accountingConflict.deleteMany({
      where: {
        notes: 'Teste de resolução automática'
      }
    })

    await prisma.accountingSync.deleteMany({
      where: {
        system: {
          name: 'Sistema Teste'
        }
      }
    })

    await prisma.accountingSystem.deleteMany({
      where: {
        name: 'Sistema Teste'
      }
    })

    await prisma.pagamento.deleteMany({
      where: {
        descricao: 'Pagamento de teste'
      }
    })

    await prisma.ordemServico.deleteMany({
      where: {
        titulo: 'Ordem de Serviço Teste'
      }
    })

    await prisma.cliente.deleteMany({
      where: {
        documento: '12345678901'
      }
    })

    await prisma.user.deleteMany({
      where: {
        email: 'teste@accounting.com'
      }
    })

    console.log('✅ Limpeza concluída')
  } catch (error) {
    console.log('❌ Erro na limpeza:', error.message)
  }
}

async function runTests() {
  console.log('🚀 Iniciando testes simplificados de sincronização contábil...\n')

  try {
    // 1. Testar operações do banco
    console.log('=== TESTE 1: OPERAÇÕES DO BANCO ===')
    const dbResults = await testDatabaseOperations()
    console.log('')

    // 2. Testar consultas
    console.log('=== TESTE 2: CONSULTAS ===')
    const queryResults = await testQueries()
    console.log('')

    // 3. Testar lógica dos adaptadores
    console.log('=== TESTE 3: LÓGICA DOS ADAPTADORES ===')
    const adapterResults = await testAdapterLogic()
    console.log('')

    console.log('✅ Todos os testes concluídos com sucesso!')
    console.log('\n📊 RESUMO DOS TESTES:')
    console.log(`- Sistemas contábeis: ${queryResults.systems.length}`)
    console.log(`- Sincronizações: ${queryResults.syncs.length}`)
    console.log(`- Conflitos resolvidos: ${queryResults.conflicts.length}`)
    console.log(`- Adaptador genérico: ${adapterResults.result.success ? 'funcionando' : 'com erro'}`)

  } catch (error) {
    console.error('❌ Erro durante os testes:', error)
  } finally {
    // Limpeza
    console.log('')
    await cleanup()
    await prisma.$disconnect()
  }
}

// Executar testes se o script for chamado diretamente
if (require.main === module) {
  runTests().catch(console.error)
}

module.exports = {
  runTests,
  testDatabaseOperations,
  testQueries,
  testAdapterLogic,
  cleanup
}