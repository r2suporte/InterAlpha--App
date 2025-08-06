#!/usr/bin/env node

/**
 * Script para inicializar as integrações em desenvolvimento
 * Execute com: node scripts/init-integrations.js
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Inicializando integrações InterAlpha...\n');

// Verificar se o Redis está rodando
console.log('1. Verificando Redis...');
try {
  execSync('redis-cli ping', { stdio: 'pipe' });
  console.log('✅ Redis está rodando\n');
} catch (error) {
  console.log('❌ Redis não está rodando. Iniciando Redis...');
  try {
    // Tentar iniciar Redis (macOS com Homebrew)
    execSync('brew services start redis', { stdio: 'inherit' });
    console.log('✅ Redis iniciado\n');
  } catch (redisError) {
    console.log('⚠️  Não foi possível iniciar o Redis automaticamente.');
    console.log('Por favor, inicie o Redis manualmente:');
    console.log('  - macOS: brew services start redis');
    console.log('  - Linux: sudo systemctl start redis');
    console.log('  - Docker: docker run -d -p 6379:6379 redis:alpine\n');
  }
}

// Verificar variáveis de ambiente
console.log('2. Verificando variáveis de ambiente...');
const requiredEnvVars = [
  'DATABASE_URL',
  'SMTP_USER',
  'SMTP_PASS',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.log('⚠️  Variáveis de ambiente faltando:');
  missingVars.forEach(varName => console.log(`   - ${varName}`));
  console.log('\nCopie .env.example para .env e configure as variáveis necessárias.\n');
} else {
  console.log('✅ Variáveis de ambiente configuradas\n');
}

// Verificar dependências
console.log('3. Verificando dependências...');
const requiredPackages = [
  'nodemailer',
  'twilio',
  'bullmq',
  'ioredis',
  '@googleapis/calendar',
  '@googleapis/oauth2',
];

try {
  const packageJson = require(path.join(process.cwd(), 'package.json'));
  const installedPackages = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };

  const missingPackages = requiredPackages.filter(pkg => !installedPackages[pkg]);

  if (missingPackages.length > 0) {
    console.log('❌ Dependências faltando:');
    missingPackages.forEach(pkg => console.log(`   - ${pkg}`));
    console.log('\nExecute: npm install para instalar as dependências\n');
  } else {
    console.log('✅ Todas as dependências estão instaladas\n');
  }
} catch (error) {
  console.log('⚠️  Não foi possível verificar dependências\n');
}

// Testar conexão com banco
console.log('4. Testando conexão com banco...');
try {
  // Usar o Prisma para testar a conexão
  execSync('npx prisma db pull --force', { stdio: 'pipe' });
  console.log('✅ Conexão com banco funcionando\n');
} catch (error) {
  console.log('❌ Erro na conexão com banco');
  console.log('Verifique se o DATABASE_URL está correto no .env\n');
}

console.log('🎉 Verificação das integrações concluída!');
console.log('\nPróximos passos:');
console.log('1. Configure as variáveis de ambiente no arquivo .env');
console.log('2. Execute: npm run dev');
console.log('3. Acesse: http://localhost:3000/api/integrations/health');
console.log('4. Verifique as filas em: http://localhost:3000/api/integrations/queues/stats\n');