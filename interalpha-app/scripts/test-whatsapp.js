#!/usr/bin/env node

/**
 * Script para testar o sistema de WhatsApp
 * Execute com: node scripts/test-whatsapp.js [telefone]
 */

const axios = require('axios');

const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';
const API_URL = `${BASE_URL}/api/integrations/whatsapp/test`;

// Número de teste padrão (formato brasileiro)
const DEFAULT_PHONE = '+5511999999999';

async function testWhatsApp() {
  const phone = process.argv[2] || DEFAULT_PHONE;
  
  console.log('🧪 Iniciando testes do sistema de WhatsApp...\n');
  
  try {
    // 1. Verificar configuração
    console.log('📋 1. Verificando configuração...');
    const configResponse = await axios.get(API_URL);
    console.log('✅ Configuração:', {
      connected: configResponse.data.twilio.connected,
      accountSid: configResponse.data.twilio.accountSid,
      whatsappNumber: configResponse.data.twilio.whatsappNumber,
      webhookUrl: configResponse.data.webhook.url,
    });
    
    if (!configResponse.data.twilio.connected) {
      console.log('❌ Twilio não está conectado. Verifique as credenciais.');
      return;
    }
    
    console.log('');
    
    // 2. Teste de conexão
    console.log('🔗 2. Testando conexão Twilio...');
    await axios.post(API_URL, {
      type: 'connection-test'
    });
    console.log('✅ Conexão Twilio funcionando\n');
    
    // 3. Teste de WhatsApp simples
    console.log(`📱 3. Enviando WhatsApp de teste para ${phone}...`);
    await axios.post(API_URL, {
      type: 'test',
      to: phone,
      clientName: 'Cliente Teste'
    });
    console.log('✅ WhatsApp de teste agendado\n');
    
    // 4. Teste de boas-vindas
    console.log(`👋 4. Enviando WhatsApp de boas-vindas para ${phone}...`);
    await axios.post(API_URL, {
      type: 'welcome',
      to: phone,
      clientName: 'João Silva'
    });
    console.log('✅ WhatsApp de boas-vindas agendado\n');
    
    // 5. Teste de ordem criada
    console.log(`🔧 5. Enviando WhatsApp de ordem criada para ${phone}...`);
    await axios.post(API_URL, {
      type: 'order-created',
      to: phone,
      clientName: 'João Silva',
      orderNumber: 'TEST-001',
      serviceName: 'Manutenção de Ar Condicionado',
      status: 'PENDENTE',
      description: 'Limpeza e manutenção preventiva do sistema de ar condicionado'
    });
    console.log('✅ WhatsApp de ordem criada agendado\n');
    
    // 6. Teste de técnico designado
    console.log(`👨‍🔧 6. Enviando WhatsApp de técnico designado para ${phone}...`);
    await axios.post(API_URL, {
      type: 'technician-assigned',
      to: phone,
      clientName: 'João Silva',
      orderNumber: 'TEST-001',
      serviceName: 'Manutenção de Ar Condicionado',
      technicianName: 'Carlos Técnico',
      technicianPhone: '+5511888888888',
      scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Amanhã
    });
    console.log('✅ WhatsApp de técnico designado agendado\n');
    
    // 7. Teste de mudança de status
    console.log(`🔄 7. Enviando WhatsApp de mudança de status para ${phone}...`);
    await axios.post(API_URL, {
      type: 'order-status-changed',
      to: phone,
      clientName: 'João Silva',
      orderNumber: 'TEST-001',
      serviceName: 'Manutenção de Ar Condicionado',
      previousStatus: 'PENDENTE',
      newStatus: 'EM_ANDAMENTO'
    });
    console.log('✅ WhatsApp de mudança de status agendado\n');
    
    // 8. Teste de ordem concluída
    console.log(`✅ 8. Enviando WhatsApp de ordem concluída para ${phone}...`);
    await axios.post(API_URL, {
      type: 'order-completed',
      to: phone,
      clientName: 'João Silva',
      orderNumber: 'TEST-001',
      serviceName: 'Manutenção de Ar Condicionado',
      notes: 'Serviço realizado com sucesso. Sistema funcionando perfeitamente.'
    });
    console.log('✅ WhatsApp de ordem concluída agendado\n');
    
    // 9. Teste de pagamento recebido
    console.log(`💰 9. Enviando WhatsApp de pagamento recebido para ${phone}...`);
    await axios.post(API_URL, {
      type: 'payment-received',
      to: phone,
      clientName: 'João Silva',
      amount: 250.00,
      paymentMethod: 'PIX',
      transactionId: 'PIX123456789'
    });
    console.log('✅ WhatsApp de pagamento recebido agendado\n');
    
    // 10. Teste de lembrete de agendamento
    console.log(`⏰ 10. Enviando WhatsApp de lembrete para ${phone}...`);
    await axios.post(API_URL, {
      type: 'appointment-reminder',
      to: phone,
      clientName: 'João Silva',
      orderNumber: 'TEST-002',
      serviceName: 'Instalação de Split',
      technicianName: 'Carlos Técnico',
      scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Amanhã
    });
    console.log('✅ WhatsApp de lembrete agendado\n');
    
    // 11. Teste de mensagem personalizada
    console.log(`📝 11. Enviando WhatsApp personalizado para ${phone}...`);
    await axios.post(API_URL, {
      type: 'custom',
      to: phone,
      message: 'Esta é uma mensagem personalizada de teste do sistema InterAlpha. Responda para testar a comunicação bidirecional.',
      useRichFormatting: true
    });
    console.log('✅ WhatsApp personalizado agendado\n');
    
    // 12. Teste de broadcast (múltiplos destinatários)
    if (process.argv[3]) {
      const recipients = [phone, process.argv[3]];
      console.log(`📢 12. Enviando WhatsApp broadcast para ${recipients.length} destinatários...`);
      await axios.post(API_URL, {
        type: 'broadcast',
        recipients,
        message: 'Comunicado importante: Sistema de WhatsApp funcionando perfeitamente!',
        useRichFormatting: true
      });
      console.log('✅ WhatsApp broadcast agendado\n');
    }
    
    console.log('🎉 Todos os testes de WhatsApp foram executados com sucesso!');
    console.log('');
    console.log('📱 Verifique seu WhatsApp para receber as mensagens.');
    console.log('💬 Responda às mensagens para testar a comunicação bidirecional.');
    console.log('');
    console.log('🔍 Para monitorar o processamento:');
    console.log(`   - Acesse: ${BASE_URL}/api/integrations/queues/stats`);
    console.log('   - Verifique os logs do servidor');
    console.log('');
    console.log('⚙️  Para configurar o webhook no Twilio:');
    console.log(`   - URL: ${BASE_URL}/api/webhooks/whatsapp`);
    console.log('   - Método: POST');
    console.log('   - Content-Type: application/x-www-form-urlencoded');
    
  } catch (error) {
    console.error('❌ Erro durante os testes:', error.response?.data || error.message);
    
    if (error.response?.status === 400) {
      console.log('\n💡 Dicas:');
      console.log('   - Verifique se o número está no formato correto: +5511999999999');
      console.log('   - Certifique-se de que as credenciais do Twilio estão configuradas');
      console.log('   - Verifique se o número WhatsApp está aprovado no Twilio');
    } else if (error.response?.status === 500) {
      console.log('\n💡 Dicas:');
      console.log('   - Verifique se o Redis está rodando');
      console.log('   - Verifique se as variáveis de ambiente estão configuradas');
      console.log('   - Verifique os logs do servidor para mais detalhes');
    }
  }
}

// Função para mostrar ajuda
function showHelp() {
  console.log('📱 Script de Teste do WhatsApp - InterAlpha');
  console.log('');
  console.log('Uso:');
  console.log('  node scripts/test-whatsapp.js [telefone] [telefone2]');
  console.log('');
  console.log('Exemplos:');
  console.log('  node scripts/test-whatsapp.js +5511999999999');
  console.log('  node scripts/test-whatsapp.js +5511999999999 +5511888888888');
  console.log('');
  console.log('Parâmetros:');
  console.log('  telefone   - Número WhatsApp no formato +5511999999999 (opcional)');
  console.log('  telefone2  - Segundo número para teste de broadcast (opcional)');
  console.log('');
  console.log('Variáveis de ambiente necessárias:');
  console.log('  TWILIO_ACCOUNT_SID     - SID da conta Twilio');
  console.log('  TWILIO_AUTH_TOKEN      - Token de autenticação Twilio');
  console.log('  TWILIO_WHATSAPP_NUMBER - Número WhatsApp do Twilio (whatsapp:+14155238886)');
  console.log('  REDIS_URL              - URL do Redis para filas');
  console.log('');
  console.log('Testes executados:');
  console.log('  1. Verificação de configuração');
  console.log('  2. Teste de conexão Twilio');
  console.log('  3. WhatsApp de teste');
  console.log('  4. WhatsApp de boas-vindas');
  console.log('  5. WhatsApp de ordem criada');
  console.log('  6. WhatsApp de técnico designado');
  console.log('  7. WhatsApp de mudança de status');
  console.log('  8. WhatsApp de ordem concluída');
  console.log('  9. WhatsApp de pagamento recebido');
  console.log('  10. WhatsApp de lembrete');
  console.log('  11. WhatsApp personalizado');
  console.log('  12. WhatsApp broadcast (se segundo número fornecido)');
}

// Verificar se é pedido de ajuda
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showHelp();
  process.exit(0);
}

// Executar testes
testWhatsApp().catch(console.error);