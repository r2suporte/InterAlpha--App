#!/usr/bin/env node

/**
 * Script de Inicialização do Servidor InterAlpha
 * Verifica configurações e inicia o servidor de desenvolvimento
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs').promises;

class ServerStarter {
  constructor() {
    this.serverProcess = null;
  }

  async start() {
    console.log('🚀 Iniciando servidor InterAlpha...\n');

    try {
      // 1. Verificações pré-inicialização
      await this.preStartChecks();

      // 2. Preparar ambiente
      await this.prepareEnvironment();

      // 3. Iniciar servidor
      await this.startDevelopmentServer();

    } catch (error) {
      console.error('❌ Erro ao iniciar servidor:', error.message);
      process.exit(1);
    }
  }

  async preStartChecks() {
    console.log('🔍 Verificações pré-inicialização...');

    // Verificar se estamos no diretório correto
    try {
      await fs.access('package.json');
      await fs.access('next.config.ts');
      console.log('  ✅ Diretório do projeto correto');
    } catch {
      throw new Error('Execute este script no diretório raiz do projeto InterAlpha');
    }

    // Verificar variáveis essenciais
    try {
      const envContent = await fs.readFile('.env', 'utf8');
      if (!envContent.includes('DATABASE_URL')) {
        throw new Error('DATABASE_URL não configurada no .env');
      }
      console.log('  ✅ Variáveis de ambiente básicas OK');
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error('Arquivo .env não encontrado. Execute: node scripts/fix-runtime-issues.js');
      }
      throw error;
    }

    // Verificar dependências
    try {
      await fs.access('node_modules');
      console.log('  ✅ Dependências instaladas');
    } catch {
      throw new Error('Dependências não instaladas. Execute: npm install');
    }
  }

  async prepareEnvironment() {
    console.log('\n🔧 Preparando ambiente...');

    try {
      // Gerar cliente Prisma
      console.log('  📊 Gerando cliente Prisma...');
      execSync('npx prisma generate', { stdio: 'pipe' });
      console.log('  ✅ Cliente Prisma gerado');

      // Sincronizar schema do banco
      console.log('  🗄️  Sincronizando schema do banco...');
      execSync('npx prisma db push', { stdio: 'pipe' });
      console.log('  ✅ Schema sincronizado');

    } catch (error) {
      console.log('  ⚠️  Erro na preparação do ambiente:', error.message);
      console.log('  💡 Continuando mesmo assim...');
    }
  }

  async startDevelopmentServer() {
    console.log('\n🌐 Iniciando servidor de desenvolvimento...');
    console.log('  📍 URL: http://localhost:3000');
    console.log('  🔄 Modo: Desenvolvimento com hot reload');
    console.log('  ⏹️  Para parar: Ctrl+C\n');

    // Iniciar servidor Next.js
    this.serverProcess = spawn('npm', ['run', 'dev'], {
      stdio: 'inherit',
      shell: true
    });

    // Handlers para encerramento graceful
    process.on('SIGINT', () => this.gracefulShutdown());
    process.on('SIGTERM', () => this.gracefulShutdown());

    // Aguardar processo do servidor
    this.serverProcess.on('close', (code) => {
      if (code !== 0) {
        console.log(`\n❌ Servidor encerrado com código ${code}`);
      } else {
        console.log('\n✅ Servidor encerrado normalmente');
      }
    });

    this.serverProcess.on('error', (error) => {
      console.error('\n❌ Erro no servidor:', error.message);
    });

    // Aguardar um pouco e mostrar informações úteis
    setTimeout(() => {
      this.showServerInfo();
    }, 5000);
  }

  showServerInfo() {
    console.log('\n' + '='.repeat(60));
    console.log('🎉 SERVIDOR INTERALPHA INICIADO COM SUCESSO!');
    console.log('='.repeat(60));
    console.log('🌐 Aplicação: http://localhost:3000');
    console.log('📊 Dashboard: http://localhost:3000/dashboard');
    console.log('🛍️  Produtos: http://localhost:3000/produtos');
    console.log('📋 API Docs: http://localhost:3000/api');
    console.log('🔍 Health Check: http://localhost:3000/api/system/health');
    console.log('📈 Monitoramento: http://localhost:3000/api/system/monitoring');
    console.log('='.repeat(60));
    console.log('💡 Dicas:');
    console.log('   - Use Ctrl+C para parar o servidor');
    console.log('   - Logs aparecem em tempo real');
    console.log('   - Hot reload ativo para desenvolvimento');
    console.log('   - Verifique o terminal para erros');
    console.log('='.repeat(60));
  }

  gracefulShutdown() {
    console.log('\n🛑 Encerrando servidor...');
    
    if (this.serverProcess) {
      this.serverProcess.kill('SIGTERM');
      
      // Forçar encerramento após 5 segundos
      setTimeout(() => {
        if (this.serverProcess && !this.serverProcess.killed) {
          console.log('⚡ Forçando encerramento...');
          this.serverProcess.kill('SIGKILL');
        }
        process.exit(0);
      }, 5000);
    } else {
      process.exit(0);
    }
  }
}

// Executar inicialização
async function main() {
  const starter = new ServerStarter();
  await starter.start();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { ServerStarter };