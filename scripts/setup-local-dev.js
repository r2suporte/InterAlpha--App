#!/usr/bin/env node

/**
 * 🔧 Script de Configuração para Desenvolvimento Local
 * 
 * Este script configura um ambiente de desenvolvimento local usando SQLite
 * para que você possa testar a aplicação sem configurar o Supabase.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Configurando ambiente de desenvolvimento local...\n');

// 1. Backup do schema atual
console.log('📋 1. Fazendo backup do schema atual...');
const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
const backupPath = path.join(__dirname, '../prisma/schema.supabase.backup');

if (fs.existsSync(schemaPath)) {
  fs.copyFileSync(schemaPath, backupPath);
  console.log('✅ Backup criado: schema.supabase.backup');
}

// 2. Substituir schema por versão SQLite
console.log('\n📋 2. Configurando schema SQLite...');
const sqliteSchemaPath = path.join(__dirname, '../prisma/schema.sqlite.prisma');
if (fs.existsSync(sqliteSchemaPath)) {
  fs.copyFileSync(sqliteSchemaPath, schemaPath);
  console.log('✅ Schema SQLite configurado');
}

// 3. Backup do .env.local atual
console.log('\n🔧 3. Configurando variáveis de ambiente...');
const envPath = path.join(__dirname, '../.env.local');
const envBackupPath = path.join(__dirname, '../.env.supabase.backup');

if (fs.existsSync(envPath)) {
  fs.copyFileSync(envPath, envBackupPath);
  console.log('✅ Backup do .env.local criado: .env.supabase.backup');
}

// 4. Substituir .env.local por versão de desenvolvimento
const envDevPath = path.join(__dirname, '../.env.development');
if (fs.existsSync(envDevPath)) {
  fs.copyFileSync(envDevPath, envPath);
  console.log('✅ Configuração de desenvolvimento aplicada');
}

// 5. Gerar cliente Prisma
console.log('\n🔄 4. Gerando cliente Prisma...');
try {
  execSync('npx prisma generate', { 
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit'
  });
  console.log('✅ Cliente Prisma gerado');
} catch (error) {
  console.error('❌ Erro ao gerar cliente Prisma:', error.message);
}

// 6. Aplicar migrações
console.log('\n🗄️ 5. Aplicando migrações...');
try {
  execSync('npx prisma db push', { 
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit'
  });
  console.log('✅ Banco de dados configurado');
} catch (error) {
  console.error('❌ Erro ao aplicar migrações:', error.message);
}

// 7. Criar usuário administrador
console.log('\n👤 6. Criando usuário administrador...');
try {
  execSync('node scripts/create-admin-user-sqlite.js', { 
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit'
  });
  console.log('✅ Usuário administrador criado');
} catch (error) {
  console.error('❌ Erro ao criar usuário administrador:', error.message);
}

console.log('\n🎉 Configuração concluída!');
console.log('\n📋 Credenciais de acesso:');
console.log('   Email: adm@interalpha.com.br');
console.log('   Senha: InterAlpha2024!');
console.log('\n🌐 Acesse: http://localhost:3000/auth/login');
console.log('\n💡 Para voltar ao Supabase:');
console.log('   1. Restaure: cp prisma/schema.supabase.backup prisma/schema.prisma');
console.log('   2. Restaure: cp .env.supabase.backup .env.local');
console.log('   3. Execute: npx prisma generate');