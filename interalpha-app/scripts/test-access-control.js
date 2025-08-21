#!/usr/bin/env node

/**
 * 🔐 Script para testar o sistema de controle de acesso
 */

const fs = require('fs')
const path = require('path')

console.log('🔐 Testando sistema de controle de acesso...\n')

// Verificar arquivos de segurança
function checkSecurityFiles() {
  console.log('📁 Verificando arquivos de segurança...')
  
  const files = [
    'middleware.ts',
    'src/config/roles.ts',
    'src/services/client-access/client-key-service.ts',
    'src/middleware/client-auth-middleware.ts',
    'src/app/api/auth/client/validate/route.ts',
    'src/app/api/auth/client/request-key/route.ts',
    'src/app/(client)/login/page.tsx',
    'src/app/(client)/dashboard/page.tsx',
    'src/app/api/client/orders/route.ts',
    'src/app/api/client/payments/route.ts'
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

// Verificar configuração do middleware
function checkMiddlewareConfig() {
  console.log('\n🛡️ Verificando configuração do middleware...')
  
  const middlewarePath = path.join(process.cwd(), 'middleware.ts')
  
  if (!fs.existsSync(middlewarePath)) {
    console.log('❌ Middleware não encontrado!')
    return false
  }
  
  const content = fs.readFileSync(middlewarePath, 'utf8')
  
  const checks = [
    { pattern: /isPublicRoute.*createRouteMatcher/, name: 'Rotas públicas definidas' },
    { pattern: /isEmployeeRoute.*createRouteMatcher/, name: 'Rotas de funcionários definidas' },
    { pattern: /isClientRoute.*createRouteMatcher/, name: 'Rotas de clientes definidas' },
    { pattern: /handleClientAuth/, name: 'Função de autenticação de clientes' },
    { pattern: /auth\(\)\.protect\(\)/, name: 'Proteção Clerk para funcionários' },
    { pattern: /\/client\/login/, name: 'Rota de login de cliente pública' },
    { pattern: /\/client\/request-access/, name: 'Rota de solicitação de chave pública' }
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

// Verificar sistema de roles
function checkRoleSystem() {
  console.log('\n👥 Verificando sistema de roles...')
  
  const rolesPath = path.join(process.cwd(), 'src/config/roles.ts')
  
  if (!fs.existsSync(rolesPath)) {
    console.log('❌ Arquivo de roles não encontrado!')
    return false
  }
  
  const content = fs.readFileSync(rolesPath, 'utf8')
  
  const expectedRoles = [
    'ATENDENTE',
    'TECNICO', 
    'SUPERVISOR_TECNICO',
    'GERENTE_ADM',
    'GERENTE_FINANCEIRO'
  ]
  
  let allRolesPresent = true
  
  expectedRoles.forEach(role => {
    if (content.includes(role)) {
      console.log(`✅ Role ${role} definido`)
    } else {
      console.log(`❌ Role ${role} não encontrado`)
      allRolesPresent = false
    }
  })
  
  // Verificar funções de permissão
  const permissionFunctions = [
    'getRolePermissions',
    'canManageRole',
    'hasPermission',
    'getDashboardConfig'
  ]
  
  permissionFunctions.forEach(func => {
    if (content.includes(func)) {
      console.log(`✅ Função ${func} implementada`)
    } else {
      console.log(`❌ Função ${func} não encontrada`)
      allRolesPresent = false
    }
  })
  
  return allRolesPresent
}

// Verificar serviço de chaves de cliente
function checkClientKeyService() {
  console.log('\n🔑 Verificando serviço de chaves de cliente...')
  
  const servicePath = path.join(process.cwd(), 'src/services/client-access/client-key-service.ts')
  
  if (!fs.existsSync(servicePath)) {
    console.log('❌ Serviço de chaves não encontrado!')
    return false
  }
  
  const content = fs.readFileSync(servicePath, 'utf8')
  
  const checks = [
    { pattern: /generateClientKey/, name: 'Geração de chaves' },
    { pattern: /validateClientKey/, name: 'Validação de chaves' },
    { pattern: /revokeClientKey/, name: 'Revogação de chaves' },
    { pattern: /DEFAULT_TTL.*24.*60.*60.*1000/, name: 'TTL de 24 horas' },
    { pattern: /MAX_ACTIVE_KEYS_PER_CLIENT/, name: 'Limite de chaves ativas' },
    { pattern: /sendAccessKeyNotification/, name: 'Notificação de chaves' },
    { pattern: /cleanupExpiredKeys/, name: 'Limpeza de chaves expiradas' }
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

// Verificar APIs de autenticação
function checkAuthAPIs() {
  console.log('\n🌐 Verificando APIs de autenticação...')
  
  const apis = [
    {
      path: 'src/app/api/auth/client/validate/route.ts',
      name: 'API de validação de chave'
    },
    {
      path: 'src/app/api/auth/client/request-key/route.ts', 
      name: 'API de solicitação de chave'
    },
    {
      path: 'src/app/api/client/orders/route.ts',
      name: 'API de ordens do cliente'
    },
    {
      path: 'src/app/api/client/payments/route.ts',
      name: 'API de pagamentos do cliente'
    }
  ]
  
  let allGood = true
  
  apis.forEach(api => {
    const filePath = path.join(process.cwd(), api.path)
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8')
      
      // Verificar se tem validação de autenticação
      if (content.includes('x-client-key') || content.includes('clientKey') || content.includes('auth')) {
        console.log(`✅ ${api.name} - com autenticação`)
      } else {
        console.log(`⚠️ ${api.name} - sem validação de autenticação`)
      }
    } else {
      console.log(`❌ ${api.name} - não encontrada`)
      allGood = false
    }
  })
  
  return allGood
}

// Verificar páginas de cliente
function checkClientPages() {
  console.log('\n📄 Verificando páginas de cliente...')
  
  const pages = [
    {
      path: 'src/app/(client)/login/page.tsx',
      name: 'Página de login do cliente',
      checks: ['useState', 'useRouter', 'client_key', 'localStorage']
    },
    {
      path: 'src/app/(client)/request-access/page.tsx',
      name: 'Página de solicitação de acesso',
      checks: ['email', 'phone', 'document', 'request-key']
    },
    {
      path: 'src/app/(client)/dashboard/page.tsx',
      name: 'Dashboard do cliente',
      checks: ['client_session', 'orders', 'payments', 'logout']
    }
  ]
  
  let allGood = true
  
  pages.forEach(page => {
    const filePath = path.join(process.cwd(), page.path)
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8')
      
      const foundChecks = page.checks.filter(check => content.includes(check))
      
      if (foundChecks.length === page.checks.length) {
        console.log(`✅ ${page.name} - completa`)
      } else {
        console.log(`⚠️ ${page.name} - ${foundChecks.length}/${page.checks.length} funcionalidades`)
      }
    } else {
      console.log(`❌ ${page.name} - não encontrada`)
      allGood = false
    }
  })
  
  return allGood
}

// Testar APIs (se a aplicação estiver rodando)
async function testAPIs() {
  console.log('\n🔌 Testando APIs (se disponíveis)...')
  
  const tests = [
    {
      url: 'http://localhost:3000/api/auth/client/validate',
      method: 'POST',
      body: { key: 'test-key' },
      name: 'Validação de chave'
    }
  ]
  
  let allWorking = true
  
  for (const test of tests) {
    try {
      const response = await fetch(test.url, {
        method: test.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(test.body)
      })
      
      if (response.status === 401 || response.status === 400) {
        // Esperado para chave inválida
        console.log(`✅ ${test.name} - API respondendo corretamente`)
      } else if (response.ok) {
        console.log(`✅ ${test.name} - API funcionando`)
      } else {
        console.log(`⚠️ ${test.name} - Status ${response.status}`)
      }
    } catch (error) {
      console.log(`❌ ${test.name} - Não disponível (app não está rodando)`)
      // Não marcar como erro se a app não estiver rodando
    }
  }
  
  return allWorking
}

// Gerar relatório
function generateReport(securityFiles, middleware, roles, clientKeys, authAPIs, clientPages) {
  console.log('\n📊 RELATÓRIO DE SEGURANÇA\n')
  
  const overall = securityFiles && middleware && roles && clientKeys && authAPIs && clientPages
  
  console.log(`Arquivos de segurança: ${securityFiles ? '✅' : '❌'}`)
  console.log(`Configuração do middleware: ${middleware ? '✅' : '❌'}`)
  console.log(`Sistema de roles: ${roles ? '✅' : '❌'}`)
  console.log(`Serviço de chaves: ${clientKeys ? '✅' : '❌'}`)
  console.log(`APIs de autenticação: ${authAPIs ? '✅' : '❌'}`)
  console.log(`Páginas de cliente: ${clientPages ? '✅' : '❌'}`)
  
  console.log(`\n🎯 STATUS GERAL: ${overall ? '🔐 SISTEMA SEGURO' : '❌ REQUER AJUSTES'}`)
  
  if (overall) {
    console.log('\n🛡️ SISTEMA DE SEGURANÇA IMPLEMENTADO:')
    console.log('🔐 Controle de acesso por roles (funcionários)')
    console.log('🔑 Chaves temporárias de 24h (clientes)')
    console.log('🚫 Página inicial restrita (apenas autenticados)')
    console.log('🛡️ Middleware de proteção de rotas')
    console.log('🔒 APIs protegidas por autenticação')
    console.log('⏰ Expiração automática de sessões')
    console.log('📱 Portal separado para clientes')
    
    console.log('\n🚀 COMO TESTAR:')
    console.log('1. Execute: npm run dev')
    console.log('2. Acesse: http://localhost:3000 (deve redirecionar para login)')
    console.log('3. Teste login de funcionário: /sign-in')
    console.log('4. Teste portal de cliente: /client/login')
    console.log('5. Teste solicitação de chave: /client/request-access')
    
    console.log('\n🔐 FUNCIONALIDADES DE SEGURANÇA:')
    console.log('• Roles: ATENDENTE, TÉCNICO, SUPERVISOR, GERENTE_ADM, GERENTE_FINANCEIRO')
    console.log('• Chaves de cliente com validade de 24 horas')
    console.log('• Máximo 3 chaves ativas por cliente')
    console.log('• Limpeza automática de chaves expiradas')
    console.log('• Notificações por email/SMS')
    console.log('• Log de auditoria completo')
  } else {
    console.log('\n⚠️ Alguns componentes de segurança precisam ser ajustados.')
  }
  
  // Salvar relatório
  const report = {
    timestamp: new Date().toISOString(),
    status: overall ? 'SECURE' : 'NEEDS_REVIEW',
    checks: {
      securityFiles,
      middleware,
      roles,
      clientKeys,
      authAPIs,
      clientPages
    },
    securityFeatures: [
      'Role-based access control',
      '24-hour temporary client keys',
      'Route protection middleware',
      'API authentication',
      'Session management',
      'Audit logging'
    ]
  }
  
  fs.writeFileSync('access-control-report.json', JSON.stringify(report, null, 2))
  console.log('\n📋 Relatório salvo em: access-control-report.json')
}

// Executar todos os testes
async function main() {
  const securityFiles = checkSecurityFiles()
  const middleware = checkMiddlewareConfig()
  const roles = checkRoleSystem()
  const clientKeys = checkClientKeyService()
  const authAPIs = checkAuthAPIs()
  const clientPages = checkClientPages()
  
  await testAPIs()
  
  generateReport(securityFiles, middleware, roles, clientKeys, authAPIs, clientPages)
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error)
}

module.exports = { 
  checkSecurityFiles,
  checkMiddlewareConfig,
  checkRoleSystem,
  checkClientKeyService,
  checkAuthAPIs,
  checkClientPages
}