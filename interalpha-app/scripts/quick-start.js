#!/usr/bin/env node

/**
 * Quick Start - InterAlpha
 * Script completo para inicializar o sistema rapidamente
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs').promises;

class QuickStart {
  constructor() {
    this.step = 0;
    this.totalSteps = 6;
  }

  async run() {
    console.log('🚀 QUICK START - INTERALPHA');
    console.log('='.repeat(50));
    console.log('Este script vai configurar e iniciar o sistema automaticamente\n');

    try {
      await this.step1_diagnosis();
      await this.step2_environment();
      await this.step3_database();
      await this.step4_dependencies();
      await this.step5_build();
      await this.step6_start();

    } catch (error) {
      console.error(`\n❌ Erro na etapa ${this.step}:`, error.message);
      console.log('\n💡 Soluções:');
      console.log('   1. Verifique o arquivo TROUBLESHOOTING.md');
      console.log('   2. Execute: node scripts/fix-runtime-issues.js');
      console.log('   3. Tente novamente');
      process.exit(1);
    }
  }

  async step1_diagnosis() {
    this.step = 1;
    console.log(`📋 Etapa ${this.step}/${this.totalSteps}: Diagnóstico do Sistema`);
    console.log('   Verificando configuração atual...');

    try {
      // Executar diagnóstico silencioso
      execSync('node scripts/fix-runtime-issues.js', { stdio: 'pipe' });
      console.log('   ✅ Sistema diagnosticado e corrigido');
    } catch (error) {
      throw new Error('Falha no diagnóstico - execute manualmente: node scripts/fix-runtime-issues.js');
    }
  }

  async step2_environment() {
    this.step = 2;
    console.log(`\n🔧 Etapa ${this.step}/${this.totalSteps}: Verificando Ambiente`);

    // Verificar Node.js
    try {
      const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
      console.log(`   ✅ Node.js: ${nodeVersion}`);
    } catch {
      throw new Error('Node.js não encontrado - instale Node.js 18+');
    }

    // Verificar npm
    try {
      const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
      console.log(`   ✅ npm: ${npmVersion}`);
    } catch {
      throw new Error('npm não encontrado');
    }

    // Verificar .env
    try {
      await fs.access('.env');
      console.log('   ✅ Arquivo .env configurado');
    } catch {
      throw new Error('Arquivo .env não encontrado');
    }
  }

  async step3_database() {
    this.step = 3;
    console.log(`\n🗄️  Etapa ${this.step}/${this.totalSteps}: Configurando Banco de Dados`);

    try {
      console.log('   📊 Gerando cliente Prisma...');
      execSync('npx prisma generate', { stdio: 'pipe' });
      console.log('   ✅ Cliente Prisma gerado');

      console.log('   🔄 Sincronizando schema...');
      execSync('npx prisma db push', { stdio: 'pipe' });
      console.log('   ✅ Schema sincronizado');

    } catch (error) {
      throw new Error('Erro na configuração do banco - verifique DATABASE_URL no .env');
    }
  }

  async step4_dependencies() {
    this.step = 4;
    console.log(`\n📦 Etapa ${this.step}/${this.totalSteps}: Verificando Dependências`);

    try {
      // Verificar se node_modules existe
      await fs.access('node_modules');
      console.log('   ✅ Dependências já instaladas');
    } catch {
      console.log('   📥 Instalando dependências...');
      execSync('npm install', { stdio: 'inherit' });
      console.log('   ✅ Dependências instaladas');
    }

    // Verificar dependências críticas
    const criticalDeps = ['next', 'react', 'prisma', '@prisma/client'];
    for (const dep of criticalDeps) {
      try {
        await fs.access(`node_modules/${dep}`);
        console.log(`   ✅ ${dep} disponível`);
      } catch {
        throw new Error(`Dependência crítica ${dep} não encontrada - execute: npm install`);
      }
    }
  }

  async step5_build() {
    this.step = 5;
    console.log(`\n🔨 Etapa ${this.step}/${this.totalSteps}: Verificando Build`);

    try {
      console.log('   📝 Verificando TypeScript...');
      execSync('npx tsc --noEmit', { stdio: 'pipe' });
      console.log('   ✅ TypeScript OK');
    } catch {
      console.log('   ⚠️  Avisos no TypeScript (não crítico)');
    }

    console.log('   ✅ Sistema pronto para iniciar');
  }

  async step6_start() {
    this.step = 6;
    console.log(`\n🌐 Etapa ${this.step}/${this.totalSteps}: Iniciando Servidor`);

    console.log('\n' + '='.repeat(60));
    console.log('🎉 SISTEMA INTERALPHA PRONTO!');
    console.log('='.repeat(60));
    console.log('🌐 Iniciando em: http://localhost:3000');
    console.log('📊 Dashboard: http://localhost:3000/dashboard');
    console.log('🛍️  Produtos: http://localhost:3000/produtos');
    console.log('🔍 Health: http://localhost:3000/api/system/health');
    console.log('='.repeat(60));
    console.log('💡 Dicas:');
    console.log('   - Use Ctrl+C para parar');
    console.log('   - Logs aparecem abaixo');
    console.log('   - Aguarde alguns segundos para carregar');
    console.log('='.repeat(60));

    // Aguardar um pouco antes de iniciar
    await this.sleep(2000);

    // Iniciar servidor
    console.log('\n🚀 Iniciando servidor Next.js...\n');
    
    const serverProcess = spawn('npm', ['run', 'dev'], {
      stdio: 'inherit',
      shell: true
    });

    // Handlers para encerramento
    process.on('SIGINT', () => {
      console.log('\n🛑 Encerrando servidor...');
      serverProcess.kill('SIGTERM');
      setTimeout(() => process.exit(0), 2000);
    });

    // Aguardar processo
    serverProcess.on('close', (code) => {
      console.log(`\n${code === 0 ? '✅' : '❌'} Servidor encerrado`);
      process.exit(code);
    });

    // Mostrar informações após alguns segundos
    setTimeout(() => {
      this.showPostStartInfo();
    }, 10000);
  }

  showPostStartInfo() {
    console.log('\n' + '='.repeat(60));
    console.log('📋 INFORMAÇÕES ÚTEIS');
    console.log('='.repeat(60));
    console.log('🧪 Testar APIs: node scripts/test-apis-quick.js (em outro terminal)');
    console.log('🔧 Diagnóstico: node scripts/fix-runtime-issues.js');
    console.log('📚 Ajuda: cat TROUBLESHOOTING.md');
    console.log('🔍 Logs: Aparecem neste terminal em tempo real');
    console.log('='.repeat(60));
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Executar Quick Start
async function main() {
  const quickStart = new QuickStart();
  await quickStart.run();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { QuickStart };