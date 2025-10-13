#!/usr/bin/env node

/**
 * 🚀 Setup do Ambiente de Produção - InterAlpha App
 * 
 * Este script configura o ambiente completo com Supabase:
 * 1. Aplica o schema do Prisma no banco
 * 2. Cria usuário administrador
 * 3. Configura dados iniciais
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Cores para output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function execCommand(command, description) {
  log(`\n🔄 ${description}...`, 'cyan');
  try {
    const output = execSync(command, { 
      encoding: 'utf8', 
      stdio: 'pipe',
      cwd: process.cwd()
    });
    log(`✅ ${description} - Concluído`, 'green');
    return output;
  } catch (error) {
    log(`❌ ${description} - Falhou`, 'red');
    log(`Erro: ${error.message}`, 'red');
    if (error.stdout) log(`Stdout: ${error.stdout}`, 'yellow');
    if (error.stderr) log(`Stderr: ${error.stderr}`, 'yellow');
    throw error;
  }
}

function checkEnvFile() {
  log('\n📋 Verificando arquivo .env.local...', 'cyan');
  
  if (!fs.existsSync('.env.local')) {
    log('❌ Arquivo .env.local não encontrado!', 'red');
    log('💡 Copie o arquivo .env.example para .env.local e configure as credenciais', 'yellow');
    process.exit(1);
  }
  
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const hasSupabaseUrl = envContent.includes('NEXT_PUBLIC_SUPABASE_URL');
  const hasSupabaseKey = envContent.includes('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!hasSupabaseUrl || !hasSupabaseKey) {
    log('❌ Credenciais do Supabase não encontradas no .env.local!', 'red');
    log('💡 Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY', 'yellow');
    process.exit(1);
  }
  
  log('✅ Arquivo .env.local configurado', 'green');
}

function setupDatabase() {
  log('\n🗄️ Configurando banco de dados...', 'magenta');
  
  // Gerar cliente Prisma
  execCommand('npx prisma generate', 'Gerando cliente Prisma');
  
  // Aplicar schema no banco
  execCommand('npx prisma db push', 'Aplicando schema no banco de dados');
  
  log('✅ Banco de dados configurado com sucesso!', 'green');
}

function createAdminUser() {
  log('\n👤 Criando usuário administrador...', 'magenta');
  
  const createUserScript = `
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  const prisma = new PrismaClient();
  
  try {
    // Hash da senha
    const hashedPassword = await bcrypt.hash('InterAlpha2024!', 12);
    
    // Criar ou atualizar usuário admin
    const admin = await prisma.user.upsert({
      where: { email: 'adm@interalpha.com.br' },
      update: {
        name: 'Administrador',
        role: 'ADMIN',
        isActive: true,
        password: hashedPassword
      },
      create: {
        email: 'adm@interalpha.com.br',
        name: 'Administrador',
        role: 'ADMIN',
        isActive: true,
        password: hashedPassword
      }
    });
    
    console.log('✅ Usuário administrador criado:', admin.email);
    
    // Criar usuários de teste
    const testUsers = [
      { email: 'diretor@interalpha.com.br', name: 'Diretor Teste', role: 'DIRETOR' },
      { email: 'gerente@interalpha.com.br', name: 'Gerente Teste', role: 'GERENTE' },
      { email: 'tecnico@interalpha.com.br', name: 'Técnico Teste', role: 'TECNICO' },
      { email: 'atendente@interalpha.com.br', name: 'Atendente Teste', role: 'ATENDENTE' }
    ];
    
    for (const userData of testUsers) {
      await prisma.user.upsert({
        where: { email: userData.email },
        update: {
          name: userData.name,
          role: userData.role,
          isActive: true,
          password: hashedPassword
        },
        create: {
          email: userData.email,
          name: userData.name,
          role: userData.role,
          isActive: true,
          password: hashedPassword
        }
      });
      console.log('✅ Usuário criado:', userData.email);
    }
    
  } catch (error) {
    console.error('❌ Erro ao criar usuários:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
`;

  // Salvar script temporário
  fs.writeFileSync('temp-create-users.js', createUserScript);
  
  try {
    execCommand('node temp-create-users.js', 'Executando criação de usuários');
  } finally {
    // Limpar arquivo temporário
    if (fs.existsSync('temp-create-users.js')) {
      fs.unlinkSync('temp-create-users.js');
    }
  }
}

function verifySetup() {
  log('\n🔍 Verificando configuração...', 'cyan');
  
  const verifyScript = `
const { PrismaClient } = require('@prisma/client');

async function verify() {
  const prisma = new PrismaClient();
  
  try {
    const userCount = await prisma.user.count();
    console.log('📊 Total de usuários no banco:', userCount);
    
    const admin = await prisma.user.findUnique({
      where: { email: 'adm@interalpha.com.br' }
    });
    
    if (admin) {
      console.log('✅ Usuário administrador encontrado:', admin.email);
    } else {
      console.log('❌ Usuário administrador não encontrado');
    }
    
  } catch (error) {
    console.error('❌ Erro na verificação:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verify();
`;

  fs.writeFileSync('temp-verify.js', verifyScript);
  
  try {
    execCommand('node temp-verify.js', 'Verificando usuários criados');
  } finally {
    if (fs.existsSync('temp-verify.js')) {
      fs.unlinkSync('temp-verify.js');
    }
  }
}

async function main() {
  log('🚀 Iniciando configuração do ambiente InterAlpha App', 'bright');
  log('=' .repeat(60), 'blue');
  
  try {
    // Verificar arquivo de ambiente
    checkEnvFile();
    
    // Configurar banco de dados
    setupDatabase();
    
    // Criar usuários
    createAdminUser();
    
    // Verificar configuração
    verifySetup();
    
    log(`\n${  '='.repeat(60)}`, 'green');
    log('🎉 Configuração concluída com sucesso!', 'bright');
    log('\n📋 Informações de acesso:', 'cyan');
    log('   URL: http://localhost:3000/auth/login', 'white');
    log('   Email: adm@interalpha.com.br', 'white');
    log('   Senha: InterAlpha2024!', 'white');
    log('\n👥 Usuários de teste criados:', 'cyan');
    log('   - diretor@interalpha.com.br (DIRETOR)', 'white');
    log('   - gerente@interalpha.com.br (GERENTE)', 'white');
    log('   - tecnico@interalpha.com.br (TECNICO)', 'white');
    log('   - atendente@interalpha.com.br (ATENDENTE)', 'white');
    log('   Senha para todos: InterAlpha2024!', 'white');
    log('\n🚀 Execute: npm run dev', 'yellow');
    log('=' .repeat(60), 'green');
    
  } catch (error) {
    log('\n❌ Configuração falhou!', 'red');
    log(`Erro: ${error.message}`, 'red');
    log('\n🔧 Soluções possíveis:', 'yellow');
    log('   1. Verifique as credenciais do Supabase no .env.local', 'white');
    log('   2. Confirme se o projeto Supabase está ativo', 'white');
    log('   3. Execute: npm install', 'white');
    process.exit(1);
  }
}

main();