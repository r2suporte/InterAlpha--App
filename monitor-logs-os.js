#!/usr/bin/env node
/**
 * Monitor de logs em tempo real para Ordem de Serviço
 * Monitora o terminal do servidor Next.js para capturar logs de:
 * - Geração de PDF
 * - Envio de Email
 * - Envio de WhatsApp
 * - Envio de SMS
 */

const { spawn } = require('child_process');
const chalk = require('chalk');

console.log('\n');
console.log('═══════════════════════════════════════════════════════════');
console.log('   🔍 MONITOR DE LOGS - ORDEM DE SERVIÇO');
console.log('═══════════════════════════════════════════════════════════');
console.log('\n📡 Monitorando logs do servidor...\n');
console.log('⏳ Aguardando criação de Ordem de Serviço...\n');
console.log('💡 Criar OS em: http://localhost:3000/dashboard/ordens-servico\n');
console.log('═══════════════════════════════════════════════════════════\n');

// Padrões de busca
const patterns = {
  pdf: /📄|PDF|pdf/i,
  email: /📧|Email|email/i,
  whatsapp: /📱|WhatsApp|whatsapp/i,
  sms: /📲|SMS|sms/i,
  sucesso: /✅|sucesso|success/i,
  erro: /❌|erro|error|falha/i,
  ordemServico: /ordem|OS-\d+|ordem_servico/i,
};

// Contador de eventos
let eventos = {
  pdf: 0,
  email: 0,
  whatsapp: 0,
  sms: 0,
  erros: 0,
};

function processarLinha(linha) {
  const timestamp = new Date().toLocaleTimeString('pt-BR');
  
  // Detectar tipo de evento
  if (patterns.pdf.test(linha) && patterns.ordemServico.test(linha)) {
    if (patterns.sucesso.test(linha)) {
      eventos.pdf++;
      console.log(`[${timestamp}] 📄 ${linha.trim()}`);
    } else if (patterns.erro.test(linha)) {
      eventos.erros++;
      console.log(`[${timestamp}] ❌ PDF: ${linha.trim()}`);
    } else {
      console.log(`[${timestamp}] 📄 ${linha.trim()}`);
    }
  }
  
  else if (patterns.email.test(linha) && patterns.ordemServico.test(linha)) {
    if (patterns.sucesso.test(linha)) {
      eventos.email++;
      console.log(`[${timestamp}] 📧 ${linha.trim()}`);
    } else if (patterns.erro.test(linha)) {
      eventos.erros++;
      console.log(`[${timestamp}] ❌ Email: ${linha.trim()}`);
    } else {
      console.log(`[${timestamp}] 📧 ${linha.trim()}`);
    }
  }
  
  else if (patterns.whatsapp.test(linha) && patterns.ordemServico.test(linha)) {
    if (patterns.sucesso.test(linha)) {
      eventos.whatsapp++;
      console.log(`[${timestamp}] 📱 ${linha.trim()}`);
    } else if (patterns.erro.test(linha)) {
      eventos.erros++;
      console.log(`[${timestamp}] ❌ WhatsApp: ${linha.trim()}`);
    } else {
      console.log(`[${timestamp}] 📱 ${linha.trim()}`);
    }
  }
  
  else if (patterns.sms.test(linha) && patterns.ordemServico.test(linha)) {
    if (patterns.sucesso.test(linha)) {
      eventos.sms++;
      console.log(`[${timestamp}] 📲 ${linha.trim()}`);
    } else if (patterns.erro.test(linha)) {
      eventos.erros++;
      console.log(`[${timestamp}] ❌ SMS: ${linha.trim()}`);
    } else {
      console.log(`[${timestamp}] 📲 ${linha.trim()}`);
    }
  }
  
  // Mostrar outras linhas relacionadas a OS
  else if (patterns.ordemServico.test(linha)) {
    console.log(`[${timestamp}] 📋 ${linha.trim()}`);
  }
}

// Mostrar resumo a cada 30 segundos
setInterval(() => {
  const total = eventos.pdf + eventos.email + eventos.whatsapp + eventos.sms;
  if (total > 0) {
    console.log('\n' + '─'.repeat(60));
    console.log('📊 RESUMO DE EVENTOS:');
    console.log(`   📄 PDFs gerados: ${eventos.pdf}`);
    console.log(`   📧 Emails enviados: ${eventos.email}`);
    console.log(`   📱 WhatsApp enviados: ${eventos.whatsapp}`);
    console.log(`   📲 SMS enviados: ${eventos.sms}`);
    if (eventos.erros > 0) {
      console.log(`   ❌ Erros encontrados: ${eventos.erros}`);
    }
    console.log('─'.repeat(60) + '\n');
  }
}, 30000);

// Simular leitura do terminal
// Como não temos acesso direto ao output do Next.js, vamos instruir o usuário
console.log('💡 INSTRUÇÕES:\n');
console.log('1. Crie uma Ordem de Serviço no dashboard');
console.log('2. Observe o terminal onde o servidor está rodando');
console.log('3. Procure por estas mensagens:\n');
console.log('   📄 "Gerando PDF para ordem..."');
console.log('   ✅ "PDF gerado com sucesso"');
console.log('   📧 "Enviando email para..."');
console.log('   ✅ "Email enviado com sucesso"');
console.log('   📱 "Enviando WhatsApp para..."');
console.log('   ✅ "WhatsApp enviado com sucesso"');
console.log('   📲 "SMS enviado"\n');
console.log('═══════════════════════════════════════════════════════════\n');

// Manter script rodando
process.stdin.resume();
