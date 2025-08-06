#!/usr/bin/env node

/**
 * Script para testar o sistema de SMS
 * Execute com: node scripts/test-sms.js [telefone]
 */

const axios = require('axios');

const testPhone = process.argv[2];
const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

if (!testPhone) {
  console.log('❌ Por favor, forneça um número de telefone para teste');
  console.log('Uso: node scripts/test-sms.js +5511999999999');
  console.log('Ou: node scripts/test-sms.js 11999999999');
  process.exit(1);
}

async function testSMSSystem() {
  console.log('🧪 Testando sistema de SMS...\n');

  try {
    // 1. Verificar configuração
    console.log('1. Verificando configuração...');
    const configResponse = await axios.get(`${baseUrl}/api/integrations/sms/test`);
    console.log('✅ Configuração:', {
      connected: configResponse.data.twilio.connected,
      accountSid: configResponse.data.twilio.accountSid,
      phoneNumber: configResponse.data.twilio.phoneNumber,
      limits: configResponse.data.limits,
    });
    console.log('');

    if (!configResponse.data.twilio.connected) {
      console.log('❌ Conexão Twilio não está funcionando');
      console.log('Verifique as credenciais TWILIO_ACCOUNT_SID e TWILIO_AUTH_TOKEN');
      return;
    }

    // 2. Testar conexão Twilio
    console.log('2. Testando conexão Twilio...');
    const connectionResponse = await axios.post(`${baseUrl}/api/integrations/sms/test`, {
      to: testPhone,
      type: 'connection-test'
    });
    console.log('✅ Conexão Twilio:', connectionResponse.data.message);
    console.log('');

    // 3. Enviar SMS de teste
    console.log('3. Enviando SMS de teste...');
    const testResponse = await axios.post(`${baseUrl}/api/integrations/sms/test`, {
      to: testPhone,
      type: 'test',
      clientName: 'Usuário Teste'
    });
    console.log('✅ SMS de teste:', testResponse.data.message);
    console.log('');

    // 4. Testar SMS de ordem criada
    console.log('4. Testando SMS de ordem criada...');
    const orderResponse = await axios.post(`${baseUrl}/api/integrations/sms/test`, {
      to: testPhone,
      type: 'order-created',
      clientName: 'João Silva',
      orderNumber: 'TEST-001',
      serviceName: 'Manutenção',
      status: 'PENDENTE'
    });
    console.log('✅ SMS de ordem criada:', orderResponse.data.message);
    console.log('');

    // 5. Testar SMS de ordem concluída
    console.log('5. Testando SMS de ordem concluída...');
    const completedResponse = await axios.post(`${baseUrl}/api/integrations/sms/test`, {
      to: testPhone,
      type: 'order-completed',
      clientName: 'João Silva',
      orderNumber: 'TEST-001',
      serviceName: 'Manutenção'
    });
    console.log('✅ SMS de ordem concluída:', completedResponse.data.message);
    console.log('');

    // 6. Testar SMS de pagamento
    console.log('6. Testando SMS de pagamento...');
    const paymentResponse = await axios.post(`${baseUrl}/api/integrations/sms/test`, {
      to: testPhone,
      type: 'payment-received',
      clientName: 'João Silva',
      amount: 150.00,
      paymentMethod: 'PIX'
    });
    console.log('✅ SMS de pagamento:', paymentResponse.data.message);
    console.log('');

    // 7. Testar SMS personalizado
    console.log('7. Testando SMS personalizado...');
    const customResponse = await axios.post(`${baseUrl}/api/integrations/sms/test`, {
      to: testPhone,
      type: 'custom',
      message: 'Esta é uma mensagem personalizada de teste do sistema InterAlpha!'
    });
    console.log('✅ SMS personalizado:', customResponse.data.message);
    console.log('');

    console.log('🎉 Todos os testes de SMS foram executados com sucesso!');
    console.log(`📱 Verifique as mensagens no telefone ${testPhone}`);
    console.log('');
    console.log('💡 Dicas:');
    console.log('- Aguarde alguns minutos para o processamento das filas');
    console.log('- Monitore os logs da aplicação para ver o processamento');
    console.log('- Verifique se o número está no formato correto (+5511999999999)');
    console.log('- Para números de teste do Twilio, use números verificados');

    // Mostrar histórico de mensagens se disponível
    if (configResponse.data.messageHistory && configResponse.data.messageHistory.length > 0) {
      console.log('\n📋 Últimas mensagens enviadas:');
      configResponse.data.messageHistory.forEach((msg, index) => {
        console.log(`${index + 1}. Para: ${msg.to} | Status: ${msg.status} | ${msg.dateCreated}`);
      });
    }

  } catch (error) {
    console.error('❌ Erro no teste de SMS:', error.response?.data || error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Certifique-se de que a aplicação está rodando:');
      console.log('   npm run dev');
    } else if (error.response?.status === 400) {
      console.log('\n💡 Verifique o formato do número de telefone:');
      console.log('   - Use formato brasileiro: +5511999999999');
      console.log('   - Ou apenas: 11999999999');
    } else if (error.response?.data?.message?.includes('21211')) {
      console.log('\n💡 Erro Twilio 21211: Número de telefone inválido');
      console.log('   - Verifique se o número está correto');
      console.log('   - Para testes, use números verificados no Twilio');
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

  await testSMSSystem();
}

main();