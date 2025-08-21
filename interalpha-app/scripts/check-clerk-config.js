#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

console.log('🔍 Verificando configuração do Clerk...\n')

// Verificar arquivo .env
const envPath = path.join(__dirname, '..', '.env')
if (!fs.existsSync(envPath)) {
  console.log('❌ Arquivo .env não encontrado!')
  console.log('   Crie o arquivo .env na raiz do projeto')
  process.exit(1)
}

// Ler variáveis de ambiente
const envContent = fs.readFileSync(envPath, 'utf8')
const envLines = envContent.split('\n')

const requiredVars = [
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY'
]

const foundVars = {}
let hasErrors = false

// Verificar cada variável
envLines.forEach(line => {
  const [key, value] = line.split('=')
  if (key && value) {
    foundVars[key.trim()] = value.trim().replace(/['"]/g, '')
  }
})

console.log('📋 Verificando variáveis obrigatórias:\n')

requiredVars.forEach(varName => {
  const value = foundVars[varName]
  
  if (!value) {
    console.log(`❌ ${varName}: NÃO ENCONTRADA`)
    hasErrors = true
  } else if (value.includes('SUBSTITUA') || value.includes('your_') || value.includes('pk_test_SUBSTITUA')) {
    console.log(`⚠️  ${varName}: PRECISA SER CONFIGURADA`)
    console.log(`   Valor atual: ${value}`)
    hasErrors = true
  } else {
    // Verificar formato das chaves
    if (varName === 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY') {
      if (value.startsWith('pk_test_') || value.startsWith('pk_live_')) {
        console.log(`✅ ${varName}: OK`)
      } else {
        console.log(`❌ ${varName}: FORMATO INVÁLIDO`)
        console.log(`   Deve começar com 'pk_test_' ou 'pk_live_'`)
        hasErrors = true
      }
    } else if (varName === 'CLERK_SECRET_KEY') {
      if (value.startsWith('sk_test_') || value.startsWith('sk_live_')) {
        console.log(`✅ ${varName}: OK`)
      } else {
        console.log(`❌ ${varName}: FORMATO INVÁLIDO`)
        console.log(`   Deve começar com 'sk_test_' ou 'sk_live_'`)
        hasErrors = true
      }
    }
  }
})

console.log('\n📋 Verificando variáveis opcionais:\n')

const optionalVars = [
  'NEXT_PUBLIC_CLERK_SIGN_IN_URL',
  'NEXT_PUBLIC_CLERK_SIGN_UP_URL',
  'NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL',
  'NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL'
]

optionalVars.forEach(varName => {
  const value = foundVars[varName]
  if (value) {
    console.log(`✅ ${varName}: ${value}`)
  } else {
    console.log(`⚠️  ${varName}: Não configurada (usará padrão)`)
  }
})

// Verificar arquivos de páginas do Clerk
console.log('\n📋 Verificando páginas do Clerk:\n')

const clerkPages = [
  'src/app/sign-in/[[...sign-in]]/page.tsx',
  'src/app/sign-up/[[...sign-up]]/page.tsx'
]

clerkPages.forEach(pagePath => {
  const fullPath = path.join(__dirname, '..', pagePath)
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${pagePath}: OK`)
  } else {
    console.log(`❌ ${pagePath}: NÃO ENCONTRADA`)
    hasErrors = true
  }
})

// Resultado final
console.log('\n' + '='.repeat(50))

if (hasErrors) {
  console.log('❌ CONFIGURAÇÃO INCOMPLETA')
  console.log('\n📖 Para configurar o Clerk:')
  console.log('1. Leia o arquivo CLERK_SETUP.md')
  console.log('2. Crie uma conta em https://clerk.com')
  console.log('3. Obtenha suas chaves e atualize o .env')
  console.log('4. Execute este script novamente')
  process.exit(1)
} else {
  console.log('✅ CONFIGURAÇÃO COMPLETA!')
  console.log('\n🚀 Próximos passos:')
  console.log('1. Reinicie o servidor: npm run dev')
  console.log('2. Acesse: http://localhost:3000')
  console.log('3. Crie o primeiro usuário administrador')
  console.log('4. Teste o login')
}

console.log('\n📖 Documentação completa: CLERK_SETUP.md')
console.log('='.repeat(50))