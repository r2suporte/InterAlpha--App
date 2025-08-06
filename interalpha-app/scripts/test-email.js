#!/usr/bin/env node

/**
 * Script para testar o sistema de email
 * Execute com: node scripts/test-email.js [email]
 */

const axios = require('axios');

const testEmail = process.argv[2];
const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

if (!testEmail) {
  console.log('❌ Por favor, forneça um email para teste');
  console.log('Uso: node scripts/test-email.js seu-email@exemplo.com');
  process.exit(1);
}

async function testEmailSystem() {
  console.log('🧪 Testando sistema de email...\n');

  try {
    // 1. Verificar configuração
    console.log('1. Verificando configuração...');
    const configResponse = await axios.get(`${baseUrl}/api/integrations/email/test`);
    console.log('✅ Configuração:', configResponse.data);
    console.log('');

    // 2. Testar conexão SMTP
    console.log('2. Testando conexão SMTP...');
    const connectionResponse = await axios.post(`${baseUrl}/api/integrations/email/test`, {
      to: testEmail,
      type: 'connection-test'
    });
    console.log('✅ Conexão SMTP:', connectionResponse.data.message);
    console.log('');

    // 3. Enviar email de teste
    console.log('3. Enviando email de teste...');
    const testResponse = await axios.post(`${baseUrl}/api/integrations/email/test`, {
      to: testEmail,
      type: 'test',
      clientName: 'Usuário Teste'
    });
    console.log('✅ Email de teste:', testResponse.data.message);
    console.log('');

    // 4. Testar template de ordem criada
    console.log('4. Testando template de ordem criada...');
    const orderResponse = await axios.post(`${baseUrl}/api/integrations/email/test`, {
      to: testEmail,
      type: 'order-created',
      clientName: 'João Silva',
      orderNumber: 'TEST-001',
      serviceName: 'Manutenção de Computador',
      description: 'Limpeza e formatação do sistema'
    });
    console.log('✅ Email de ordem criada:', orderResponse.data.message);
    console.log('');

    // 5. Testar template de ordem concluída
    console.log('5. Testando template de ordem concluída...');
    const completedResponse = await axios.post(`${baseUrl}/api/integrations/email/test`, {
      to: testEmail,
      type: 'order-completed',
      clientName: 'João Silva',
      orderNumber: 'TEST-001',
      serviceName: 'Manutenção de Computador',
      notes: 'Serviço realizado com sucesso. Sistema formatado e programas reinstalados.'
    });
    console.log('✅ Email de ordem concluída:', completedResponse.data.message);
    console.log('');

    // 6. Testar template de pagamento
    console.log('6. Testando template de pagamento...');
    const paymentResponse = await axios.post(`${baseUrl}/api/integrations/email/test`, {
      to: testEmail,
      type: 'payment-received',
      clientName: 'João Silva',
      amount: 150.00,
      paymentMethod: 'PIX',
      transactionId: 'TXN123456789'
    });
    console.log('✅ Email de pagamento:', paymentResponse.data.message);
    console.log('');

    console.log('🎉 Todos os testes de email foram executados com sucesso!');
    console.log(`📧 Verifique a caixa de entrada de ${testEmail}`);
    console.log('');
    console.log('💡 Dicas:');
    console.log('- Verifique a pasta de spam se não receber os emails');
    console.log('- Aguarde alguns minutos para o processamento das filas');
    console.log('- Monitore os logs da aplicação para ver o processamento');

  } catch (error) {
    console.error('❌ Erro no teste de email:', error.response?.data || error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Certifique-se de que a aplicação está rodando:');
      console.log('   npm run dev');
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

  await testEmailSystem();
}

main();