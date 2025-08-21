#!/usr/bin/env node

/**
 * Script para configurar ambiente de desenvolvimento do InterAlpha
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('🚀 Configurando ambiente de desenvolvimento InterAlpha...\n')

// Verificar se as dependências estão instaladas
console.log('📦 Verificando dependências...')
try {
  execSync('npm list --depth=0', { stdio: 'ignore' })
  console.log('✅ Dependências instaladas\n')
} catch (error) {
  console.log('⚠️  Instalando dependências...')
  execSync('npm install', { stdio: 'inherit' })
  console.log('✅ Dependências instaladas\n')
}

// Verificar arquivo .env.local
console.log('🔧 Verificando configurações...')
const envPath = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  console.log('✅ Arquivo .env.local encontrado\n')
} else {
  console.log('⚠️  Arquivo .env.local não encontrado')
  console.log('📋 Copiando .env.example para .env.local...')
  
  const envExamplePath = path.join(process.cwd(), '.env.example')
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath)
    console.log('✅ Arquivo .env.local criado\n')
  } else {
    console.log('❌ Arquivo .env.example não encontrado\n')
  }
}

// Verificar banco de dados
console.log('🗄️  Configurando banco de dados...')
try {
  execSync('npx prisma generate', { stdio: 'inherit' })
  console.log('✅ Prisma client gerado\n')
  
  execSync('npx prisma db push', { stdio: 'inherit' })
  console.log('✅ Schema do banco sincronizado\n')
  
  execSync('npm run db:seed', { stdio: 'inherit' })
  console.log('✅ Dados iniciais inseridos\n')
} catch (error) {
  console.log('⚠️  Erro na configuração do banco:', error.message)
  console.log('💡 Verifique a variável DATABASE_URL no .env.local\n')
}

// Informações sobre usuário de teste
console.log('👤 CONFIGURAÇÃO DE USUÁRIO DE TESTE:\n')
console.log('Para criar um usuário de teste, você tem duas opções:\n')

console.log('📱 OPÇÃO 1 - Via Dashboard Clerk:')
console.log('1. Acesse: https://dashboard.clerk.com/')
console.log('2. Selecione seu projeto')
console.log('3. Vá em "Users" > "Create user"')
console.log('4. Use: teste@interalpha.com / Teste123!\n')

console.log('🌐 OPÇÃO 2 - Via Interface Web:')
console.log('1. Execute: npm run dev')
console.log('2. Acesse: http://localhost:3000')
console.log('3. Clique em "Começar Agora"')
console.log('4. Registre-se com: teste@interalpha.com / Teste123!\n')

console.log('🎯 CREDENCIAIS SUGERIDAS:')
console.log('📧 Email: teste@interalpha.com')
console.log('🔑 Senha: Teste123!')
console.log('👤 Nome: Usuário Teste\n')

console.log('🔧 COMANDOS ÚTEIS:')
console.log('npm run dev          - Iniciar servidor de desenvolvimento')
console.log('npm run db:studio    - Abrir Prisma Studio')
console.log('npm run db:seed      - Inserir dados de teste')
console.log('npm run test-apis    - Testar APIs')
console.log('node scripts/create-test-user.js - Instruções detalhadas\n')

console.log('✅ Ambiente configurado com sucesso!')
console.log('🚀 Execute "npm run dev" para iniciar o servidor\n')