#!/usr/bin/env node

/**
 * 🎨 Script para testar o novo design inspirado no 21st.dev
 */

const fs = require('fs')
const path = require('path')

console.log('🎨 Testando novo design inspirado no 21st.dev...\n')

// Verificar se os arquivos foram atualizados
function checkUpdatedFiles() {
  console.log('📁 Verificando arquivos atualizados...')
  
  const files = [
    'src/app/page.tsx',
    'src/app/(dashboard)/layout.tsx',
    'src/components/layout/Header.tsx',
    'src/components/layout/Sidebar.tsx',
    'src/app/(dashboard)/dashboard/page.tsx'
  ]
  
  let allUpdated = true
  
  files.forEach(file => {
    const filePath = path.join(process.cwd(), file)
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8')
      
      // Verificar se contém elementos do novo design
      const hasModernElements = 
        content.includes('gradient-to-') ||
        content.includes('backdrop-blur') ||
        content.includes('shadow-2xl') ||
        content.includes('rounded-xl') ||
        content.includes('bg-clip-text')
      
      if (hasModernElements) {
        console.log(`✅ ${file} - atualizado com novo design`)
      } else {
        console.log(`❌ ${file} - ainda com design antigo`)
        allUpdated = false
      }
    } else {
      console.log(`❌ ${file} - não encontrado`)
      allUpdated = false
    }
  })
  
  return allUpdated
}

// Verificar elementos específicos do design moderno
function checkDesignElements() {
  console.log('\n🎨 Verificando elementos do design moderno...')
  
  const checks = [
    {
      file: 'src/app/page.tsx',
      elements: [
        'backdrop-blur-xl',
        'bg-gradient-to-r from-blue-600 to-purple-600',
        'shadow-2xl',
        'rounded-3xl'
      ],
      name: 'Hero Section'
    },
    {
      file: 'src/components/layout/Header.tsx',
      elements: [
        'sticky top-0',
        'backdrop-blur-xl',
        'bg-gradient-to-br from-blue-600 to-purple-600'
      ],
      name: 'Header'
    },
    {
      file: 'src/components/layout/Sidebar.tsx',
      elements: [
        'bg-gradient-to-br',
        'rounded-xl',
        'group-hover:scale-110'
      ],
      name: 'Sidebar'
    },
    {
      file: 'src/app/(dashboard)/dashboard/page.tsx',
      elements: [
        'bg-gradient-to-br from-white',
        'group-hover:opacity-100',
        'shadow-lg hover:shadow-2xl'
      ],
      name: 'Dashboard'
    }
  ]
  
  let allGood = true
  
  checks.forEach(check => {
    const filePath = path.join(process.cwd(), check.file)
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8')
      
      const foundElements = check.elements.filter(element => 
        content.includes(element)
      )
      
      if (foundElements.length === check.elements.length) {
        console.log(`✅ ${check.name} - todos os elementos modernos presentes`)
      } else {
        console.log(`⚠️ ${check.name} - ${foundElements.length}/${check.elements.length} elementos encontrados`)
        allGood = false
      }
    }
  })
  
  return allGood
}

// Verificar se a aplicação está rodando
async function checkAppRunning() {
  console.log('\n🚀 Verificando se a aplicação está rodando...')
  
  try {
    const response = await fetch('http://localhost:3000')
    if (response.ok) {
      console.log('✅ Aplicação rodando em http://localhost:3000')
      return true
    } else {
      console.log(`❌ Aplicação respondeu com status ${response.status}`)
      return false
    }
  } catch (error) {
    console.log('❌ Aplicação não está rodando')
    console.log('   Execute: npm run dev')
    return false
  }
}

// Gerar relatório do novo design
function generateDesignReport(filesUpdated, elementsGood, appRunning) {
  console.log('\n📊 RELATÓRIO DO NOVO DESIGN\n')
  
  const overall = filesUpdated && elementsGood
  
  console.log(`Arquivos atualizados: ${filesUpdated ? '✅' : '❌'}`)
  console.log(`Elementos modernos: ${elementsGood ? '✅' : '❌'}`)
  console.log(`Aplicação rodando: ${appRunning ? '✅' : '❌'}`)
  
  console.log(`\n🎯 STATUS GERAL: ${overall ? '🎨 DESIGN MODERNO APLICADO' : '❌ REQUER AJUSTES'}`)
  
  if (overall) {
    console.log('\n✨ NOVO DESIGN INSPIRADO NO 21ST.DEV:')
    console.log('🎨 Hero Section com gradientes e backdrop blur')
    console.log('🎨 Header sticky com elementos glassmorphism')
    console.log('🎨 Sidebar com animações e hover effects')
    console.log('🎨 Dashboard com cards modernos e shadows')
    console.log('🎨 Tipografia com gradient text')
    console.log('🎨 Micro-interações e transições suaves')
    
    console.log('\n🚀 PRÓXIMOS PASSOS:')
    if (appRunning) {
      console.log('1. ✅ Aplicação já está rodando')
      console.log('2. 🌐 Acesse: http://localhost:3000')
      console.log('3. 🎨 Teste o novo design da hero section')
      console.log('4. 🔐 Faça login para ver o dashboard moderno')
      console.log('5. 📱 Teste responsividade em diferentes telas')
    } else {
      console.log('1. Execute: npm run dev')
      console.log('2. Acesse: http://localhost:3000')
      console.log('3. Teste o novo design')
    }
    
    console.log('\n🎨 CARACTERÍSTICAS DO NOVO DESIGN:')
    console.log('• Gradientes sutis e modernos')
    console.log('• Glassmorphism e backdrop blur')
    console.log('• Shadows e depth layers')
    console.log('• Micro-animações e hover effects')
    console.log('• Tipografia com gradient text')
    console.log('• Cards com bordas arredondadas')
    console.log('• Paleta de cores inspirada no 21st.dev')
  } else {
    console.log('\n⚠️ Alguns elementos ainda precisam ser ajustados.')
  }
  
  // Salvar relatório
  const report = {
    timestamp: new Date().toISOString(),
    status: overall ? 'MODERN_DESIGN_APPLIED' : 'NEEDS_ADJUSTMENTS',
    inspiration: '21st.dev',
    checks: {
      filesUpdated,
      elementsGood,
      appRunning
    },
    designFeatures: [
      'Gradients and glassmorphism',
      'Backdrop blur effects',
      'Modern shadows and depth',
      'Micro-interactions',
      'Gradient typography',
      'Rounded corners and modern spacing'
    ]
  }
  
  fs.writeFileSync('design-update-report.json', JSON.stringify(report, null, 2))
  console.log('\n📋 Relatório salvo em: design-update-report.json')
}

// Executar todos os testes
async function main() {
  const filesUpdated = checkUpdatedFiles()
  const elementsGood = checkDesignElements()
  const appRunning = await checkAppRunning()
  
  generateDesignReport(filesUpdated, elementsGood, appRunning)
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error)
}

module.exports = { 
  checkUpdatedFiles,
  checkDesignElements,
  checkAppRunning
}