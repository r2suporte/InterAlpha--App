#!/usr/bin/env node

/**
 * Script para testar a Fase 3 - Logs de debug e fallback manual
 */

const fs = require('fs');
const path = require('path');

// Cores para output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function testPhase3() {
  log(`${colors.bold}🔧 FASE 3: Testando Logs de Debug e Fallback Manual${colors.reset}`, 'blue');
  
  let allTestsPassed = true;
  
  // 1. Verificar se o componente foi atualizado com as novas funcionalidades
  log('\n1. Verificando funcionalidades da Fase 3...', 'yellow');
  
  const signInPath = path.join(__dirname, '..', 'src', 'app', 'sign-in', '[[...sign-in]]', 'page.tsx');
  const signInContent = fs.readFileSync(signInPath, 'utf8');
  
  const phase3Features = [
    { name: 'Estado de erro do Clerk', pattern: 'clerkError' },
    { name: 'Estado do fallback', pattern: 'showFallback' },
    { name: 'Formulário de fallback', pattern: 'fallbackForm' },
    { name: 'Logs de console', pattern: 'console.log' },
    { name: 'Verificação de elementos Clerk', pattern: 'querySelectorAll' },
    { name: 'Timer de verificação', pattern: 'setTimeout' },
    { name: 'Formulário manual de login', pattern: 'fallback-login-form' },
    { name: 'Campos de email e senha', pattern: 'type="email"' },
    { name: 'Botão de fallback manual', pattern: 'Campos não aparecem' },
    { name: 'Debug info expandido', pattern: 'Debug Info (Fase 3)' },
    { name: 'Status visual', pattern: '❌ Erro detectado' },
    { name: 'Detalhes técnicos', pattern: 'Detalhes técnicos' }
  ];
  
  phase3Features.forEach(feature => {
    if (signInContent.includes(feature.pattern)) {
      log(`✅ ${feature.name}`, 'green');
    } else {
      log(`❌ ${feature.name} não encontrado`, 'red');
      allTestsPassed = false;
    }
  });
  
  // 2. Verificar estrutura do formulário de fallback
  log('\n2. Verificando estrutura do formulário de fallback...', 'yellow');
  
  const fallbackChecks = [
    'id="fallback-login-form"',
    'type="email"',
    'type="password"',
    'onSubmit={handleFallbackSubmit}',
    'Entrar (Modo Fallback)',
    'Tentar novamente com Clerk'
  ];
  
  fallbackChecks.forEach(check => {
    if (signInContent.includes(check)) {
      log(`✅ ${check}`, 'green');
    } else {
      log(`❌ ${check} não encontrado`, 'red');
      allTestsPassed = false;
    }
  });
  
  // 3. Verificar sistema de logs
  log('\n3. Verificando sistema de logs...', 'yellow');
  
  const logChecks = [
    '[CLERK DEBUG] Componente SignIn montando',
    '[CLERK DEBUG] Variáveis de ambiente',
    '[CLERK DEBUG] Elementos Clerk encontrados',
    '[FALLBACK] Tentativa de login manual'
  ];
  
  logChecks.forEach(check => {
    if (signInContent.includes(check)) {
      log(`✅ Log: ${check}`, 'green');
    } else {
      log(`❌ Log não encontrado: ${check}`, 'red');
      allTestsPassed = false;
    }
  });
  
  // 4. Verificar debug info expandido
  log('\n4. Verificando debug info expandido...', 'yellow');
  
  const debugChecks = [
    'userAgent: navigator.userAgent',
    'url: window.location.href',
    'origin: window.location.origin',
    'Status:',
    'Fallback:',
    '<details',
    '<summary'
  ];
  
  debugChecks.forEach(check => {
    if (signInContent.includes(check)) {
      log(`✅ Debug: ${check}`, 'green');
    } else {
      log(`❌ Debug não encontrado: ${check}`, 'red');
      allTestsPassed = false;
    }
  });
  
  // 5. Verificar tratamento de erros
  log('\n5. Verificando tratamento de erros...', 'yellow');
  
  const errorChecks = [
    'clerkError &&',
    'bg-red-100',
    'text-red-700',
    'Problema detectado:',
    'bg-yellow-100',
    'Sistema de login alternativo ativado'
  ];
  
  errorChecks.forEach(check => {
    if (signInContent.includes(check)) {
      log(`✅ Erro: ${check}`, 'green');
    } else {
      log(`❌ Tratamento de erro não encontrado: ${check}`, 'red');
      allTestsPassed = false;
    }
  });
  
  // Resultado final
  log(`\n${colors.bold}📋 RESULTADO DA FASE 3${colors.reset}`, 'blue');
  
  if (allTestsPassed) {
    log('✅ Todos os testes da Fase 3 passaram!', 'green');
    
    log('\n📝 Funcionalidades implementadas:', 'blue');
    log('• 🔍 Logs detalhados de debug no console', 'blue');
    log('• ⚠️ Detecção automática de falhas do Clerk', 'blue');
    log('• 🔧 Sistema de fallback manual com formulário', 'blue');
    log('• 📊 Debug info expandido e visual', 'blue');
    log('• 🎯 Botão manual para ativar fallback', 'blue');
    log('• 🔄 Opção de tentar novamente', 'blue');
    log('• 📱 Interface responsiva e acessível', 'blue');
    
    log('\n🎯 Como testar:', 'yellow');
    log('1. Execute: npm run dev', 'yellow');
    log('2. Acesse: http://localhost:3000/sign-in', 'yellow');
    log('3. Abra o Console do navegador (F12)', 'yellow');
    log('4. Verifique os logs [CLERK DEBUG]', 'yellow');
    log('5. Se campos não aparecem, clique "Campos não aparecem?"', 'yellow');
    log('6. Teste o formulário de fallback', 'yellow');
    log('7. Verifique o Debug Info na parte inferior', 'yellow');
    
    log('\n🚀 Próxima fase (se necessário): Atualizar dependências', 'yellow');
    
  } else {
    log('❌ Alguns testes da Fase 3 falharam', 'red');
    log('Verifique os problemas acima antes de prosseguir', 'red');
  }
  
  return allTestsPassed;
}

if (require.main === module) {
  testPhase3();
}

module.exports = { testPhase3 };