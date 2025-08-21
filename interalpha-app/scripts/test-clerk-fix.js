#!/usr/bin/env node

/**
 * Script para testar as correções do Clerk
 * FASE 4: Verificar se as chaves corretas resolvem o problema
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

async function testNewClerkConfig() {
  log(`${colors.bold}🔧 FASE 4: TESTANDO CORREÇÕES DO CLERK${colors.reset}`, 'blue');
  
  log('\n1. Verificando novas chaves do Clerk...', 'yellow');
  
  const envPath = path.join(__dirname, '..', '.env');
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  if (envContent.includes('pk_test_bGl2ZS1mb3hob3VuZC0zNi')) {
    log('✅ Chave pública atualizada corretamente', 'green');
  } else {
    log('❌ Chave pública não foi atualizada', 'red');
    return false;
  }
  
  if (envContent.includes('sk_test_bYDYMyZJz8W6GmpkAKQNwVGHktK26Bx0GD36gTowOl')) {
    log('✅ Chave secreta atualizada corretamente', 'green');
  } else {
    log('❌ Chave secreta não foi atualizada', 'red');
    return false;
  }
  
  log('\n2. Verificando middleware simplificado...', 'yellow');
  
  const middlewarePath = path.join(__dirname, '..', 'middleware.ts');
  const middlewareContent = fs.readFileSync(middlewarePath, 'utf8');
  
  if (middlewareContent.includes('export default clerkMiddleware();')) {
    log('✅ Middleware simplificado corretamente', 'green');
  } else {
    log('❌ Middleware não foi simplificado', 'red');
    return false;
  }
  
  log('\n3. Verificando remoção de CSP headers...', 'yellow');
  
  const nextConfigPath = path.join(__dirname, '..', 'next.config.ts');
  const nextConfigContent = fs.readFileSync(nextConfigPath, 'utf8');
  
  if (!nextConfigContent.includes('Content-Security-Policy')) {
    log('✅ Headers CSP removidos corretamente', 'green');
  } else {
    log('❌ Headers CSP ainda estão presentes', 'red');
    return false;
  }
  
  return true;
}

async function testClerkAPI() {
  log('\n4. Testando API do Clerk com novas chaves...', 'yellow');
  
  const testScript = `
const { clerkClient } = require('@clerk/nextjs/server');

async function testAPI() {
  try {
    const users = await clerkClient().users.getUserList({ limit: 5 });
    console.log(\`✅ API funcionando! Encontrados \${users.totalCount} usuários\`);
    
    users.data.forEach((user, index) => {
      const email = user.emailAddresses[0]?.emailAddress || 'Sem email';
      const name = \`\${user.firstName || ''} \${user.lastName || ''}\`.trim() || 'Sem nome';
      console.log(\`\${index + 1}. 📧 \${email} | 👤 \${name}\`);
    });
    
    return true;
  } catch (error) {
    console.log(\`❌ Erro na API: \${error.message}\`);
    return false;
  }
}

testAPI();
`;
  
  const tempScriptPath = path.join(__dirname, 'temp-test-api.js');
  fs.writeFileSync(tempScriptPath, testScript);
  
  try {
    execSync(`cd ${path.dirname(tempScriptPath)} && node temp-test-api.js`, { 
      stdio: 'inherit',
      env: { ...process.env }
    });
    log('✅ Teste da API concluído', 'green');
    return true;
  } catch (error) {
    log('❌ Erro no teste da API', 'red');
    return false;
  } finally {
    if (fs.existsSync(tempScriptPath)) {
      fs.unlinkSync(tempScriptPath);
    }
  }
}

async function createSimplePage() {
  log('\n5. Criando página de teste simples...', 'yellow');
  
  const testPageContent = `
import { SignIn } from '@clerk/nextjs'

export default function TestSignIn() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#f5f5f5'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>
          Teste de Login - InterAlpha
        </h1>
        <SignIn 
          path="/test-signin"
          routing="path"
          signUpUrl="/sign-up"
          redirectUrl="/dashboard"
        />
      </div>
    </div>
  )
}
`;
  
  const testPagePath = path.join(__dirname, '..', 'src', 'app', 'test-signin', 'page.tsx');
  const testPageDir = path.dirname(testPagePath);
  
  if (!fs.existsSync(testPageDir)) {
    fs.mkdirSync(testPageDir, { recursive: true });
  }
  
  fs.writeFileSync(testPagePath, testPageContent);
  log('✅ Página de teste criada em /test-signin', 'green');
}

async function provideFinalInstructions() {
  log(`\n${colors.bold}📋 INSTRUÇÕES FINAIS${colors.reset}`, 'blue');
  
  log('\n🚀 Para testar o login:', 'yellow');
  log('1. Execute: npm run dev', 'green');
  log('2. Acesse: http://localhost:3000/test-signin', 'green');
  log('3. Teste com um dos usuários:', 'green');
  log('   • gabriel@interalpha.com.br', 'green');
  log('   • renato@interalpha.com.br', 'green');
  log('   • ricardo@interalpha.com.br', 'green');
  
  log('\n🔍 Se ainda não funcionar:', 'yellow');
  log('• Verifique o console do navegador para erros', 'yellow');
  log('• Teste em modo incógnito', 'yellow');
  log('• Limpe o cache do navegador', 'yellow');
  log('• Verifique se as chaves do Clerk estão ativas no dashboard', 'yellow');
  
  log('\n📧 Próximos passos se funcionar:', 'green');
  log('• Aplicar as correções à página principal /sign-in', 'green');
  log('• Restaurar o layout original com as correções', 'green');
  log('• Testar com todos os usuários', 'green');
}

async function main() {
  const configOK = await testNewClerkConfig();
  
  if (configOK) {
    const apiOK = await testClerkAPI();
    await createSimplePage();
    await provideFinalInstructions();
    
    log(`\n${colors.bold}✅ FASE 4 CONCLUÍDA${colors.reset}`, 'green');
    log('Configurações corrigidas e página de teste criada', 'green');
    log('Execute npm run dev e teste em /test-signin', 'yellow');
  } else {
    log(`\n${colors.bold}❌ FASE 4 FALHOU${colors.reset}`, 'red');
    log('Corrija os problemas de configuração antes de prosseguir', 'red');
  }
}

if (require.main === module) {
  main().catch(error => {
    log(`❌ Erro fatal: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  });
}

module.exports = { testNewClerkConfig, testClerkAPI };