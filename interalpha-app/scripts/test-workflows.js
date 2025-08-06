#!/usr/bin/env node

/**
 * Script para testar o sistema de workflows
 * Execute com: node scripts/test-workflows.js
 */

const axios = require('axios');

const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

async function testWorkflowSystem() {
  console.log('🧪 Testando sistema de workflows...\n');

  try {
    // 1. Listar regras existentes
    console.log('1. Listando regras de workflow...');
    const rulesResponse = await axios.get(`${baseUrl}/api/integrations/workflows`);
    console.log('✅ Regras encontradas:', rulesResponse.data.totalRules);
    console.log('✅ Regras ativas:', rulesResponse.data.activeRules);
    
    // Mostrar regras
    rulesResponse.data.rules.forEach((rule, index) => {
      console.log(`   ${index + 1}. ${rule.name} (${rule.isActive ? 'Ativa' : 'Inativa'})`);
      console.log(`      Trigger: ${rule.trigger.type}`);
      console.log(`      Ações: ${rule.actions.length}`);
    });
    console.log('');

    // 2. Testar workflow de ordem criada
    console.log('2. Testando workflow de ordem criada...');
    const orderCreatedTest = await axios.post(`${baseUrl}/api/integrations/workflows`, {
      action: 'test_workflow',
      triggerType: 'order_created',
      testData: {
        entityId: 'test-order-001',
        titulo: 'Teste de Ordem',
        status: 'PENDENTE',
        prioridade: 'ALTA',
        clienteId: 'test-client-001',
        valor: 150.00,
      }
    });
    console.log('✅ Teste de ordem criada:', orderCreatedTest.data.message);
    console.log('');

    // 3. Testar workflow de mudança de status
    console.log('3. Testando workflow de mudança de status...');
    const statusChangedTest = await axios.post(`${baseUrl}/api/integrations/workflows`, {
      action: 'test_workflow',
      triggerType: 'order_status_changed',
      testData: {
        entityId: 'test-order-001',
        titulo: 'Teste de Ordem',
        previousStatus: 'PENDENTE',
        newStatus: 'CONCLUIDA',
        prioridade: 'ALTA',
        clienteId: 'test-client-001',
      }
    });
    console.log('✅ Teste de mudança de status:', statusChangedTest.data.message);
    console.log('');

    // 4. Testar workflow de pagamento em atraso
    console.log('4. Testando workflow de pagamento em atraso...');
    const paymentOverdueTest = await axios.post(`${baseUrl}/api/integrations/workflows`, {
      action: 'test_workflow',
      triggerType: 'payment_overdue',
      testData: {
        entityId: 'test-payment-001',
        amount: 200.00,
        daysOverdue: 7,
        clienteId: 'test-client-001',
        ordemServicoId: 'test-order-001',
      }
    });
    console.log('✅ Teste de pagamento em atraso:', paymentOverdueTest.data.message);
    console.log('');

    // 5. Testar criação de regra personalizada
    console.log('5. Testando criação de regra personalizada...');
    const customRule = {
      action: 'create_rule',
      id: 'test-custom-rule',
      name: 'Regra de Teste Personalizada',
      description: 'Regra criada para teste do sistema',
      trigger: {
        type: 'order_created',
        conditions: [
          { field: 'valor', operator: 'greater_than', value: 500 }
        ]
      },
      actions: [
        {
          type: 'send_email',
          config: {
            template: 'high-value-order',
            subject: 'Ordem de Alto Valor Criada'
          }
        }
      ],
      isActive: true,
      priority: 2
    };

    const createRuleResponse = await axios.post(`${baseUrl}/api/integrations/workflows`, customRule);
    console.log('✅ Regra personalizada criada:', createRuleResponse.data.message);
    console.log('');

    // 6. Testar ativação/desativação de regra
    console.log('6. Testando ativação/desativação de regra...');
    const toggleResponse = await axios.post(`${baseUrl}/api/integrations/workflows/test-custom-rule/toggle`);
    console.log('✅ Status da regra alterado:', toggleResponse.data.message);
    console.log('');

    // 7. Verificar estatísticas das filas
    console.log('7. Verificando estatísticas das filas...');
    const statsResponse = await axios.get(`${baseUrl}/api/integrations/queues/stats`);
    const workflowStats = statsResponse.data.queues.find(q => q.name === 'workflow');
    if (workflowStats) {
      console.log('✅ Estatísticas da fila de workflows:');
      console.log(`   Aguardando: ${workflowStats.waiting}`);
      console.log(`   Ativo: ${workflowStats.active}`);
      console.log(`   Concluído: ${workflowStats.completed}`);
      console.log(`   Falhou: ${workflowStats.failed}`);
    }
    console.log('');

    // 8. Limpar regra de teste
    console.log('8. Limpando regra de teste...');
    try {
      await axios.delete(`${baseUrl}/api/integrations/workflows/test-custom-rule`);
      console.log('✅ Regra de teste removida');
    } catch (deleteError) {
      console.log('⚠️  Regra de teste não foi removida (pode não existir)');
    }
    console.log('');

    console.log('🎉 Todos os testes de workflow foram executados com sucesso!');
    console.log('');
    console.log('💡 Dicas:');
    console.log('- Monitore os logs da aplicação para ver a execução dos workflows');
    console.log('- Verifique as filas de email e SMS para ver as notificações geradas');
    console.log('- Use as APIs para criar regras personalizadas conforme necessário');
    console.log('- Workflows são executados de forma assíncrona via filas BullMQ');

  } catch (error) {
    console.error('❌ Erro no teste de workflows:', error.response?.data || error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Certifique-se de que a aplicação está rodando:');
      console.log('   npm run dev');
    } else if (error.response?.status === 404) {
      console.log('\n💡 Endpoint não encontrado - verifique se os workflows estão implementados');
    }
    
    process.exit(1);
  }
}

// Verificar se a aplicação está rodando
async function checkServer() {
  try {
    await axios.get(`${baseUrl}/api/integrations/health`);
    return true;
  } catch (error) {
    return false;
  }
}

async function main() {
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    console.log('❌ Aplicação não está rodando em', baseUrl);
    console.log('Por favor, inicie a aplicação com: npm run dev');
    process.exit(1);
  }

  await testWorkflowSystem();
}

main();