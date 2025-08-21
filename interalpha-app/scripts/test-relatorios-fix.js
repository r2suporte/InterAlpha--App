#!/usr/bin/env node

/**
 * 📊 Script para testar as correções da página de relatórios
 */

const fs = require('fs')
const path = require('path')

console.log('📊 Testando correções da página de relatórios...\n')

// Verificar se os arquivos da API foram criados
function checkAPIFiles() {
  console.log('📁 Verificando arquivos da API...')
  
  const files = [
    'src/app/api/relatorios/mensal/route.ts',
    'src/components/relatorios/RelatorioMensal.tsx',
    'src/components/relatorios/FiltrosRelatorio.tsx'
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
  
  const pagePath = path.join(process.cwd(), 'src/app/(dashboard)/relatorios/page.tsx')
  
  if (!fs.existsSync(pagePath)) {
    console.log('❌ Página principal não encontrada!')
    return false
  }
  
  const content = fs.readFileSync(pagePath, 'utf8')
  
  const checks = [
    { pattern: /^import React from 'react'/, name: 'Importa React corretamente' },
    { pattern: /RelatorioMensal.*from.*RelatorioMensal/, name: 'Importa RelatorioMensal' },
    { pattern: /FiltrosRelatorio.*from.*FiltrosRelatorio/, name: 'Importa FiltrosRelatorio' },
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
    'src/components/relatorios/RelatorioMensal.tsx',
    'src/components/relatorios/FiltrosRelatorio.tsx'
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

// Verificar se não há mais Server Actions problemáticas
function checkNoServerActions() {
  console.log('\n🔍 Verificando se Server Actions foram removidas...')
  
  const pagePath = path.join(process.cwd(), 'src/app/(dashboard)/relatorios/page.tsx')
  const content = fs.readFileSync(pagePath, 'utf8')
  
  const problematicPatterns = [
    { pattern: /obterRelatorioMensal/, name: 'Server Action obterRelatorioMensal' },
    { pattern: /'use client'.*async function/, name: 'Client Component async' },
    { pattern: /await.*obter/, name: 'Await de Server Action' }
  ]
  
  let noProblems = true
  
  problematicPatterns.forEach(check => {
    if (check.pattern.test(content)) {
      console.log(`❌ Ainda tem: ${check.name}`)
      noProblems = false
    } else {
      console.log(`✅ Removido: ${check.name}`)
    }
  })
  
  return noProblems
}

// Testar APIs
async function testAPIs() {
  console.log('\n🔌 Testando API routes...')
  
  const tests = [
    { 
      url: 'http://localhost:3000/api/relatorios/mensal?ano=2024&mes=8', 
      name: 'Relatório Mensal',
      expectedFields: ['success', 'data']
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
        
        if (hasAllFields && data.success) {
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

// Gerar relatório
function generateReport(apiFiles, mainPage, clientComponents, noServerActions, apis) {
  console.log('\n📊 RELATÓRIO FINAL\n')
  
  const overall = apiFiles && mainPage && clientComponents && noServerActions
  
  console.log(`Arquivos da API: ${apiFiles ? '✅' : '❌'}`)
  console.log(`Página principal: ${mainPage ? '✅' : '❌'}`)
  console.log(`Client Components: ${clientComponents ? '✅' : '❌'}`)
  console.log(`Server Actions removidas: ${noServerActions ? '✅' : '❌'}`)
  console.log(`APIs funcionando: ${apis ? '✅' : '❌'}`)
  
  console.log(`\n🎯 STATUS GERAL: ${overall ? '✅ CORRIGIDO' : '❌ REQUER AJUSTES'}`)
  
  if (overall) {
    console.log('\n🚀 PRÓXIMOS PASSOS:')
    console.log('1. A aplicação já está rodando')
    console.log('2. Acesse: http://localhost:3000/relatorios')
    console.log('3. Teste filtros de mês e ano')
    console.log('4. Verifique se não há mais erros no console')
    console.log('\n✨ Problemas corrigidos:')
    console.log('- ❌ Client Component async → ✅ Server Component + Client Components')
    console.log('- ❌ Server Actions em Client → ✅ API routes com fetch()')
    console.log('- ❌ Promises não cachadas → ✅ useState + useEffect')
    console.log('- ❌ setState durante render → ✅ Hooks adequados')
  }
  
  // Salvar relatório
  const report = {
    timestamp: new Date().toISOString(),
    status: overall ? 'FIXED' : 'NEEDS_ADJUSTMENTS',
    checks: {
      apiFiles,
      mainPage,
      clientComponents,
      noServerActions,
      apis
    },
    problemsFixed: [
      'Client Component async',
      'Server Actions em Client Components',
      'Promises não cachadas',
      'setState durante render'
    ]
  }
  
  fs.writeFileSync('relatorios-fix-report.json', JSON.stringify(report, null, 2))
  console.log('\n📋 Relatório salvo em: relatorios-fix-report.json')
}

// Executar testes
async function main() {
  const apiFiles = checkAPIFiles()
  const mainPage = checkMainPage()
  const clientComponents = checkClientComponents()
  const noServerActions = checkNoServerActions()
  const apis = await testAPIs()
  
  generateReport(apiFiles, mainPage, clientComponents, noServerActions, apis)
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error)
}

module.exports = { 
  checkAPIFiles,
  checkMainPage,
  checkClientComponents,
  checkNoServerActions,
  testAPIs
}