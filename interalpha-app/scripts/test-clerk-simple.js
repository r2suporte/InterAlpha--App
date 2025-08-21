#!/usr/bin/env node

/**
 * Teste simples para verificar se as alterações da Fase 2 estão corretas
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

function testPhase2Simple() {
  log(`${colors.bold}🔧 TESTE SIMPLES - FASE 2${colors.reset}`, 'blue');
  
  let allTestsPassed = true;
  
  // 1. Verificar next.config.ts
  log('\n1. Verificando next.config.ts...', 'yellow');
  const nextConfigPath = path.join(__dirname, '..', 'next.config.ts');
  const nextConfigContent = fs.readFileSync(nextConfigPath, 'utf8');
  
  if (nextConfigContent.includes('Headers CSP removidos') || !nextConfigContent.includes('Content-Security-Policy')) {
    log('✅ CSP removido ou comentado', 'green');
  } else {
    log('❌ CSP ainda ativo', 'red');
    allTestsPassed = false;
  }
  
  // 2. Verificar componente SignIn
  log('\n2. Verificando componente SignIn...', 'yellow');
  const signInPath = path.join(__dirname, '..', 'src', 'app', 'sign-in', '[[...sign-in]]', 'page.tsx');
  const signInContent = fs.readFileSync(signInPath, 'utf8');
  
  const checks = [
    { name: 'use client directive', pattern: "'use client'" },
    { name: 'useState import', pattern: 'useState' },
    { name: 'useEffect import', pattern: 'useEffect' },
    { name: 'path prop', pattern: 'path="/sign-in"' },
    { name: 'routing prop', pattern: 'routing="path"' },
    { name: 'redirectUrl prop', pattern: 'redirectUrl="/dashboard"' },
    { name: 'forceRedirectUrl prop', pattern: 'forceRedirectUrl="/dashboard"' },
    { name: 'Debug info section', pattern: 'Debug Info' },
    { name: 'Loading state', pattern: 'Carregando sistema de login' }
  ];
  
  checks.forEach(check => {
    if (signInContent.includes(check.pattern)) {
      log(`✅ ${check.name}`, 'green');
    } else {
      log(`❌ ${check.name} não encontrado`, 'red');
      allTestsPassed = false;
    }
  });
  
  // 3. Verificar se não há erros de sintaxe óbvios
  log('\n3. Verificando sintaxe básica...', 'yellow');
  
  try {
    // Verificar se há parênteses/chaves balanceados
    const openBraces = (signInContent.match(/{/g) || []).length;
    const closeBraces = (signInContent.match(/}/g) || []).length;
    const openParens = (signInContent.match(/\(/g) || []).length;
    const closeParens = (signInContent.match(/\)/g) || []).length;
    
    if (openBraces === closeBraces) {
      log('✅ Chaves balanceadas', 'green');
    } else {
      log(`❌ Chaves desbalanceadas: ${openBraces} abrir, ${closeBraces} fechar`, 'red');
      allTestsPassed = false;
    }
    
    if (openParens === closeParens) {
      log('✅ Parênteses balanceados', 'green');
    } else {
      log(`❌ Parênteses desbalanceados: ${openParens} abrir, ${closeParens} fechar`, 'red');
      allTestsPassed = false;
    }
    
    // Verificar imports básicos
    if (signInContent.includes("import { SignIn } from '@clerk/nextjs'")) {
      log('✅ Import do SignIn correto', 'green');
    } else {
      log('❌ Import do SignIn incorreto', 'red');
      allTestsPassed = false;
    }
    
  } catch (error) {
    log(`❌ Erro ao verificar sintaxe: ${error.message}`, 'red');
    allTestsPassed = false;
  }
  
  // 4. Verificar variáveis de ambiente
  log('\n4. Verificando variáveis de ambiente...', 'yellow');
  const envPath = path.join(__dirname, '..', '.env');
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  const envVars = [
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    'CLERK_SECRET_KEY',
    'NEXT_PUBLIC_CLERK_SIGN_IN_URL',
    'NEXT_PUBLIC_CLERK_SIGN_UP_URL',
    'NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL'
  ];
  
  envVars.forEach(varName => {
    if (envContent.includes(`${varName}=`) && !envContent.includes(`${varName}=\n`)) {
      log(`✅ ${varName} definida`, 'green');
    } else {
      log(`❌ ${varName} não definida ou vazia`, 'red');
      allTestsPassed = false;
    }
  });
  
  // Resultado final
  log(`\n${colors.bold}📋 RESULTADO DA FASE 2${colors.reset}`, 'blue');
  
  if (allTestsPassed) {
    log('✅ Todos os testes passaram!', 'green');
    log('\n📝 Alterações implementadas:', 'blue');
    log('• CSP removido temporariamente', 'blue');
    log('• Componente SignIn melhorado com:', 'blue');
    log('  - Client-side rendering explícito', 'blue');
    log('  - Estado de loading', 'blue');
    log('  - Configurações de roteamento explícitas', 'blue');
    log('  - Debug info para desenvolvimento', 'blue');
    log('  - Configurações de aparência mantidas', 'blue');
    
    log('\n🎯 Próximos passos:', 'yellow');
    log('1. Teste manual: npm run dev', 'yellow');
    log('2. Acesse: http://localhost:3000/sign-in', 'yellow');
    log('3. Verifique se os campos aparecem', 'yellow');
    log('4. Se ainda não funcionar, prosseguir para Fase 3', 'yellow');
    
  } else {
    log('❌ Alguns testes falharam', 'red');
    log('Verifique os problemas acima antes de prosseguir', 'red');
  }
  
  return allTestsPassed;
}

if (require.main === module) {
  testPhase2Simple();
}

module.exports = { testPhase2Simple };