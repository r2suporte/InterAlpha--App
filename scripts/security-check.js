#!/usr/bin/env node

/**
 * 🔒 Script de Verificação de Segurança - InterAlpha App
 *
 * Verifica configurações de segurança essenciais do projeto
 * Baseado na documentação em .context/docs/security.md
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
  bold: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkEnvVariables() {
  log('\n🔐 Verificando Variáveis de Ambiente...', 'blue');

  const requiredVars = [
    'JWT_SECRET',
    'NEXTAUTH_SECRET',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'DATABASE_URL',
  ];

  const sensitiveVars = [
    'SUPABASE_SERVICE_ROLE_KEY',
    'STRIPE_SECRET_KEY',
    'TWILIO_AUTH_TOKEN',
    'WHATSAPP_ACCESS_TOKEN',
  ];

  const issues = [];

  // Verificar variáveis obrigatórias
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      issues.push(`❌ Variável obrigatória ${varName} não definida`);
    } else if (
      process.env[varName].includes('fallback') ||
      process.env[varName].includes('your-')
    ) {
      issues.push(`⚠️  Variável ${varName} usando valor padrão inseguro`);
    } else {
      log(`✅ ${varName} configurada`, 'green');
    }
  });

  // Verificar se variáveis sensíveis não estão vazias
  sensitiveVars.forEach(varName => {
    if (
      process.env[varName] &&
      (process.env[varName].includes('YOUR_') ||
        process.env[varName].includes('your-'))
    ) {
      issues.push(`⚠️  Variável sensível ${varName} usando valor placeholder`);
    }
  });

  return issues;
}

function checkFilePermissions() {
  log('\n📁 Verificando Permissões de Arquivos...', 'blue');

  const sensitiveFiles = ['.env.local', '.env', 'prisma/schema.prisma'];

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

  // Verificar uso de fallback secrets
  const middlewarePath = path.join(process.cwd(), 'middleware.ts');
  if (fs.existsSync(middlewarePath)) {
    const content = fs.readFileSync(middlewarePath, 'utf8');
    if (content.includes('fallback-secret')) {
      issues.push('❌ Middleware usando fallback-secret inseguro');
    } else {
      log('✅ Middleware sem fallback secrets', 'green');
    }
  }

  // Verificar configuração do Next.js
  const nextConfigPath = path.join(process.cwd(), 'next.config.js');
  if (fs.existsSync(nextConfigPath)) {
    const content = fs.readFileSync(nextConfigPath, 'utf8');
    if (
      content.includes('X-Frame-Options') &&
      content.includes('X-Content-Type-Options')
    ) {
      log('✅ Headers de segurança configurados', 'green');
    } else {
      issues.push('⚠️  Headers de segurança não configurados no Next.js');
    }
  }

  return issues;
}

function checkDatabase() {
  log('\n🗄️ Verificando Configuração do Banco...', 'blue');

  const issues = [];

  // Verificar se está usando Supabase (mais seguro que DB local)
  if (
    process.env.DATABASE_URL &&
    process.env.DATABASE_URL.includes('supabase.co')
  ) {
    log('✅ Usando Supabase (recomendado)', 'green');
  } else if (
    process.env.DATABASE_URL &&
    process.env.DATABASE_URL.includes('localhost')
  ) {
    issues.push('⚠️  Usando banco local - considere Supabase para produção');
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
  log('=' * 50, 'blue');

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
