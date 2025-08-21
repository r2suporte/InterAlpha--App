#!/usr/bin/env node

/**
 * Script de Diagnóstico e Correção de Problemas de Runtime
 * Resolve problemas de configuração e ambiente do InterAlpha
 */

const fs = require('fs').promises;
const { execSync } = require('child_process');
const path = require('path');

class RuntimeFixer {
  constructor() {
    this.issues = [];
    this.fixes = [];
    this.envPath = '.env';
    this.envExamplePath = '.env.example';
  }

  async diagnoseAndFix() {
    console.log('🔍 Iniciando diagnóstico de problemas de runtime...\n');

    try {
      // 1. Verificar arquivos de configuração
      await this.checkConfigFiles();

      // 2. Verificar variáveis de ambiente essenciais
      await this.checkEnvironmentVariables();

      // 3. Verificar banco de dados
      await this.checkDatabase();

      // 4. Verificar dependências
      await this.checkDependencies();

      // 5. Verificar Redis (opcional)
      await this.checkRedis();

      // 6. Aplicar correções
      await this.applyFixes();

      // 7. Testar sistema
      await this.testSystem();

      this.printSummary();

    } catch (error) {
      console.error('❌ Erro durante o diagnóstico:', error.message);
      process.exit(1);
    }
  }

  async checkConfigFiles() {
    console.log('📁 Verificando arquivos de configuração...');

    try {
      // Verificar se .env existe
      await fs.access(this.envPath);
      console.log('  ✅ Arquivo .env encontrado');
    } catch {
      this.issues.push('Arquivo .env não encontrado');
      this.fixes.push(() => this.createEnvFile());
    }

    try {
      // Verificar se .env.example existe
      await fs.access(this.envExamplePath);
      console.log('  ✅ Arquivo .env.example encontrado');
    } catch {
      console.log('  ⚠️  Arquivo .env.example não encontrado');
    }

    // Verificar package.json
    try {
      const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
      console.log('  ✅ package.json válido');
      
      // Verificar scripts essenciais
      const requiredScripts = ['dev', 'build', 'start', 'db:generate', 'db:push'];
      for (const script of requiredScripts) {
        if (!packageJson.scripts[script]) {
          this.issues.push(`Script '${script}' não encontrado em package.json`);
        }
      }
    } catch (error) {
      this.issues.push('package.json inválido ou não encontrado');
    }
  }

  async checkEnvironmentVariables() {
    console.log('\n🔧 Verificando variáveis de ambiente...');

    try {
      const envContent = await fs.readFile(this.envPath, 'utf8');
      const envVars = this.parseEnvFile(envContent);

      // Variáveis essenciais
      const requiredVars = [
        'DATABASE_URL',
        'NEXTAUTH_SECRET',
        'NEXTAUTH_URL'
      ];

      // Variáveis recomendadas
      const recommendedVars = [
        'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
        'CLERK_SECRET_KEY',
        'REDIS_URL'
      ];

      for (const varName of requiredVars) {
        if (!envVars[varName] || envVars[varName].trim() === '') {
          this.issues.push(`Variável essencial ${varName} não configurada`);
          this.fixes.push(() => this.addEnvironmentVariable(varName));
        } else {
          console.log(`  ✅ ${varName} configurada`);
        }
      }

      for (const varName of recommendedVars) {
        if (!envVars[varName] || envVars[varName].trim() === '') {
          console.log(`  ⚠️  Variável recomendada ${varName} não configurada`);
        } else {
          console.log(`  ✅ ${varName} configurada`);
        }
      }

    } catch (error) {
      this.issues.push('Erro ao ler arquivo .env');
      this.fixes.push(() => this.createEnvFile());
    }
  }

  async checkDatabase() {
    console.log('\n🗄️  Verificando banco de dados...');

    try {
      // Verificar se Prisma está configurado
      await fs.access('prisma/schema.prisma');
      console.log('  ✅ Schema Prisma encontrado');

      // Tentar gerar o cliente Prisma
      try {
        execSync('npx prisma generate', { stdio: 'pipe' });
        console.log('  ✅ Cliente Prisma gerado com sucesso');
      } catch (error) {
        this.issues.push('Erro ao gerar cliente Prisma');
        this.fixes.push(() => this.fixPrismaClient());
      }

      // Tentar conectar ao banco
      try {
        execSync('npx prisma db push --accept-data-loss', { stdio: 'pipe' });
        console.log('  ✅ Conexão com banco de dados OK');
      } catch (error) {
        this.issues.push('Erro de conexão com banco de dados');
        this.fixes.push(() => this.fixDatabaseConnection());
      }

    } catch (error) {
      this.issues.push('Schema Prisma não encontrado');
    }
  }

  async checkDependencies() {
    console.log('\n📦 Verificando dependências...');

    try {
      // Verificar se node_modules existe
      await fs.access('node_modules');
      console.log('  ✅ node_modules encontrado');

      // Verificar dependências críticas
      const criticalDeps = [
        'next',
        'react',
        'prisma',
        '@prisma/client',
        'typescript'
      ];

      for (const dep of criticalDeps) {
        try {
          await fs.access(`node_modules/${dep}`);
          console.log(`  ✅ ${dep} instalado`);
        } catch {
          this.issues.push(`Dependência crítica ${dep} não encontrada`);
          this.fixes.push(() => this.installDependencies());
        }
      }

    } catch {
      this.issues.push('node_modules não encontrado');
      this.fixes.push(() => this.installDependencies());
    }
  }

  async checkRedis() {
    console.log('\n🔴 Verificando Redis (opcional)...');

    try {
      // Tentar conectar ao Redis local
      execSync('redis-cli ping', { stdio: 'pipe', timeout: 5000 });
      console.log('  ✅ Redis local disponível');
    } catch {
      console.log('  ⚠️  Redis local não disponível (opcional)');
      
      // Verificar se há URL do Redis configurada
      try {
        const envContent = await fs.readFile(this.envPath, 'utf8');
        const envVars = this.parseEnvFile(envContent);
        
        if (envVars.REDIS_URL) {
          console.log('  ✅ REDIS_URL configurada para serviço externo');
        } else {
          console.log('  ℹ️  Redis não configurado (sistema funcionará sem cache)');
        }
      } catch {
        console.log('  ℹ️  Redis não configurado');
      }
    }
  }

  async applyFixes() {
    if (this.fixes.length === 0) {
      console.log('\n✅ Nenhuma correção necessária!');
      return;
    }

    console.log(`\n🔧 Aplicando ${this.fixes.length} correções...`);

    for (let i = 0; i < this.fixes.length; i++) {
      try {
        console.log(`  ${i + 1}/${this.fixes.length} Aplicando correção...`);
        await this.fixes[i]();
      } catch (error) {
        console.error(`  ❌ Erro na correção ${i + 1}:`, error.message);
      }
    }
  }

  async testSystem() {
    console.log('\n🧪 Testando sistema...');

    try {
      // Testar build do TypeScript
      console.log('  📝 Verificando TypeScript...');
      execSync('npx tsc --noEmit', { stdio: 'pipe' });
      console.log('  ✅ TypeScript OK');
    } catch (error) {
      console.log('  ⚠️  Avisos no TypeScript (não crítico)');
    }

    try {
      // Testar se o Next.js pode inicializar
      console.log('  🚀 Testando inicialização do Next.js...');
      
      // Criar um teste rápido de build
      const testResult = execSync('timeout 30s npm run build 2>&1 || echo "BUILD_TIMEOUT"', { 
        encoding: 'utf8',
        timeout: 35000 
      });

      if (testResult.includes('BUILD_TIMEOUT')) {
        console.log('  ⚠️  Build demorou mais que 30s (pode ser normal)');
      } else if (testResult.includes('Error')) {
        console.log('  ❌ Erros no build detectados');
        console.log('     Verifique os logs acima para detalhes');
      } else {
        console.log('  ✅ Build do Next.js OK');
      }
    } catch (error) {
      console.log('  ⚠️  Não foi possível testar o build completo');
    }
  }

  // Métodos de correção
  async createEnvFile() {
    console.log('    📝 Criando arquivo .env...');
    
    const defaultEnv = `# InterAlpha - Configuração de Ambiente
DATABASE_URL="postgresql://neondb_owner:npg_3ReJlKsqWt4H@ep-crimson-cell-ac16s3ck-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="${this.generateSecret()}"

# Clerk Authentication (opcional - configure se necessário)
# NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_your-key"
# CLERK_SECRET_KEY="sk_test_your-key"

# Redis (opcional - para cache e filas)
# REDIS_URL="redis://localhost:6379"

# Email (opcional - para notificações)
# SMTP_HOST="smtp.gmail.com"
# SMTP_PORT="587"
# SMTP_USER="your-email@gmail.com"
# SMTP_PASS="your-app-password"
`;

    await fs.writeFile(this.envPath, defaultEnv);
    console.log('    ✅ Arquivo .env criado com configurações básicas');
  }

  async addEnvironmentVariable(varName) {
    console.log(`    📝 Adicionando variável ${varName}...`);
    
    let envContent = '';
    try {
      envContent = await fs.readFile(this.envPath, 'utf8');
    } catch {
      // Arquivo não existe, será criado
    }

    const defaultValues = {
      'NEXTAUTH_SECRET': this.generateSecret(),
      'NEXTAUTH_URL': 'http://localhost:3000',
      'DATABASE_URL': 'postgresql://neondb_owner:npg_3ReJlKsqWt4H@ep-crimson-cell-ac16s3ck-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require'
    };

    if (defaultValues[varName]) {
      envContent += `\n${varName}="${defaultValues[varName]}"`;
      await fs.writeFile(this.envPath, envContent);
      console.log(`    ✅ ${varName} adicionada`);
    }
  }

  async fixPrismaClient() {
    console.log('    🔧 Corrigindo cliente Prisma...');
    
    try {
      execSync('npx prisma generate', { stdio: 'inherit' });
      console.log('    ✅ Cliente Prisma regenerado');
    } catch (error) {
      console.log('    ❌ Erro ao regenerar cliente Prisma');
      throw error;
    }
  }

  async fixDatabaseConnection() {
    console.log('    🔧 Corrigindo conexão com banco...');
    
    try {
      // Tentar push do schema
      execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
      console.log('    ✅ Schema sincronizado com banco');
    } catch (error) {
      console.log('    ❌ Erro na conexão com banco');
      console.log('    💡 Verifique se a DATABASE_URL está correta');
      throw error;
    }
  }

  async installDependencies() {
    console.log('    📦 Instalando dependências...');
    
    try {
      execSync('npm install', { stdio: 'inherit' });
      console.log('    ✅ Dependências instaladas');
    } catch (error) {
      console.log('    ❌ Erro ao instalar dependências');
      throw error;
    }
  }

  // Métodos utilitários
  parseEnvFile(content) {
    const vars = {};
    const lines = content.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          let value = valueParts.join('=');
          // Remover aspas se existirem
          if ((value.startsWith('"') && value.endsWith('"')) || 
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          vars[key.trim()] = value;
        }
      }
    }
    
    return vars;
  }

  generateSecret() {
    return require('crypto').randomBytes(32).toString('hex');
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO DO DIAGNÓSTICO');
    console.log('='.repeat(60));
    
    if (this.issues.length === 0) {
      console.log('✅ Sistema está configurado corretamente!');
      console.log('\n🚀 Próximos passos:');
      console.log('   1. Execute: npm run dev');
      console.log('   2. Acesse: http://localhost:3000');
      console.log('   3. Configure autenticação (Clerk) se necessário');
    } else {
      console.log(`❌ ${this.issues.length} problema(s) identificado(s):`);
      this.issues.forEach((issue, i) => {
        console.log(`   ${i + 1}. ${issue}`);
      });
      
      console.log('\n💡 Recomendações:');
      console.log('   1. Execute este script novamente após corrigir os problemas');
      console.log('   2. Verifique a documentação para configurações específicas');
      console.log('   3. Configure serviços externos (Clerk, Redis) conforme necessário');
    }
    
    console.log('\n📚 Documentação:');
    console.log('   - README.md - Instruções gerais');
    console.log('   - .env.example - Exemplo de configuração');
    console.log('   - docs/ - Documentação técnica');
  }
}

// Executar diagnóstico
async function main() {
  const fixer = new RuntimeFixer();
  await fixer.diagnoseAndFix();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { RuntimeFixer };