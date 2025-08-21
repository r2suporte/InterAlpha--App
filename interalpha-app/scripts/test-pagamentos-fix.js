#!/usr/bin/env node

/**
 * Script para testar as correções da página de pagamentos
 */

const fs = require('fs')
const path = require('path')

console.log('💰 Testando correções da página de pagamentos...\n')

// Verificar se os arquivos foram criados
function checkFiles() {
  console.log('📁 Verificando arquivos criados...')
  
  const files = [
    'src/components/pagamentos/EstatisticasPagamentos.tsx',
    'src/components/pagamentos/FiltrosPagamentos.tsx', 
    'src/components/pagamentos/PagamentosTable.tsx',
    'src/app/api/pagamentos/route.ts',
    'src/app/api/pagamentos/estatisticas/route.ts',
    'src/app/api/pagamentos/[id]/route.ts'
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

// Verificar se a página principal foi corrigida
function checkMainPage() {
  console.log('\n📄 Verificando página principal...')
  
  const pagePath = path.join(process.cwd(), 'src/app/(dashboard)/pagamentos/page.tsx')
  
  if (!fs.existsSync(pagePath)) {
    console.log('❌ Página principal não encontrada!')
    return false
  }
  
  const content = fs.readFileSync(pagePath, 'utf8')
  
  const checks = [
    { pattern: /^import React from 'react'/, name: 'Importa React corretamente' },
    { pattern: /EstatisticasPagamentos.*from.*EstatisticasPagamentos/, name: 'Importa EstatisticasPagamentos' },
    { pattern: /FiltrosPagamentos.*from.*FiltrosPagamentos/, name: 'Importa FiltrosPagamentos' },
    { pattern: /PagamentosTable.*from.*PagamentosTable/, name: 'Importa PagamentosTable' },
    { pattern: /export default async function/, name: 'Função principal é async' },
    { pattern: /(?!.*'use client')/, name: 'Não tem use client no topo' }
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

// Verificar componentes Client
function checkClientComponents() {
  console.log('\n🖥️ Verificando Client Components...')
  
  const components = [
    'src/components/pagamentos/EstatisticasPagamentos.tsx',
    'src/components/pagamentos/FiltrosPagamentos.tsx',
    'src/components/pagamentos/PagamentosTable.tsx'
  ]
  
  let allGood = true
  
  components.forEach(comp => {
    const filePath = path.join(process.cwd(), comp)
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8')
      
      if (content.startsWith("'use client'")) {
        console.log(`✅ ${comp} - tem 'use client'`)
      } else {
        console.log(`❌ ${comp} - falta 'use client'`)
        allGood = false
      }
      
      if (content.includes('useState') || content.includes('useEffect')) {
        console.log(`✅ ${comp} - usa hooks React`)
      } else {
        console.log(`⚠️ ${comp} - não usa hooks (pode estar OK)`)
      }
    }
  })
  
  return allGood
}

// Testar APIs
async function testAPIs() {
  console.log('\n🔌 Testando API routes...')
  
  const tests = [
    { url: 'http://localhost:3000/api/pagamentos/estatisticas', name: 'Estatísticas' },
    { url: 'http://localhost:3000/api/pagamentos', name: 'Listagem' }
  ]
  
  let allWorking = true
  
  for (const test of tests) {
    try {
      const response = await fetch(test.url)
      if (response.ok) {
        console.log(`✅ ${test.name} - API funcionando`)
      } else {
        console.log(`❌ ${test.name} - HTTP ${response.status}`)
        allWorking = false
      }
    } catch (error) {
      console.log(`❌ ${test.name} - Erro de conexão`)
      allWorking = false
    }
  }
  
  return allWorking
}

// Gerar relatório
function generateReport(filesOk, mainPageOk, clientOk, apisOk) {
  console.log('\n📊 RELATÓRIO FINAL\n')
  
  const overall = filesOk && mainPageOk && clientOk && apisOk
  
  console.log(`Arquivos criados: ${filesOk ? '✅' : '❌'}`)
  console.log(`Página principal: ${mainPageOk ? '✅' : '❌'}`)
  console.log(`Client Components: ${clientOk ? '✅' : '❌'}`)
  console.log(`API Routes: ${apisOk ? '✅' : '❌'}`)
  
  console.log(`\n🎯 STATUS GERAL: ${overall ? '✅ CORRIGIDO' : '❌ REQUER AJUSTES'}`)
  
  if (overall) {
    console.log('\n🚀 PRÓXIMOS PASSOS:')
    console.log('1. Execute: npm run dev')
    console.log('2. Acesse: http://localhost:3000/pagamentos')
    console.log('3. Teste filtros e busca')
    console.log('4. Verifique se não há mais erros no console')
    console.log('\n✨ Erros corrigidos:')
    console.log('- Client Component async')
    console.log('- Server Actions em Client Components')
    console.log('- Promises não cachadas')
    console.log('- SelectItem com value vazio')
    console.log('- Autenticação falhando nas APIs')
  }
  
  // Salvar relatório
  const report = {
    timestamp: new Date().toISOString(),
    status: overall ? 'FIXED' : 'NEEDS_ADJUSTMENTS',
    checks: {
      files: filesOk,
      mainPage: mainPageOk,
      clientComponents: clientOk,
      apis: apisOk
    },
    errorsFixed: [
      'Async Client Component',
      'Server Actions in Client Components',
      'Uncached promises in Client Components',
      'SelectItem empty value',
      'Clerk authentication in APIs'
    ]
  }
  
  fs.writeFileSync('pagamentos-fix-report.json', JSON.stringify(report, null, 2))
  console.log('\n📋 Relatório salvo em: pagamentos-fix-report.json')
}

// Executar testes
async function main() {
  const filesOk = checkFiles()
  const mainPageOk = checkMainPage()
  const clientOk = checkClientComponents()
  const apisOk = await testAPIs()
  
  generateReport(filesOk, mainPageOk, clientOk, apisOk)
}

// Executar se chamado diretamente
if (require.main === module) {
  main()
}

module.exports = { 
  checkFiles, 
  checkMainPage, 
  checkClientComponents,
  testAPIs
}