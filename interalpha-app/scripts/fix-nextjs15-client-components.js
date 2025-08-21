#!/usr/bin/env node

/**
 * Script para corrigir problemas de Client Components no Next.js 15
 * 
 * Este script identifica e corrige automaticamente:
 * 1. Componentes que precisam da diretiva 'use client'
 * 2. Event handlers sendo passados incorretamente
 * 3. Problemas de Server/Client Component boundaries
 */

const fs = require('fs')
const path = require('path')

console.log('🔧 Iniciando correção de Client Components para Next.js 15...\n')

// Padrões que indicam necessidade de 'use client'
const CLIENT_COMPONENT_PATTERNS = [
  /useState|useEffect|useCallback|useMemo|useRef/,
  /onClick|onChange|onSubmit|onValueChange|onSelect/,
  /useRouter|useSearchParams|usePathname/,
  /addEventListener|removeEventListener/,
  /window\.|document\./,
  /localStorage|sessionStorage/,
  /navigator\./
]

// Componentes que sempre precisam ser Client Components
const ALWAYS_CLIENT_COMPONENTS = [
  'ProductList',
  'ProductForm', 
  'ProductSearch',
  'ProductCard',
  'ImageUpload',
  'PriceCalculator'
]

/**
 * Verifica se um arquivo precisa da diretiva 'use client'
 */
function needsUseClient(content, filename) {
  // Se já tem 'use client', não precisa
  if (content.includes("'use client'") || content.includes('"use client"')) {
    return false
  }

  // Verifica padrões que indicam Client Component
  const hasClientPatterns = CLIENT_COMPONENT_PATTERNS.some(pattern => 
    pattern.test(content)
  )

  // Verifica se é um componente que sempre deve ser Client
  const isAlwaysClient = ALWAYS_CLIENT_COMPONENTS.some(comp => 
    filename.includes(comp)
  )

  return hasClientPatterns || isAlwaysClient
}

/**
 * Adiciona 'use client' no topo do arquivo
 */
function addUseClient(content) {
  // Encontra a primeira linha que não é comentário ou import
  const lines = content.split('\n')
  let insertIndex = 0

  // Pula comentários iniciais
  while (insertIndex < lines.length && 
         (lines[insertIndex].trim().startsWith('/**') || 
          lines[insertIndex].trim().startsWith('*') ||
          lines[insertIndex].trim().startsWith('*/') ||
          lines[insertIndex].trim() === '')) {
    insertIndex++
  }

  // Insere 'use client' antes dos imports
  lines.splice(insertIndex, 0, "'use client'", '')
  
  return lines.join('\n')
}

/**
 * Processa um arquivo TypeScript/React
 */
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    const filename = path.basename(filePath)
    
    if (needsUseClient(content, filename)) {
      const newContent = addUseClient(content)
      fs.writeFileSync(filePath, newContent)
      console.log(`✅ Adicionado 'use client' em: ${filePath}`)
      return true
    }
    
    return false
  } catch (error) {
    console.error(`❌ Erro ao processar ${filePath}:`, error.message)
    return false
  }
}

/**
 * Processa recursivamente um diretório
 */
function processDirectory(dirPath) {
  let fixedFiles = 0
  
  try {
    const items = fs.readdirSync(dirPath)
    
    for (const item of items) {
      const itemPath = path.join(dirPath, item)
      const stat = fs.statSync(itemPath)
      
      if (stat.isDirectory()) {
        // Pula node_modules e .next
        if (!item.startsWith('.') && item !== 'node_modules') {
          fixedFiles += processDirectory(itemPath)
        }
      } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
        // Pula arquivos de definição de tipos
        if (!item.endsWith('.d.ts')) {
          if (processFile(itemPath)) {
            fixedFiles++
          }
        }
      }
    }
  } catch (error) {
    console.error(`❌ Erro ao processar diretório ${dirPath}:`, error.message)
  }
  
  return fixedFiles
}

/**
 * Corrige problemas específicos conhecidos
 */
function fixSpecificIssues() {
  console.log('\n🔧 Corrigindo problemas específicos...\n')
  
  // Corrigir ProductList.tsx - problema principal
  const productListPath = 'src/components/produtos/ProductList.tsx'
  if (fs.existsSync(productListPath)) {
    try {
      let content = fs.readFileSync(productListPath, 'utf8')
      
      // Garantir que tem 'use client' no topo
      if (!content.includes("'use client'")) {
        content = "'use client'\n\n" + content
      }
      
      fs.writeFileSync(productListPath, content)
      console.log(`✅ Corrigido: ${productListPath}`)
    } catch (error) {
      console.error(`❌ Erro ao corrigir ProductList:`, error.message)
    }
  }
  
  // Corrigir outros componentes críticos
  const criticalComponents = [
    'src/components/produtos/ProductForm.tsx',
    'src/components/produtos/ProductSearch.tsx', 
    'src/components/produtos/ProductCard.tsx',
    'src/components/ui/select.tsx'
  ]
  
  criticalComponents.forEach(componentPath => {
    if (fs.existsSync(componentPath)) {
      try {
        let content = fs.readFileSync(componentPath, 'utf8')
        
        if (needsUseClient(content, componentPath)) {
          if (!content.includes("'use client'")) {
            content = "'use client'\n\n" + content
            fs.writeFileSync(componentPath, content)
            console.log(`✅ Corrigido: ${componentPath}`)
          }
        }
      } catch (error) {
        console.error(`❌ Erro ao corrigir ${componentPath}:`, error.message)
      }
    }
  })
}

/**
 * Função principal
 */
function main() {
  const srcPath = path.join(process.cwd(), 'src')
  
  if (!fs.existsSync(srcPath)) {
    console.error('❌ Diretório src/ não encontrado!')
    process.exit(1)
  }
  
  console.log('📁 Processando diretório src/...\n')
  
  // Processar todos os arquivos
  const fixedFiles = processDirectory(srcPath)
  
  // Corrigir problemas específicos
  fixSpecificIssues()
  
  console.log(`\n🎉 Correção concluída!`)
  console.log(`📊 Arquivos corrigidos: ${fixedFiles}`)
  console.log(`\n💡 Próximos passos:`)
  console.log(`   1. Execute: npm run dev`)
  console.log(`   2. Teste a aplicação`)
  console.log(`   3. Verifique se o erro foi resolvido`)
  
  // Criar relatório
  const report = {
    timestamp: new Date().toISOString(),
    fixedFiles,
    nextSteps: [
      'Executar npm run dev',
      'Testar navegação de produtos',
      'Verificar se Select components funcionam',
      'Confirmar que não há mais erros de Client Component'
    ]
  }
  
  fs.writeFileSync('client-components-fix-report.json', JSON.stringify(report, null, 2))
  console.log(`\n📋 Relatório salvo em: client-components-fix-report.json`)
}

// Executar script
if (require.main === module) {
  main()
}

module.exports = { processFile, processDirectory, needsUseClient, addUseClient }