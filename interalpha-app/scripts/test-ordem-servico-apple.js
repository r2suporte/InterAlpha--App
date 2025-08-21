#!/usr/bin/env node

/**
 * Script para testar os componentes de Ordem de Serviço Apple
 */

const fs = require('fs');
const path = require('path');

// Cores para output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function testOrdemServicoApple() {
  log(`${colors.bold}🍎 Testando Sistema de Ordem de Serviço Apple${colors.reset}`, 'blue');
  
  let allTestsPassed = true;
  
  // 1. Verificar tipos TypeScript
  log('\n1. Verificando tipos TypeScript...', 'yellow');
  
  const typesPath = path.join(__dirname, '..', 'src', 'types', 'ordem-servico-apple.ts');
  if (fs.existsSync(typesPath)) {
    const typesContent = fs.readFileSync(typesPath, 'utf8');
    
    const requiredTypes = [
      'ClienteInfo',
      'DispositivoApple',
      'ProblemaRelatado',
      'AcaoReparo',
      'PecaSubstituida',
      'MaoDeObra',
      'GarantiaServico',
      'ObservacoesEspeciais',
      'OrdemServicoApple'
    ];
    
    requiredTypes.forEach(type => {
      if (typesContent.includes(`interface ${type}`)) {
        log(`✅ Tipo ${type} definido`, 'green');
      } else {
        log(`❌ Tipo ${type} não encontrado`, 'red');
        allTestsPassed = false;
      }
    });
    
    // Verificar tipos de garantia específicos
    const garantiaTypes = ['Garantia Apple', 'Garantia InterAlpha', 'Fora de Garantia'];
    garantiaTypes.forEach(tipo => {
      if (typesContent.includes(`'${tipo}'`)) {
        log(`✅ Tipo de garantia: ${tipo}`, 'green');
      } else {
        log(`❌ Tipo de garantia não encontrado: ${tipo}`, 'red');
        allTestsPassed = false;
      }
    });
    
  } else {
    log('❌ Arquivo de tipos não encontrado', 'red');
    allTestsPassed = false;
  }
  
  // 2. Verificar componentes principais
  log('\n2. Verificando componentes principais...', 'yellow');
  
  const components = [
    'OrdemServicoAppleForm.tsx',
    'GarantiaCard.tsx',
    'PecasEAcoesDialog.tsx',
    'ObservacoesAppleDialog.tsx'
  ];
  
  components.forEach(component => {
    const componentPath = path.join(__dirname, '..', 'src', 'components', 'ordens-servico', component);
    if (fs.existsSync(componentPath)) {
      log(`✅ Componente ${component} criado`, 'green');
      
      // Verificar imports básicos
      const content = fs.readFileSync(componentPath, 'utf8');
      if (content.includes("'use client'")) {
        log(`  ✅ Client component configurado`, 'green');
      } else {
        log(`  ❌ Client component não configurado`, 'red');
        allTestsPassed = false;
      }
      
    } else {
      log(`❌ Componente ${component} não encontrado`, 'red');
      allTestsPassed = false;
    }
  });
  
  // 3. Verificar funcionalidades específicas
  log('\n3. Verificando funcionalidades específicas...', 'yellow');
  
  const formPath = path.join(__dirname, '..', 'src', 'components', 'ordens-servico', 'OrdemServicoAppleForm.tsx');
  if (fs.existsSync(formPath)) {
    const formContent = fs.readFileSync(formPath, 'utf8');
    
    const features = [
      { name: 'Seleção de modelos Apple', pattern: 'iPhone 15 Pro Max' },
      { name: 'Campos de dispositivo', pattern: 'numeroSerie' },
      { name: 'Estados físicos', pattern: 'estadoFisico' },
      { name: 'Acessórios', pattern: 'acessorios' },
      { name: 'Tipos de garantia', pattern: 'Garantia Apple' },
      { name: 'Garantia InterAlpha', pattern: 'Garantia InterAlpha' },
      { name: 'Fora de Garantia', pattern: 'Fora de Garantia' },
      { name: 'Campos específicos Apple', pattern: 'dataCompraDispositivo' },
      { name: 'Serviço InterAlpha', pattern: 'servicoInterAlpha' },
      { name: 'Dialog de cliente', pattern: 'ClienteDialog' },
      { name: 'Dialog de dispositivo', pattern: 'DispositivoDialog' },
      { name: 'Dialog de garantia', pattern: 'GarantiaDialog' }
    ];
    
    features.forEach(feature => {
      if (formContent.includes(feature.pattern)) {
        log(`✅ ${feature.name}`, 'green');
      } else {
        log(`❌ ${feature.name} não encontrado`, 'red');
        allTestsPassed = false;
      }
    });
  }
  
  // 4. Verificar componente de garantia
  log('\n4. Verificando componente de garantia...', 'yellow');
  
  const garantiaPath = path.join(__dirname, '..', 'src', 'components', 'ordens-servico', 'GarantiaCard.tsx');
  if (fs.existsSync(garantiaPath)) {
    const garantiaContent = fs.readFileSync(garantiaPath, 'utf8');
    
    const garantiaFeatures = [
      'getGarantiaIcon',
      'getGarantiaColor',
      'isGarantiaAtiva',
      'diasRestantes',
      'Apple className',
      'Building className',
      'AlertTriangle className'
    ];
    
    garantiaFeatures.forEach(feature => {
      if (garantiaContent.includes(feature)) {
        log(`✅ Funcionalidade: ${feature}`, 'green');
      } else {
        log(`❌ Funcionalidade não encontrada: ${feature}`, 'red');
        allTestsPassed = false;
      }
    });
  }
  
  // 5. Verificar componente de peças e ações
  log('\n5. Verificando componente de peças e ações...', 'yellow');
  
  const pecasPath = path.join(__dirname, '..', 'src', 'components', 'ordens-servico', 'PecasEAcoesDialog.tsx');
  if (fs.existsSync(pecasPath)) {
    const pecasContent = fs.readFileSync(pecasPath, 'utf8');
    
    const pecasFeatures = [
      'AcoesDialog',
      'PecasDialog',
      'adicionarAcao',
      'adicionarPeca',
      'removerAcao',
      'removerPeca',
      'valorTotalPecas',
      'tempoTotalAcoes'
    ];
    
    pecasFeatures.forEach(feature => {
      if (pecasContent.includes(feature)) {
        log(`✅ Funcionalidade: ${feature}`, 'green');
      } else {
        log(`❌ Funcionalidade não encontrada: ${feature}`, 'red');
        allTestsPassed = false;
      }
    });
  }
  
  // 6. Verificar componente de observações
  log('\n6. Verificando componente de observações...', 'yellow');
  
  const obsPath = path.join(__dirname, '..', 'src', 'components', 'ordens-servico', 'ObservacoesAppleDialog.tsx');
  if (fs.existsSync(obsPath)) {
    const obsContent = fs.readFileSync(obsPath, 'utf8');
    
    const obsFeatures = [
      'backupNecessario',
      'senhaIdApple',
      'dadosImportantes',
      'restricoes',
      'recomendacoes',
      'adicionarDadoImportante',
      'adicionarRestricao',
      'adicionarRecomendacao'
    ];
    
    obsFeatures.forEach(feature => {
      if (obsContent.includes(feature)) {
        log(`✅ Funcionalidade: ${feature}`, 'green');
      } else {
        log(`❌ Funcionalidade não encontrada: ${feature}`, 'red');
        allTestsPassed = false;
      }
    });
  }
  
  // Resultado final
  log(`\n${colors.bold}📋 RESULTADO DO TESTE${colors.reset}`, 'blue');
  
  if (allTestsPassed) {
    log('✅ Todos os testes passaram!', 'green');
    
    log('\n📝 Sistema de Ordem de Serviço Apple implementado com:', 'blue');
    log('• 🍎 Tipos específicos para dispositivos Apple', 'blue');
    log('• 👤 Informações completas do cliente', 'blue');
    log('• 📱 Dados detalhados do dispositivo (modelo, série, capacidade)', 'blue');
    log('• 🛡️ Três tipos de garantia: Apple, InterAlpha, Fora de Garantia', 'blue');
    log('• 🔧 Sistema de ações de reparo com tempo e resultado', 'blue');
    log('• 📦 Gestão de peças substituídas com preços', 'blue');
    log('• 💰 Cálculo automático de valores', 'blue');
    log('• 📝 Observações especiais com backup e ID Apple', 'blue');
    log('• 🎨 Interface com popups e campos organizados', 'blue');
    
    log('\n🎯 Funcionalidades principais:', 'yellow');
    log('• Campos popup para organização', 'yellow');
    log('• Seleção de modelos Apple atualizados', 'yellow');
    log('• Gestão de garantia específica por tipo', 'yellow');
    log('• Sistema de backup e senha ID Apple', 'yellow');
    log('• Controle de peças e ações detalhado', 'yellow');
    log('• Cálculos automáticos de valores', 'yellow');
    
    log('\n🚀 Para usar:', 'yellow');
    log('1. Importe os componentes nas páginas de O.S.', 'yellow');
    log('2. Configure as rotas para nova O.S. Apple', 'yellow');
    log('3. Integre com o banco de dados', 'yellow');
    log('4. Teste a interface completa', 'yellow');
    
  } else {
    log('❌ Alguns testes falharam', 'red');
    log('Verifique os problemas acima antes de usar o sistema', 'red');
  }
  
  return allTestsPassed;
}

if (require.main === module) {
  testOrdemServicoApple();
}

module.exports = { testOrdemServicoApple };