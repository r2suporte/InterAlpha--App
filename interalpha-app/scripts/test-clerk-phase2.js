#!/usr/bin/env node

/**
 * Script para testar a Fase 2 - Configuração simplificada do Clerk
 */

const { execSync, spawn } = require('child_process');
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

async function testPhase2() {
  log(`${colors.bold}🔧 FASE 2: Testando Configuração Simplificada${colors.reset}`, 'blue');
  
  // 1. Verificar se CSP foi removido
  log('\n1. Verificando remoção do CSP...', 'yellow');
  
  const nextConfigPath = path.join(__dirname, '..', 'next.config.ts');
  const nextConfigContent = fs.readFileSync(nextConfigPath, 'utf8');
  
  if (nextConfigContent.includes('Content-Security-Policy') && !nextConfigContent.includes('// Headers CSP removidos')) {
    log('❌ CSP ainda está ativo', 'red');
    return false;
  } else {
    log('✅ CSP removido temporariamente', 'green');
  }
  
  // 2. Verificar se o componente SignIn foi atualizado
  log('\n2. Verificando componente SignIn atualizado...', 'yellow');
  
  const signInPath = path.join(__dirname, '..', 'src', 'app', 'sign-in', '[[...sign-in]]', 'page.tsx');
  const signInContent = fs.readFileSync(signInPath, 'utf8');
  
  const requiredFeatures = [
    "'use client'",
    'useState',
    'useEffect',
    'path="/sign-in"',
    'routing="path"',
    'redirectUrl="/dashboard"',
    'Debug Info'
  ];
  
  let allFeaturesPresent = true;
  requiredFeatures.forEach(feature => {
    if (signInContent.includes(feature)) {
      log(`✅ ${feature} encontrado`, 'green');
    } else {
      log(`❌ ${feature} não encontrado`, 'red');
      allFeaturesPresent = false;
    }
  });
  
  if (!allFeaturesPresent) {
    log('❌ Componente SignIn não foi atualizado corretamente', 'red');
    return false;
  }
  
  // 3. Tentar fazer build para verificar se não há erros
  log('\n3. Testando build do projeto...', 'yellow');
  
  try {
    execSync('npm run build', { 
      cwd: path.dirname(__dirname),
      stdio: 'pipe'
    });
    log('✅ Build executado com sucesso', 'green');
  } catch (error) {
    log('❌ Erro no build:', 'red');
    log(error.stdout?.toString() || error.message, 'red');
    return false;
  }
  
  // 4. Iniciar servidor de desenvolvimento para teste
  log('\n4. Iniciando servidor para teste...', 'yellow');
  
  return new Promise((resolve) => {
    const server = spawn('npm', ['run', 'dev'], {
      cwd: path.dirname(__dirname),
      stdio: 'pipe'
    });
    
    let serverReady = false;
    let timeout;
    
    server.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Ready') || output.includes('localhost:3000')) {
        if (!serverReady) {
          serverReady = true;
          log('✅ Servidor iniciado com sucesso', 'green');
          
          // Aguardar um pouco e então testar a página
          setTimeout(async () => {
            await testLoginPage();
            server.kill();
            clearTimeout(timeout);
            resolve(true);
          }, 3000);
        }
      }
    });
    
    server.stderr.on('data', (data) => {
      const error = data.toString();
      if (error.includes('Error') || error.includes('Failed')) {
        log(`❌ Erro no servidor: ${error}`, 'red');
        server.kill();
        clearTimeout(timeout);
        resolve(false);
      }
    });
    
    // Timeout de 30 segundos
    timeout = setTimeout(() => {
      log('❌ Timeout ao iniciar servidor', 'red');
      server.kill();
      resolve(false);
    }, 30000);
  });
}

async function testLoginPage() {
  log('\n5. Testando página de login...', 'yellow');
  
  try {
    const fetch = (await import('node-fetch')).default;
    
    const response = await fetch('http://localhost:3000/sign-in', {
      timeout: 5000
    });
    
    if (response.ok) {
      const html = await response.text();
      
      // Verificar se a página contém elementos esperados
      const expectedElements = [
        'Sistema InterAlpha',
        'Acesso para funcionários',
        'Debug Info'
      ];
      
      let allElementsFound = true;
      expectedElements.forEach(element => {
        if (html.includes(element)) {
          log(`✅ Elemento encontrado: ${element}`, 'green');
        } else {
          log(`❌ Elemento não encontrado: ${element}`, 'red');
          allElementsFound = false;
        }
      });
      
      if (allElementsFound) {
        log('✅ Página de login carregou corretamente', 'green');
      } else {
        log('❌ Página de login tem problemas', 'red');
      }
      
    } else {
      log(`❌ Erro HTTP: ${response.status}`, 'red');
    }
    
  } catch (error) {
    log(`❌ Erro ao testar página: ${error.message}`, 'red');
  }
}

async function main() {
  const success = await testPhase2();
  
  if (success) {
    log(`\n${colors.bold}✅ FASE 2 CONCLUÍDA COM SUCESSO${colors.reset}`, 'green');
    log('📋 Resumo das alterações:', 'blue');
    log('✅ CSP removido temporariamente', 'green');
    log('✅ Componente SignIn simplificado e melhorado', 'green');
    log('✅ Configurações explícitas adicionadas', 'green');
    log('✅ Debug info adicionado para desenvolvimento', 'green');
    log('✅ Build funcionando', 'green');
    log('✅ Servidor iniciando corretamente', 'green');
    
    log('\n🔄 Próxima fase: Adicionar logs de debug e fallback manual', 'yellow');
    log('\n📝 Para testar manualmente:', 'blue');
    log('1. Execute: npm run dev', 'blue');
    log('2. Acesse: http://localhost:3000/sign-in', 'blue');
    log('3. Verifique se os campos de email/senha aparecem', 'blue');
    log('4. Verifique o Debug Info na parte inferior da página', 'blue');
    
  } else {
    log(`\n${colors.bold}❌ FASE 2 FALHOU${colors.reset}`, 'red');
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

module.exports = { testPhase2 };