#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Cores para output no terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function execCommand(command, description) {
  log(`\n🔄 ${description}...`, 'cyan');
  try {
    execSync(command, { stdio: 'inherit' });
    log(`✅ ${description} concluído!`, 'green');
    return true;
  } catch (error) {
    log(`❌ Erro ao executar: ${description}`, 'red');
    log(error.message, 'red');
    return false;
  }
}

function checkFileExists(filePath) {
  return fs.existsSync(path.resolve(filePath));
}

function createDirectoryIfNotExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    log(`📁 Diretório criado: ${dirPath}`, 'yellow');
  }
}

// Comandos disponíveis
const commands = {
  // Verificação de saúde do projeto
  health: () => {
    log('\n🏥 Verificação de Saúde do Projeto', 'bright');
    log('=====================================', 'bright');

    const checks = [
      { name: 'package.json', path: 'package.json' },
      { name: 'tsconfig.json', path: 'tsconfig.json' },
      { name: 'next.config.js', path: 'next.config.js' },
      { name: 'tailwind.config.js', path: 'tailwind.config.js' },
      { name: 'ESLint config', path: 'eslint.config.js' },
      { name: 'Prettier config', path: '.prettierrc.js' },
      { name: '.env.local', path: '.env.local' },
      { name: 'node_modules', path: 'node_modules' },
    ];

    checks.forEach(check => {
      const exists = checkFileExists(check.path);
      const status = exists ? '✅' : '❌';
      const color = exists ? 'green' : 'red';
      log(`${status} ${check.name}`, color);
    });

    // Verificar dependências críticas
    log('\n📦 Verificando dependências críticas...', 'cyan');
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      const criticalDeps = [
        'next',
        'react',
        'react-dom',
        'typescript',
        '@prisma/client',
        'zod',
        'tailwindcss',
      ];

      criticalDeps.forEach(dep => {
        const hasInDeps = packageJson.dependencies?.[dep];
        const hasInDevDeps = packageJson.devDependencies?.[dep];
        const exists = hasInDeps || hasInDevDeps;
        const status = exists ? '✅' : '❌';
        const color = exists ? 'green' : 'red';
        log(`${status} ${dep}`, color);
      });
    } catch (error) {
      log('❌ Erro ao verificar package.json', 'red');
    }
  },

  // Limpeza de cache e arquivos temporários
  clean: () => {
    log('\n🧹 Limpeza de Cache e Arquivos Temporários', 'bright');
    log('==========================================', 'bright');

    const cleanCommands = [
      { cmd: 'rm -rf .next', desc: 'Removendo cache do Next.js' },
      { cmd: 'rm -rf node_modules/.cache', desc: 'Removendo cache do Node.js' },
      { cmd: 'rm -rf .swc', desc: 'Removendo cache do SWC' },
      { cmd: 'rm -rf coverage', desc: 'Removendo relatórios de cobertura' },
      {
        cmd: 'rm -rf cypress/videos cypress/screenshots',
        desc: 'Removendo arquivos do Cypress',
      },
      {
        cmd: 'rm -rf testsprite_tests/reports',
        desc: 'Removendo relatórios de teste',
      },
    ];

    cleanCommands.forEach(({ cmd, desc }) => {
      execCommand(cmd, desc);
    });

    log('\n✨ Limpeza concluída!', 'green');
  },

  // Instalação e atualização de dependências
  install: () => {
    log('\n📦 Instalação de Dependências', 'bright');
    log('==============================', 'bright');

    execCommand('npm ci', 'Instalando dependências');
    execCommand('npx prisma generate', 'Gerando cliente Prisma');
  },

  // Verificação de código
  lint: () => {
    log('\n🔍 Verificação de Código', 'bright');
    log('========================', 'bright');

    execCommand('npx eslint . --ext .js,.jsx,.ts,.tsx', 'Executando ESLint');
    execCommand(
      'npx prettier --check .',
      'Verificando formatação com Prettier'
    );
    execCommand('npx tsc --noEmit', 'Verificando tipos TypeScript');
  },

  // Correção automática de código
  fix: () => {
    log('\n🔧 Correção Automática de Código', 'bright');
    log('=================================', 'bright');

    execCommand(
      'npx eslint . --ext .js,.jsx,.ts,.tsx --fix',
      'Corrigindo problemas do ESLint'
    );
    execCommand('npx prettier --write .', 'Formatando código com Prettier');
  },

  // Execução de testes
  test: () => {
    log('\n🧪 Execução de Testes', 'bright');
    log('====================', 'bright');

    execCommand('npm run test', 'Executando testes unitários');
    execCommand('npm run test:coverage', 'Gerando relatório de cobertura');
  },

  // Verificação de segurança
  security: () => {
    log('\n🔒 Verificação de Segurança', 'bright');
    log('===========================', 'bright');

    execCommand('npm audit', 'Auditoria de segurança do npm');
    execCommand(
      'node scripts/security-check.js',
      'Verificação de segurança customizada'
    );
  },

  // Build do projeto
  build: () => {
    log('\n🏗️  Build do Projeto', 'bright');
    log('===================', 'bright');

    execCommand('npm run build', 'Construindo projeto para produção');
    execCommand('npm run lint', 'Verificando código');
  },

  // Desenvolvimento completo (setup inicial)
  setup: () => {
    log('\n🚀 Setup Completo do Ambiente de Desenvolvimento', 'bright');
    log('================================================', 'bright');

    // Criar diretórios necessários
    const dirs = [
      'logs',
      'temp',
      'docs/generated',
      'cypress/fixtures',
      'cypress/support',
      '__tests__/utils',
      '__tests__/components',
      '__tests__/api',
    ];

    dirs.forEach(dir => createDirectoryIfNotExists(dir));

    // Executar comandos de setup
    execCommand('npm ci', 'Instalando dependências');
    execCommand('npx prisma generate', 'Gerando cliente Prisma');
    execCommand('npm run lint:fix', 'Corrigindo problemas de código');
    execCommand('node scripts/security-check.js', 'Verificação de segurança');

    log('\n🎉 Setup concluído! Ambiente pronto para desenvolvimento.', 'green');
  },

  // Análise de bundle
  analyze: () => {
    log('\n📊 Análise de Bundle', 'bright');
    log('===================', 'bright');

    execCommand('ANALYZE=true npm run build', 'Analisando bundle do Next.js');
  },

  // Atualização de dependências
  update: () => {
    log('\n⬆️  Atualização de Dependências', 'bright');
    log('==============================', 'bright');

    execCommand('npm update', 'Atualizando dependências');
    execCommand('npm audit fix', 'Corrigindo vulnerabilidades');
    execCommand('npx prisma generate', 'Regenerando cliente Prisma');
  },

  // Informações do projeto
  info: () => {
    log('\n📋 Informações do Projeto', 'bright');
    log('=========================', 'bright');

    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      log(`Nome: ${packageJson.name}`, 'cyan');
      log(`Versão: ${packageJson.version}`, 'cyan');
      log(`Descrição: ${packageJson.description || 'N/A'}`, 'cyan');

      log('\n📦 Scripts disponíveis:', 'yellow');
      Object.keys(packageJson.scripts || {}).forEach(script => {
        log(`  • ${script}: ${packageJson.scripts[script]}`, 'white');
      });

      log('\n🔧 Dependências principais:', 'yellow');
      Object.keys(packageJson.dependencies || {})
        .slice(0, 10)
        .forEach(dep => {
          log(`  • ${dep}: ${packageJson.dependencies[dep]}`, 'white');
        });
    } catch (error) {
      log('❌ Erro ao ler informações do projeto', 'red');
    }
  },
};

// Função principal
function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === 'help') {
    log('\n🛠️  Ferramentas de Desenvolvimento - InterAlpha', 'bright');
    log('===============================================', 'bright');
    log('\nComandos disponíveis:', 'cyan');

    Object.keys(commands).forEach(cmd => {
      log(`  • ${cmd}`, 'yellow');
    });

    log('\nExemplos de uso:', 'cyan');
    log('  node scripts/dev-tools.js health', 'white');
    log('  node scripts/dev-tools.js setup', 'white');
    log('  node scripts/dev-tools.js lint', 'white');
    log('  node scripts/dev-tools.js clean', 'white');

    return;
  }

  if (commands[command]) {
    commands[command]();
  } else {
    log(`❌ Comando não encontrado: ${command}`, 'red');
    log('Use "help" para ver os comandos disponíveis.', 'yellow');
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = { commands, log, execCommand };
