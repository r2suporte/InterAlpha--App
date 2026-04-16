#!/usr/bin/env node

/**
 * 🔒 Script de Verificação de Segurança - InterAlpha App
 *
 * Verifica configurações de segurança essenciais do projeto
 * Baseado na documentação em .context/docs/security.md
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Cores para output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function loadLocalEnvFiles() {
  const envFiles = ['.env', '.env.local'];

  envFiles.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      dotenv.config({ path: filePath, override: false });
    }
  });
}

function checkEnvVariables() {
  log('\n🔐 Verificando Variáveis de Ambiente...', 'blue');

  const requiredVars = [
    'JWT_SECRET',
    'NEXTAUTH_SECRET',
    'DATABASE_URL',
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    'CLERK_SECRET_KEY',
  ];

  const sensitiveVars = [
    'CLERK_WEBHOOK_SECRET',
    'STRIPE_SECRET_KEY',
    'TWILIO_AUTH_TOKEN',
    'CLOUD_API_ACCESS_TOKEN',
    'WHATSAPP_APP_SECRET',
  ];

  const issues = [];

  const placeholderPatterns = ['fallback', 'your-', 'YOUR_', 'example', 'changeme'];

  // Verificar variáveis obrigatórias
  requiredVars.forEach(varName => {
    const value = process.env[varName];

    if (!value) {
      issues.push(`❌ Variável obrigatória ${varName} não definida`);
    } else if (placeholderPatterns.some(pattern => value.includes(pattern))) {
      issues.push(`⚠️  Variável ${varName} usando valor padrão inseguro`);
    } else {
      log(`✅ ${varName} configurada`, 'green');
    }
  });

  const jwtSecret = process.env.JWT_SECRET;
  if (jwtSecret && jwtSecret.trim().length < 32) {
    issues.push('❌ JWT_SECRET com tamanho insuficiente (mínimo recomendado: 32 caracteres)');
  }

  // Verificar se variáveis sensíveis não estão vazias
  sensitiveVars.forEach(varName => {
    const value = process.env[varName];
    if (value && placeholderPatterns.some(pattern => value.includes(pattern))) {
      issues.push(`⚠️  Variável sensível ${varName} usando valor placeholder`);
    }
  });

  if (!process.env.APP_TRUSTED_ORIGINS && process.env.NODE_ENV === 'production') {
    issues.push('⚠️  APP_TRUSTED_ORIGINS não definido para proteção de origem/CSRF');
  }

  return issues;
}

function checkFilePermissions() {
  log('\n📁 Verificando Permissões de Arquivos...', 'blue');

  const sensitiveFiles = ['.env.local', '.env', '.env.production'];

  const issues = [];

  sensitiveFiles.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      try {
        const stats = fs.statSync(filePath);
        const mode = stats.mode & parseInt('777', 8);

        if (mode > parseInt('600', 8)) {
          issues.push(
            `⚠️  Arquivo ${file} tem permissões muito abertas (${mode.toString(8)})`
          );
        } else {
          log(`✅ ${file} com permissões adequadas`, 'green');
        }
      } catch (error) {
        issues.push(
          `❌ Erro ao verificar permissões de ${file}: ${error.message}`
        );
      }
    }
  });

  return issues;
}

function checkDependencies() {
  log('\n📦 Verificando Dependências de Segurança...', 'blue');

  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const issues = [];

  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const dependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    // Verificar dependências de segurança essenciais
    const securityDeps = {
      bcryptjs: 'Hashing de senhas',
      jsonwebtoken: 'Tokens JWT',
      zod: 'Validação de entrada',
    };

    Object.entries(securityDeps).forEach(([dep, description]) => {
      if (dependencies[dep]) {
        log(`✅ ${dep} instalado (${description})`, 'green');
      } else {
        issues.push(
          `⚠️  Dependência de segurança ${dep} não encontrada (${description})`
        );
      }
    });

    // Verificar versões desatualizadas (simulação básica)
    const outdatedWarnings = [
      'next@^14', // Versão anterior
      'react@^17', // Versão anterior
    ];

    outdatedWarnings.forEach(warning => {
      const [pkg, version] = warning.split('@');
      if (
        dependencies[pkg] &&
        dependencies[pkg].includes(version.replace('^', ''))
      ) {
        issues.push(`⚠️  ${pkg} pode estar desatualizado`);
      }
    });
  }

  return issues;
}

function checkCodeSecurity() {
  log('\n🔍 Verificando Código...', 'blue');

  const issues = [];

  // Verificar uso de fallback secrets no proxy/middleware
  const middlewarePath = fs.existsSync(path.join(process.cwd(), 'proxy.ts'))
    ? path.join(process.cwd(), 'proxy.ts')
    : path.join(process.cwd(), 'middleware.ts');

  if (fs.existsSync(middlewarePath)) {
    const content = fs.readFileSync(middlewarePath, 'utf8');
    if (content.includes('fallback-secret')) {
      issues.push('❌ Middleware usando fallback-secret inseguro');
    } else {
      log('✅ Proxy/Middleware sem fallback secrets', 'green');
    }
  }

  // Verificar headers de segurança no proxy
  if (fs.existsSync(middlewarePath)) {
    const content = fs.readFileSync(middlewarePath, 'utf8');
    if (
      content.includes('X-Frame-Options') &&
      content.includes('X-Content-Type-Options') &&
      content.includes('Content-Security-Policy')
    ) {
      log('✅ Headers de segurança configurados', 'green');
    } else {
      issues.push('⚠️  Headers de segurança não configurados no proxy/middleware');
    }
  }

  return issues;
}

function checkDatabase() {
  log('\n🗄️ Verificando Configuração do Banco...', 'blue');

  const issues = [];

  // Verificar se está usando Neon (recomendado em produção)
  if (
    process.env.DATABASE_URL &&
    process.env.DATABASE_URL.includes('neon.tech')
  ) {
    log('✅ Usando Neon PostgreSQL', 'green');
  } else if (
    process.env.DATABASE_URL &&
    process.env.DATABASE_URL.includes('localhost')
  ) {
    issues.push('⚠️  Usando banco local - considere Neon para produção');
  }

  // Verificar se RLS está habilitado (através da presença de políticas)
  const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
  if (fs.existsSync(migrationsDir)) {
    const files = fs.readdirSync(migrationsDir);
    const hasRLSPolicies = files.some(file => {
      const content = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      return (
        content.includes('ROW LEVEL SECURITY') ||
        content.includes('CREATE POLICY')
      );
    });

    if (hasRLSPolicies) {
      log('✅ Políticas RLS encontradas', 'green');
    } else {
      issues.push(
        '⚠️  Nenhuma política RLS encontrada - considere implementar'
      );
    }
  }

  return issues;
}

function generateReport(allIssues) {
  log('\n📊 Relatório de Segurança', 'bold');
  log('='.repeat(50), 'blue');

  const criticalIssues = allIssues.filter(issue => issue.includes('❌'));
  const warnings = allIssues.filter(issue => issue.includes('⚠️'));

  if (criticalIssues.length === 0 && warnings.length === 0) {
    log('\n🎉 Parabéns! Nenhum problema de segurança encontrado!', 'green');
    return true;
  }

  if (criticalIssues.length > 0) {
    log('\n🚨 PROBLEMAS CRÍTICOS:', 'red');
    criticalIssues.forEach(issue => log(`  ${issue}`, 'red'));
  }

  if (warnings.length > 0) {
    log('\n⚠️  AVISOS:', 'yellow');
    warnings.forEach(issue => log(`  ${issue}`, 'yellow'));
  }

  log('\n📋 Recomendações:', 'blue');
  log('  1. Corrija todos os problemas críticos antes do deploy', 'blue');
  log('  2. Revise os avisos e implemente melhorias quando possível', 'blue');
  log('  3. Execute este script regularmente', 'blue');
  log('  4. Mantenha dependências atualizadas', 'blue');

  return criticalIssues.length === 0;
}

// Executar verificações
async function main() {
  log('🔒 InterAlpha Security Check', 'bold');
  log('Verificando configurações de segurança...', 'blue');
  loadLocalEnvFiles();

  const allIssues = [
    ...checkEnvVariables(),
    ...checkFilePermissions(),
    ...checkDependencies(),
    ...checkCodeSecurity(),
    ...checkDatabase(),
  ];

  const isSecure = generateReport(allIssues);

  process.exit(isSecure ? 0 : 1);
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  checkEnvVariables,
  checkFilePermissions,
  checkDependencies,
  checkCodeSecurity,
  checkDatabase,
};
