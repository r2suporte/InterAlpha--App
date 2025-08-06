#!/usr/bin/env node

/**
 * Script para verificação automática de segurança
 * Execute com: npm run security:check
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔒 Iniciando verificação de segurança...\n');

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

function runCommand(command, description) {
  try {
    log(`🔍 ${description}...`, 'blue');
    const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    return { success: true, output };
  } catch (error) {
    return { success: false, error: error.message, output: error.stdout };
  }
}

async function checkSecurity() {
  const results = {
    vulnerabilities: null,
    outdated: null,
    envVars: null,
    files: null,
  };

  // 1. Verificar vulnerabilidades npm
  log('\n📋 1. Verificando vulnerabilidades de dependências', 'bold');
  const auditResult = runCommand('npm audit --json', 'Executando npm audit');
  
  if (auditResult.success) {
    try {
      const auditData = JSON.parse(auditResult.output);
      const vulnerabilities = auditData.metadata?.vulnerabilities || {};
      const total = Object.values(vulnerabilities).reduce((sum, count) => sum + count, 0);
      
      if (total === 0) {
        log('✅ Nenhuma vulnerabilidade encontrada', 'green');
        results.vulnerabilities = { status: 'ok', count: 0 };
      } else {
        log(`⚠️  ${total} vulnerabilidade(s) encontrada(s):`, 'yellow');
        Object.entries(vulnerabilities).forEach(([severity, count]) => {
          if (count > 0) {
            log(`   - ${severity}: ${count}`, 'yellow');
          }
        });
        results.vulnerabilities = { status: 'warning', count: total, details: vulnerabilities };
      }
    } catch (error) {
      log('❌ Erro ao analisar resultado do audit', 'red');
      results.vulnerabilities = { status: 'error', error: error.message };
    }
  } else {
    log('❌ Erro ao executar npm audit', 'red');
    results.vulnerabilities = { status: 'error', error: auditResult.error };
  }

  // 2. Verificar dependências desatualizadas
  log('\n📋 2. Verificando dependências desatualizadas', 'bold');
  const outdatedResult = runCommand('npm outdated --json', 'Executando npm outdated');
  
  if (outdatedResult.success) {
    try {
      const outdatedData = JSON.parse(outdatedResult.output || '{}');
      const outdatedCount = Object.keys(outdatedData).length;
      
      if (outdatedCount === 0) {
        log('✅ Todas as dependências estão atualizadas', 'green');
        results.outdated = { status: 'ok', count: 0 };
      } else {
        log(`⚠️  ${outdatedCount} dependência(s) desatualizada(s)`, 'yellow');
        Object.entries(outdatedData).slice(0, 5).forEach(([pkg, info]) => {
          log(`   - ${pkg}: ${info.current} → ${info.latest}`, 'yellow');
        });
        if (outdatedCount > 5) {
          log(`   ... e mais ${outdatedCount - 5} dependências`, 'yellow');
        }
        results.outdated = { status: 'warning', count: outdatedCount };
      }
    } catch (error) {
      log('✅ Todas as dependências estão atualizadas', 'green');
      results.outdated = { status: 'ok', count: 0 };
    }
  } else {
    log('❌ Erro ao verificar dependências desatualizadas', 'red');
    results.outdated = { status: 'error', error: outdatedResult.error };
  }

  // 3. Verificar variáveis de ambiente críticas
  log('\n📋 3. Verificando configuração de segurança', 'bold');
  const criticalEnvVars = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'TWILIO_AUTH_TOKEN',
    'SMTP_PASS',
    'REDIS_PASSWORD'
  ];

  const missingEnvVars = criticalEnvVars.filter(varName => !process.env[varName]);
  
  if (missingEnvVars.length === 0) {
    log('✅ Todas as variáveis de ambiente críticas estão configuradas', 'green');
    results.envVars = { status: 'ok', missing: [] };
  } else {
    log(`⚠️  ${missingEnvVars.length} variável(is) de ambiente crítica(s) não configurada(s):`, 'yellow');
    missingEnvVars.forEach(varName => {
      log(`   - ${varName}`, 'yellow');
    });
    results.envVars = { status: 'warning', missing: missingEnvVars };
  }

  // 4. Verificar arquivos sensíveis
  log('\n📋 4. Verificando arquivos sensíveis', 'bold');
  const sensitiveFiles = [
    '.env',
    '.env.local',
    '.env.production',
    'private.key',
    'certificate.pem'
  ];

  const exposedFiles = sensitiveFiles.filter(file => {
    const filePath = path.join(process.cwd(), file);
    return fs.existsSync(filePath) && !isInGitignore(file);
  });

  if (exposedFiles.length === 0) {
    log('✅ Nenhum arquivo sensível exposto', 'green');
    results.files = { status: 'ok', exposed: [] };
  } else {
    log(`⚠️  ${exposedFiles.length} arquivo(s) sensível(is) pode(m) estar exposto(s):`, 'yellow');
    exposedFiles.forEach(file => {
      log(`   - ${file}`, 'yellow');
    });
    log('   💡 Verifique se estes arquivos estão no .gitignore', 'blue');
    results.files = { status: 'warning', exposed: exposedFiles };
  }

  // 5. Resumo final
  log('\n📊 Resumo da Verificação de Segurança', 'bold');
  log('=' .repeat(50), 'blue');

  const issues = [];
  
  if (results.vulnerabilities?.status === 'warning') {
    issues.push(`${results.vulnerabilities.count} vulnerabilidade(s)`);
  }
  
  if (results.outdated?.status === 'warning') {
    issues.push(`${results.outdated.count} dependência(s) desatualizada(s)`);
  }
  
  if (results.envVars?.status === 'warning') {
    issues.push(`${results.envVars.missing.length} variável(is) de ambiente não configurada(s)`);
  }
  
  if (results.files?.status === 'warning') {
    issues.push(`${results.files.exposed.length} arquivo(s) sensível(is) exposto(s)`);
  }

  if (issues.length === 0) {
    log('🎉 Parabéns! Nenhum problema de segurança encontrado.', 'green');
    log('✅ Seu projeto está seguro!', 'green');
  } else {
    log(`⚠️  ${issues.length} problema(s) de segurança encontrado(s):`, 'yellow');
    issues.forEach(issue => log(`   - ${issue}`, 'yellow'));
    
    log('\n🔧 Ações recomendadas:', 'blue');
    
    if (results.vulnerabilities?.status === 'warning') {
      log('   - Execute: npm audit fix', 'blue');
    }
    
    if (results.outdated?.status === 'warning') {
      log('   - Execute: npm update', 'blue');
    }
    
    if (results.envVars?.status === 'warning') {
      log('   - Configure as variáveis de ambiente faltantes', 'blue');
    }
    
    if (results.files?.status === 'warning') {
      log('   - Adicione arquivos sensíveis ao .gitignore', 'blue');
    }
  }

  // Salvar relatório
  const reportPath = path.join(process.cwd(), 'security-report.json');
  const report = {
    timestamp: new Date().toISOString(),
    results,
    summary: {
      totalIssues: issues.length,
      issues,
      status: issues.length === 0 ? 'secure' : 'needs-attention'
    }
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  log(`\n📄 Relatório salvo em: ${reportPath}`, 'blue');

  return issues.length === 0;
}

function isInGitignore(filename) {
  try {
    const gitignorePath = path.join(process.cwd(), '.gitignore');
    if (!fs.existsSync(gitignorePath)) return false;
    
    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
    return gitignoreContent.split('\n').some(line => {
      const trimmed = line.trim();
      // Verificar padrões exatos
      if (trimmed === filename || trimmed === `/${filename}`) return true;
      
      // Verificar padrões glob simples
      if (trimmed.endsWith('*')) {
        const pattern = trimmed.slice(0, -1);
        return filename.startsWith(pattern);
      }
      
      return false;
    });
  } catch (error) {
    return false;
  }
}

// Executar verificação
checkSecurity()
  .then(isSecure => {
    process.exit(isSecure ? 0 : 1);
  })
  .catch(error => {
    log(`❌ Erro durante verificação de segurança: ${error.message}`, 'red');
    process.exit(1);
  });