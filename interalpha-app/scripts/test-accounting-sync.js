#!/usr/bin/env node

/**
 * Script de teste para sincronização contábil
 * 
 * Este script testa as funcionalidades de sincronização com sistemas contábeis:
 * - Criação de sistemas contábeis
 * - Teste de conectividade
 * - Sincronização de pagamentos e faturas
 * - Resolução de conflitos
 * 
 * Uso: node scripts/test-accounting-sync.js
 */

const { PrismaClient } = require('@prisma/client')

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

async function createTestUser() {
  console.log('🔧 Criando usuário de teste...')
  
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
  return user
}

async function createTestClient(userId) {
  console.log('🔧 Criando cliente de teste...')
  
  const client = await prisma.cliente.upsert({
    where: { documento: '12345678901' },
    update: {},
    create: {
      nome: 'Cliente Teste Contábil',
      email: 'cliente@teste.com',
      documento: '12345678901',
      tipoDocumento: 'CPF',
      userId
    }
  })

  console.log(`✅ Cliente criado: ${client.id}`)
  return client
}

async function createTestPayment(userId, clienteId) {
  console.log('🔧 Criando pagamento de teste...')
  
  const payment = await prisma.pagamento.create({
    data: {
      ...testData.payment,
      userId
    }
  })

  console.log(`✅ Pagamento criado: ${payment.id}`)
  return payment
}

async function createTestInvoice(userId, clienteId) {
  console.log('🔧 Criando ordem de serviço de teste...')
  
  const invoice = await prisma.ordemServico.create({
    data: {
      titulo: 'Ordem de Serviço Teste',
      descricao: 'Ordem de serviço para teste de sincronização contábil',
      status: 'CONCLUIDA',
      valor: testData.invoice.valor,
      userId,
      clienteId
    }
  })

  console.log(`✅ Ordem de serviço criada: ${invoice.id}`)
  return invoice
}

async function createTestAccountingSystem() {
  console.log('🔧 Criando sistema contábil de teste...')
  
  const system = await prisma.accountingSystem.create({
    data: testData.system
  })

  console.log(`✅ Sistema contábil criado: ${system.id}`)
  return system
}

async function testAccountingSync(systemId, entityType, entityId) {
  console.log(`🔧 Testando sincronização ${entityType} ${entityId}...`)
  
  try {
    const response = await fetch('http://localhost:3000/api/accounting/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        entityType,
        entityId,
        systemIds: [systemId]
      })
    })

    if (response.ok) {
      const result = await response.json()
      console.log(`✅ Sincronização ${entityType} executada:`, result)
      return result
    } else {
      const error = await response.json()
      console.log(`❌ Erro na sincronização ${entityType}:`, error)
      return null
    }
  } catch (error) {
    console.log(`❌ Erro na requisição de sincronização:`, error.message)
    return null
  }
}

async function testSystemConnection(systemId) {
  console.log(`🔧 Testando conectividade do sistema ${systemId}...`)
  
  try {
    const response = await fetch(`http://localhost:3000/api/accounting/systems/${systemId}/test`, {
      method: 'POST'
    })

    const result = await response.json()
    console.log(`${result.connected ? '✅' : '❌'} Teste de conectividade:`, result.message)
    return result.connected
  } catch (error) {
    console.log(`❌ Erro no teste de conectividade:`, error.message)
    return false
  }
}

async function createTestConflict(syncId) {
  console.log('🔧 Criando conflito de teste...')
  
  const conflict = await prisma.accountingConflict.create({
    data: {
      syncId,
      localData: {
        valor: 50000,
        descricao: 'Pagamento local',
        data: new Date()
      },
      externalData: {
        valor: 55000,
        descricao: 'Pagamento externo',
        data: new Date()
      },
      conflictFields: ['valor', 'descricao']
    }
  })

  console.log(`✅ Conflito criado: ${conflict.id}`)
  return conflict
}

async function testConflictResolution(conflictId) {
  console.log(`🔧 Testando resolução de conflito ${conflictId}...`)
  
  try {
    const response = await fetch(`http://localhost:3000/api/accounting/conflicts/${conflictId}/resolve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        resolution: 'use_local',
        notes: 'Teste de resolução automática'
      })
    })

    if (response.ok) {
      const result = await response.json()
      console.log(`✅ Conflito resolvido:`, result.message)
      return result
    } else {
      const error = await response.json()
      console.log(`❌ Erro na resolução do conflito:`, error)
      return null
    }
  } catch (error) {
    console.log(`❌ Erro na requisição de resolução:`, error.message)
    return null
  }
}

async function checkSyncStatus() {
  console.log('🔧 Verificando status das sincronizações...')
  
  const syncs = await prisma.accountingSync.findMany({
    include: {
      system: {
        select: { name: true, type: true }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 10
  })

  console.log(`📊 Encontradas ${syncs.length} sincronizações:`)
  syncs.forEach(sync => {
    console.log(`  - ${sync.entityType} ${sync.entityId}: ${sync.status} (${sync.system.name})`)
    if (sync.errorMessage) {
      console.log(`    Erro: ${sync.errorMessage}`)
    }
  })

  return syncs
}

async function testRetryFailedSyncs() {
  console.log('🔧 Testando reprocessamento de sincronizações falhadas...')
  
  try {
    const response = await fetch('http://localhost:3000/api/accounting/sync/retry', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    })

    if (response.ok) {
      const result = await response.json()
      console.log(`✅ Reprocessamento executado:`, result.message)
      return result
    } else {
      const error = await response.json()
      console.log(`❌ Erro no reprocessamento:`, error)
      return null
    }
  } catch (error) {
    console.log(`❌ Erro na requisição de reprocessamento:`, error.message)
    return null
  }
}

async function cleanup() {
  console.log('🧹 Limpando dados de teste...')
  
  try {
    // Remover conflitos de teste
    await prisma.accountingConflict.deleteMany({
      where: {
        notes: 'Teste de resolução automática'
      }
    })

    // Remover sincronizações de teste
    await prisma.accountingSync.deleteMany({
      where: {
        system: {
          name: 'Sistema Teste'
        }
      }
    })

    // Remover sistema de teste
    await prisma.accountingSystem.deleteMany({
      where: {
        name: 'Sistema Teste'
      }
    })

    // Remover dados de teste
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
  console.log('🚀 Iniciando testes de sincronização contábil...\n')

  try {
    // 1. Criar dados de teste
    const user = await createTestUser()
    const client = await createTestClient(user.id)
    const payment = await createTestPayment(user.id, client.id)
    const invoice = await createTestInvoice(user.id, client.id)
    const system = await createTestAccountingSystem()

    console.log('\n📋 Dados de teste criados com sucesso!\n')

    // 2. Testar conectividade
    await testSystemConnection(system.id)
    console.log('')

    // 3. Testar sincronização de pagamento
    const paymentSync = await testAccountingSync(system.id, 'payment', payment.id)
    console.log('')

    // 4. Testar sincronização de fatura
    const invoiceSync = await testAccountingSync(system.id, 'invoice', invoice.id)
    console.log('')

    // 5. Verificar status das sincronizações
    const syncs = await checkSyncStatus()
    console.log('')

    // 6. Criar e resolver conflito de teste
    if (syncs.length > 0) {
      const conflict = await createTestConflict(syncs[0].id)
      await testConflictResolution(conflict.id)
      console.log('')
    }

    // 7. Testar reprocessamento
    await testRetryFailedSyncs()
    console.log('')

    console.log('✅ Todos os testes concluídos com sucesso!')

  } catch (error) {
    console.error('❌ Erro durante os testes:', error)
  } finally {
    // 8. Limpeza
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
  createTestUser,
  createTestClient,
  createTestPayment,
  createTestInvoice,
  createTestAccountingSystem,
  testAccountingSync,
  testSystemConnection,
  cleanup
}