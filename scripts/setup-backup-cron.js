#!/usr/bin/env node

/**
 * 🕐 Configurador de Backup Automático - InterAlpha App
 * 
 * Este script configura cron jobs para executar backups automáticos
 * em intervalos regulares.
 */

const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

class BackupScheduler {
  constructor() {
    this.projectPath = process.cwd();
    this.backupScript = path.join(this.projectPath, 'scripts', 'backup-database.js');
    this.logFile = path.join(this.projectPath, 'logs', 'backup.log');
  }

  /**
   * Executa comando shell de forma assíncrona
   */
  async executeCommand(command) {
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject({ error, stderr });
        } else {
          resolve(stdout);
        }
      });
    });
  }

  /**
   * Cria diretório de logs se não existir
   */
  async ensureLogDirectory() {
    const logDir = path.dirname(this.logFile);
    try {
      await fs.access(logDir);
    } catch {
      await fs.mkdir(logDir, { recursive: true });
      console.log(`📁 Diretório de logs criado: ${logDir}`);
    }
  }

  /**
   * Gera entrada do crontab para backup diário
   */
  generateCronEntry(schedule = 'daily') {
    const nodeCmd = process.execPath;
    const scriptPath = this.backupScript;
    const logPath = this.logFile;

    const schedules = {
      'hourly': '0 * * * *',      // A cada hora
      'daily': '0 2 * * *',       // Diariamente às 2h
      'weekly': '0 2 * * 0',      // Semanalmente no domingo às 2h
      'monthly': '0 2 1 * *'      // Mensalmente no dia 1 às 2h
    };

    const cronTime = schedules[schedule] || schedules.daily;
    
    return `# InterAlpha App - Backup Automatizado (${schedule})
${cronTime} cd "${this.projectPath}" && "${nodeCmd}" "${scriptPath}" >> "${logPath}" 2>&1`;
  }

  /**
   * Obtém crontab atual
   */
  async getCurrentCrontab() {
    try {
      const output = await this.executeCommand('crontab -l');
      return output;
    } catch (error) {
      // Se não há crontab, retorna string vazia
      return '';
    }
  }

  /**
   * Remove entradas antigas do InterAlpha
   */
  async removeOldEntries(crontab) {
    const lines = crontab.split('\n');
    const filteredLines = lines.filter(line => 
      !line.includes('InterAlpha App - Backup') && line.trim() !== ''
    );
    return filteredLines.join('\n');
  }

  /**
   * Instala cron job para backup
   */
  async installCronJob(schedule = 'daily') {
    try {
      console.log(`🕐 Configurando backup automático (${schedule})...`);

      await this.ensureLogDirectory();

      // Obter crontab atual
      let currentCrontab = await this.getCurrentCrontab();
      
      // Remover entradas antigas do InterAlpha
      currentCrontab = await this.removeOldEntries(currentCrontab);
      
      // Adicionar nova entrada
      const newEntry = this.generateCronEntry(schedule);
      const updatedCrontab = currentCrontab ? 
        `${currentCrontab}\n${newEntry}` : 
        newEntry;

      // Criar arquivo temporário com novo crontab
      const tempFile = path.join(os.tmpdir(), 'interalpha_crontab.tmp');
      await fs.writeFile(tempFile, updatedCrontab);

      // Instalar novo crontab
      await this.executeCommand(`crontab "${tempFile}"`);
      
      // Limpar arquivo temporário
      await fs.unlink(tempFile);

      console.log('✅ Backup automático configurado com sucesso!');
      console.log(`📅 Agendamento: ${schedule}`);
      console.log(`📝 Logs em: ${this.logFile}`);
      
      return true;
    } catch (error) {
      console.error('❌ Erro ao configurar backup automático:', error);
      return false;
    }
  }

  /**
   * Remove cron job de backup
   */
  async uninstallCronJob() {
    try {
      console.log('🗑️ Removendo backup automático...');

      // Obter crontab atual
      const currentCrontab = await this.getCurrentCrontab();
      
      // Remover entradas do InterAlpha
      const updatedCrontab = await this.removeOldEntries(currentCrontab);

      if (updatedCrontab.trim() === '') {
        // Se não há mais entradas, remover crontab completamente
        await this.executeCommand('crontab -r');
      } else {
        // Criar arquivo temporário com crontab atualizado
        const tempFile = path.join(os.tmpdir(), 'interalpha_crontab.tmp');
        await fs.writeFile(tempFile, updatedCrontab);

        // Instalar crontab atualizado
        await this.executeCommand(`crontab "${tempFile}"`);
        
        // Limpar arquivo temporário
        await fs.unlink(tempFile);
      }

      console.log('✅ Backup automático removido com sucesso!');
      return true;
    } catch (error) {
      console.error('❌ Erro ao remover backup automático:', error);
      return false;
    }
  }

  /**
   * Mostra status do backup automático
   */
  async showStatus() {
    try {
      console.log('📊 Status do Backup Automático\n');

      const crontab = await this.getCurrentCrontab();
      const interalphaEntries = crontab.split('\n').filter(line => 
        line.includes('InterAlpha App - Backup')
      );

      if (interalphaEntries.length === 0) {
        console.log('❌ Nenhum backup automático configurado');
      } else {
        console.log('✅ Backup automático ativo:');
        interalphaEntries.forEach(entry => {
          console.log(`   ${entry}`);
        });
      }

      // Verificar se o script de backup existe
      try {
        await fs.access(this.backupScript);
        console.log('✅ Script de backup encontrado');
      } catch {
        console.log('❌ Script de backup não encontrado');
      }

      // Verificar logs recentes
      try {
        const stats = await fs.stat(this.logFile);
        console.log(`📝 Último log: ${stats.mtime.toLocaleString('pt-BR')}`);
      } catch {
        console.log('📝 Nenhum log encontrado');
      }

      console.log('\n📁 Comandos disponíveis:');
      console.log('  npm run backup:install     - Instalar backup diário');
      console.log('  npm run backup:uninstall   - Remover backup automático');
      console.log('  npm run backup:status      - Ver status atual');
      console.log('  npm run backup:run         - Executar backup manual');

    } catch (error) {
      console.error('❌ Erro ao verificar status:', error);
    }
  }

  /**
   * Testa backup manual
   */
  async testBackup() {
    try {
      console.log('🧪 Executando teste de backup...\n');
      
      const BackupService = require('./backup-database.js');
      const backup = new BackupService();
      const result = await backup.run();

      if (result.success) {
        console.log('\n✅ Teste de backup concluído com sucesso!');
      } else {
        console.log('\n❌ Teste de backup falhou:', result.error);
      }

      return result.success;
    } catch (error) {
      console.error('❌ Erro no teste de backup:', error);
      return false;
    }
  }
}

// CLI Interface
async function main() {
  const scheduler = new BackupScheduler();
  const command = process.argv[2];

  switch (command) {
    case 'install':
      const schedule = process.argv[3] || 'daily';
      await scheduler.installCronJob(schedule);
      break;
    
    case 'uninstall':
      await scheduler.uninstallCronJob();
      break;
    
    case 'status':
      await scheduler.showStatus();
      break;
    
    case 'test':
      await scheduler.testBackup();
      break;
    
    default:
      console.log('🔧 Configurador de Backup Automático - InterAlpha App\n');
      console.log('Uso: node setup-backup-cron.js <comando> [opções]\n');
      console.log('Comandos:');
      console.log('  install [schedule]  - Instalar backup automático');
      console.log('                       schedule: hourly, daily, weekly, monthly');
      console.log('  uninstall          - Remover backup automático');
      console.log('  status             - Mostrar status atual');
      console.log('  test               - Executar teste de backup');
      console.log('\nExemplos:');
      console.log('  node setup-backup-cron.js install daily');
      console.log('  node setup-backup-cron.js status');
      break;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = BackupScheduler;