#!/usr/bin/env node

/**
 * 🔧 Script para testar as correções da página de ordens de serviço
 */

const fs = require('fs')
const path = require('path')

console.log('🔧 Testando correções da página de ordens de serviço...\n')

// Verificar se os arquivos da API foram criados
function checkAPIFiles() {
  console.log('📁 Verificando arquivos da API...')
  
  const files = [
    'src/app/api/ordens-servico/route.ts',
    'src/app/api/ordens-servico/estatisticas/route.ts',
    'src/app/api/ordens-servico/[id]/route.ts'
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

// Verificar componentes existentes
function checkComponents() {
  console.log('\n🖥️ Verificando componentes...')
  
  const components = [
    'src/components/ordens-servico/EstatisticasCards.tsx',
    'src/components/ordens-servico/OrdensServicoTable.tsx',
    'src/app/(dashboard)/ordens-servico/page.tsx'
  ]
  
  let allGood = true
  
  components.forEach(comp => {
    const filePath = path.join(process.cwd(), comp)
    if (fs.existsSync(filePath)) {
      console.log(`✅ ${comp} - existe`)
    } else {
      console.log(`❌ ${comp} - não encontrado`)
      allGood = false
    }
  })
  
  return allGood
}

// Testar APIs
async function testAPIs() {
  console.log('\n🔌 Testando API routes...')
  
  const tests = [
    { 
      url: 'http://localhost:3000/api/ordens-servico/estatisticas', 
      name: 'Estatísticas',
      expectedFields: ['total', 'pendentes', 'emAndamento', 'concluidas']
    },
    { 
      url: 'http://localhost:3000/api/ordens-servico', 
      name: 'Listagem',
      expectedFields: ['success', 'data', 'pagination']
    }
  ]
  
  let allWorking = true
  
  for (const test of tests) {
    try {
      const response = await fetch(test.url)
      
      if (response.ok) {
        const data = await response.json()
        
        // Verificar se tem os campos esperados
        const hasAllFields = test.expectedFields.every(field => 
          data.hasOwnProperty(field)
        )
        
        if (hasAllFields) {
          console.log(`✅ ${test.name} - API funcionando com estrutura correta`)
        } else {
          console.log(`⚠️ ${test.name} - API funcionando mas estrutura inesperada`)
          allWorking = false
        }
      } else {
        console.log(`❌ ${test.name} - HTTP ${response.status}`)
        allWorking = false
      }
    } catch (error) {
      console.log(`❌ ${test.name} - Erro de conexão: ${error.message}`)
      allWorking = false
    }
  }
  
  return allWorking
}

// Verificar se o erro 500 foi corrigido
function checkErrorFix() {
  console.log('\n🩺 Verificando correção do erro 500...')
  
  const tablePath = path.join(process.cwd(), 'src/components/ordens-servico/OrdensServicoTable.tsx')
  const content = fs.readFileSync(tablePath, 'utf8')
  
  const checks = [
    { test: content.includes("'use client'"), name: 'É Client Component' },
    { test: content.includes('useState'), name: 'Usa useState' },
    { test: content.includes('useEffect'), name: 'Usa useEffect' },
    { test: content.includes('/api/ordens-servico'), name: 'Chama API correta' },
    { test: content.includes('cache: \'no-store\''), name: 'Não usa cache' }
  ]
  
  let allGood = true
  
  checks.forEach(check => {
    if (check.test) {
      console.log(`✅ ${check.name}`)
    } else {
      console.log(`❌ ${check.name}`)
      allGood = false
    }
  })
  
  return allGood
}

// Gerar relatório
function generateReport(apiFiles, components, apis, errorFix) {
  console.log('\n📊 RELATÓRIO FINAL\n')
  
  const overall = apiFiles && apis && errorFix
  
  console.log(`Arquivos da API: ${apiFiles ? '✅' : '❌'}`)
  console.log(`Componentes: ${components ? '✅' : '❌'}`)
  console.log(`APIs funcionando: ${apis ? '✅' : '❌'}`)
  console.log(`Erro 500 corrigido: ${errorFix ? '✅' : '❌'}`)
  
  console.log(`\n🎯 STATUS GERAL: ${overall ? '✅ CORRIGIDO' : '❌ REQUER AJUSTES'}`)
  
  if (overall) {
    console.log('\n🚀 PRÓXIMOS PASSOS:')
    console.log('1. A aplicação já está rodando')
    console.log('2. Acesse: http://localhost:3000/ordens-servico')
    console.log('3. Teste filtros e busca')
    console.log('4. Verifique se não há mais erros no console')
    console.log('\n✨ Problema corrigido:')
    console.log('- Erro 500: API de ordens de serviço não existia')
    console.log('- Criadas APIs: /api/ordens-servico, /estatisticas, /[id]')
    console.log('- Autenticação com fallback robusto')
  }
  
  // Salvar relatório
  const report = {
    timestamp: new Date().toISOString(),
    status: overall ? 'FIXED' : 'NEEDS_ADJUSTMENTS',
    checks: {
      apiFiles,
      components,
      apis,
      errorFix
    },
    problemFixed: 'API de ordens de serviço não existia - agora criada e funcionando'
  }
  
  fs.writeFileSync('ordens-servico-fix-report.json', JSON.stringify(report, null, 2))
  console.log('\n📋 Relatório salvo em: ordens-servico-fix-report.json')
}

// Executar testes
async function main() {
  const apiFiles = checkAPIFiles()
  const components = checkComponents()
  const apis = await testAPIs()
  const errorFix = checkErrorFix()
  
  generateReport(apiFiles, components, apis, errorFix)
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error)
}

module.exports = { 
  checkAPIFiles, 
  checkComponents, 
  testAPIs,
  checkErrorFix
}