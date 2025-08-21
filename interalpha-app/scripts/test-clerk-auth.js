#!/usr/bin/env node

/**
 * Script para testar a configuração de autenticação do Clerk
 */

const fs = require('fs')
const path = require('path')

console.log('🔐 Testando configuração de autenticação Clerk...\n')

// Verificar variáveis de ambiente
function checkEnvironmentVariables() {
  console.log('📋 Verificando variáveis de ambiente...')
  
  const envPath = path.join(process.cwd(), '.env.local')
  
  if (!fs.existsSync(envPath)) {
    console.log('❌ Arquivo .env.local não encontrado!')
    return false
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8')
  
  const requiredVars = [
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    'CLERK_SECRET_KEY',
    'NEXT_PUBLIC_CLERK_SIGN_IN_URL',
    'NEXT_PUBLIC_CLERK_SIGN_UP_URL',
    'NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL',
    'NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL'
  ]
  
  let allPresent = true
  
  requiredVars.forEach(varName => {
    if (envContent.includes(varName)) {
      console.log(`✅ ${varName}`)
    } else {
      console.log(`❌ ${varName} - AUSENTE`)
      allPresent = false
    }
  })
  
  return allPresent
}

// Verificar arquivos de configuração
function checkConfigFiles() {
  console.log('\n📁 Verificando arquivos de configuração...')
  
  const files = [
    'middleware.ts',
    'src/app/layout.tsx',
    'src/app/(auth)/layout.tsx',
    'src/app/(auth)/sign-in/[[...sign-in]]/page.tsx',
    'src/app/(auth)/sign-up/[[...sign-up]]/page.tsx',
    'src/app/(dashboard)/layout.tsx'
  ]
  
  let allPresent = true
  
  files.forEach(file => {
    const filePath = path.join(process.cwd(), file)
    if (fs.existsSync(filePath)) {
      console.log(`✅ ${file}`)
    } else {
      console.log(`❌ ${file} - AUSENTE`)
      allPresent = false
    }
  })
  
  return allPresent
}

// Verificar middleware
function checkMiddleware() {
  console.log('\n🛡️ Verificando middleware...')
  
  const middlewarePath = path.join(process.cwd(), 'middleware.ts')
  
  if (!fs.existsSync(middlewarePath)) {
    console.log('❌ Middleware não encontrado!')
    return false
  }
  
  const content = fs.readFileSync(middlewarePath, 'utf8')
  
  const checks = [
    { pattern: /clerkMiddleware/, name: 'clerkMiddleware importado' },
    { pattern: /createRouteMatcher/, name: 'createRouteMatcher importado' },
    { pattern: /isPublicRoute/, name: 'Rotas públicas definidas' },
    { pattern: /auth\(\)\.protect\(\)/, name: 'Proteção de rotas ativa' }
  ]
  
  let allGood = true
  
  checks.forEach(check => {
    if (check.pattern.test(content)) {
      console.log(`✅ ${check.name}`)
    } else {
      console.log(`❌ ${check.name}`)
      allGood = false
    }
  })
  
  return allGood
}

// Verificar layout do dashboard
function checkDashboardLayout() {
  console.log('\n🏠 Verificando proteção do dashboard...')
  
  const layoutPath = path.join(process.cwd(), 'src/app/(dashboard)/layout.tsx')
  
  if (!fs.existsSync(layoutPath)) {
    console.log('❌ Layout do dashboard não encontrado!')
    return false
  }
  
  const content = fs.readFileSync(layoutPath, 'utf8')
  
  const checks = [
    { pattern: /useUser/, name: 'Hook useUser importado' },
    { pattern: /isLoaded/, name: 'Verificação de carregamento' },
    { pattern: /isSignedIn/, name: 'Verificação de autenticação' },
    { pattern: /router\.push/, name: 'Redirecionamento configurado' }
  ]
  
  let allGood = true
  
  checks.forEach(check => {
    if (check.pattern.test(content)) {
      console.log(`✅ ${check.name}`)
    } else {
      console.log(`❌ ${check.name}`)
      allGood = false
    }
  })
  
  return allGood
}

// Gerar relatório
function generateReport(envOk, filesOk, middlewareOk, dashboardOk) {
  console.log('\n📊 RELATÓRIO FINAL\n')
  
  const overall = envOk && filesOk && middlewareOk && dashboardOk
  
  console.log(`Variáveis de ambiente: ${envOk ? '✅' : '❌'}`)
  console.log(`Arquivos de configuração: ${filesOk ? '✅' : '❌'}`)
  console.log(`Middleware: ${middlewareOk ? '✅' : '❌'}`)
  console.log(`Dashboard protegido: ${dashboardOk ? '✅' : '❌'}`)
  
  console.log(`\n🎯 STATUS GERAL: ${overall ? '✅ CONFIGURADO' : '❌ REQUER CORREÇÃO'}`)
  
  if (overall) {
    console.log('\n🚀 PRÓXIMOS PASSOS:')
    console.log('1. Execute: npm run dev')
    console.log('2. Acesse: http://localhost:3000')
    console.log('3. Teste o fluxo: Landing → Sign Up → Dashboard')
    console.log('4. Verifique redirecionamentos automáticos')
  } else {
    console.log('\n🔧 CORREÇÕES NECESSÁRIAS:')
    if (!envOk) console.log('- Configurar variáveis de ambiente do Clerk')
    if (!filesOk) console.log('- Criar arquivos de autenticação ausentes')
    if (!middlewareOk) console.log('- Corrigir configuração do middleware')
    if (!dashboardOk) console.log('- Implementar proteção no dashboard')
  }
  
  // Salvar relatório
  const report = {
    timestamp: new Date().toISOString(),
    status: overall ? 'CONFIGURED' : 'NEEDS_FIXES',
    checks: {
      environment: envOk,
      files: filesOk,
      middleware: middlewareOk,
      dashboard: dashboardOk
    }
  }
  
  fs.writeFileSync('clerk-auth-report.json', JSON.stringify(report, null, 2))
  console.log('\n📋 Relatório salvo em: clerk-auth-report.json')
}

// Executar testes
function main() {
  const envOk = checkEnvironmentVariables()
  const filesOk = checkConfigFiles()
  const middlewareOk = checkMiddleware()
  const dashboardOk = checkDashboardLayout()
  
  generateReport(envOk, filesOk, middlewareOk, dashboardOk)
}

// Executar se chamado diretamente
if (require.main === module) {
  main()
}

module.exports = { 
  checkEnvironmentVariables, 
  checkConfigFiles, 
  checkMiddleware, 
  checkDashboardLayout 
}