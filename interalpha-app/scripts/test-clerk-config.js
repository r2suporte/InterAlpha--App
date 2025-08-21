#!/usr/bin/env node

/**
 * Script para testar a configuração do Clerk
 * Verifica se as chaves estão válidas e se o Clerk está funcionando
 */

const { execSync } = require('child_process');
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

async function testClerkConfig() {
  log(`${colors.bold}🔍 Testando Configuração do Clerk${colors.reset}`, 'blue');
  
  // 1. Verificar se as variáveis de ambiente estão definidas
  log('\n1. Verificando variáveis de ambiente...', 'yellow');
  
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) {
    log('❌ Arquivo .env não encontrado', 'red');
    return false;
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const requiredVars = [
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    'CLERK_SECRET_KEY',
    'NEXT_PUBLIC_CLERK_SIGN_IN_URL',
    'NEXT_PUBLIC_CLERK_SIGN_UP_URL'
  ];
  
  let allVarsPresent = true;
  requiredVars.forEach(varName => {
    if (envContent.includes(varName)) {
      const match = envContent.match(new RegExp(`${varName}=(.+)`));
      if (match && match[1].trim()) {
        log(`✅ ${varName}: ${match[1].substring(0, 20)}...`, 'green');
      } else {
        log(`❌ ${varName}: Vazio ou inválido`, 'red');
        allVarsPresent = false;
      }
    } else {
      log(`❌ ${varName}: Não encontrado`, 'red');
      allVarsPresent = false;
    }
  });
  
  if (!allVarsPresent) {
    log('\n❌ Algumas variáveis de ambiente estão faltando', 'red');
    return false;
  }
  
  // 2. Verificar formato das chaves
  log('\n2. Verificando formato das chaves...', 'yellow');
  
  const publishableKeyMatch = envContent.match(/NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=(.+)/);
  const secretKeyMatch = envContent.match(/CLERK_SECRET_KEY=(.+)/);
  
  if (publishableKeyMatch) {
    const pubKey = publishableKeyMatch[1].trim();
    if (pubKey.startsWith('pk_test_') || pubKey.startsWith('pk_live_')) {
      log('✅ Chave pública tem formato correto', 'green');
    } else {
      log('❌ Chave pública tem formato inválido', 'red');
      return false;
    }
  }
  
  if (secretKeyMatch) {
    const secretKey = secretKeyMatch[1].trim();
    if (secretKey.startsWith('sk_test_') || secretKey.startsWith('sk_live_')) {
      log('✅ Chave secreta tem formato correto', 'green');
    } else {
      log('❌ Chave secreta tem formato inválido', 'red');
      return false;
    }
  }
  
  // 3. Verificar se o Clerk está instalado corretamente
  log('\n3. Verificando instalação do Clerk...', 'yellow');
  
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  if (packageJson.dependencies['@clerk/nextjs']) {
    log(`✅ @clerk/nextjs instalado: ${packageJson.dependencies['@clerk/nextjs']}`, 'green');
  } else {
    log('❌ @clerk/nextjs não está instalado', 'red');
    return false;
  }
  
  // 4. Verificar se o layout tem ClerkProvider
  log('\n4. Verificando ClerkProvider no layout...', 'yellow');
  
  const layoutPath = path.join(__dirname, '..', 'src', 'app', 'layout.tsx');
  if (fs.existsSync(layoutPath)) {
    const layoutContent = fs.readFileSync(layoutPath, 'utf8');
    if (layoutContent.includes('ClerkProvider')) {
      log('✅ ClerkProvider encontrado no layout', 'green');
    } else {
      log('❌ ClerkProvider não encontrado no layout', 'red');
      return false;
    }
  } else {
    log('❌ Arquivo layout.tsx não encontrado', 'red');
    return false;
  }
  
  // 5. Verificar middleware
  log('\n5. Verificando middleware...', 'yellow');
  
  const middlewarePath = path.join(__dirname, '..', 'middleware.ts');
  if (fs.existsSync(middlewarePath)) {
    const middlewareContent = fs.readFileSync(middlewarePath, 'utf8');
    if (middlewareContent.includes('clerkMiddleware')) {
      log('✅ clerkMiddleware encontrado', 'green');
    } else {
      log('❌ clerkMiddleware não encontrado', 'red');
      return false;
    }
  } else {
    log('❌ Arquivo middleware.ts não encontrado', 'red');
    return false;
  }
  
  log('\n✅ Configuração básica do Clerk parece estar correta!', 'green');
  return true;
}

async function testClerkAPI() {
  log('\n6. Testando conexão com API do Clerk...', 'yellow');
  
  try {
    // Tentar fazer uma requisição simples para verificar se as chaves funcionam
    const { execSync } = require('child_process');
    
    // Criar um script temporário para testar a API
    const testScript = `
const { clerkClient } = require('@clerk/nextjs/server');

async function testAPI() {
  try {
    // Tentar listar usuários (operação simples que requer chaves válidas)
    const users = await clerkClient.users.getUserList({ limit: 1 });
    console.log('✅ API do Clerk funcionando - Conexão estabelecida');
    return true;
  } catch (error) {
    console.log('❌ Erro na API do Clerk:', error.message);
    return false;
  }
}

testAPI();
`;
    
    const tempScriptPath = path.join(__dirname, 'temp-clerk-test.js');
    fs.writeFileSync(tempScriptPath, testScript);
    
    try {
      execSync(`cd ${path.dirname(tempScriptPath)} && node temp-clerk-test.js`, { 
        stdio: 'inherit',
        env: { ...process.env }
      });
      log('✅ API do Clerk está funcionando', 'green');
    } catch (error) {
      log('❌ Erro ao testar API do Clerk', 'red');
      log(`Detalhes: ${error.message}`, 'red');
    } finally {
      // Limpar arquivo temporário
      if (fs.existsSync(tempScriptPath)) {
        fs.unlinkSync(tempScriptPath);
      }
    }
    
  } catch (error) {
    log(`❌ Erro ao testar API: ${error.message}`, 'red');
    return false;
  }
}

async function main() {
  const configOK = await testClerkConfig();
  
  if (configOK) {
    await testClerkAPI();
    
    log(`\n${colors.bold}📋 RESUMO DA FASE 1${colors.reset}`, 'blue');
    log('✅ Configuração básica verificada', 'green');
    log('✅ Variáveis de ambiente presentes', 'green');
    log('✅ Formato das chaves correto', 'green');
    log('✅ ClerkProvider configurado', 'green');
    log('✅ Middleware configurado', 'green');
    
    log('\n🔄 Próxima fase: Simplificar configuração e remover CSP', 'yellow');
  } else {
    log(`\n${colors.bold}❌ FASE 1 FALHOU${colors.reset}`, 'red');
    log('Corrija os problemas identificados antes de prosseguir', 'red');
  }
}

if (require.main === module) {
  main().catch(error => {
    log(`❌ Erro fatal: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  });
}

module.exports = { testClerkConfig, testClerkAPI };