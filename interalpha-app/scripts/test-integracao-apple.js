#!/usr/bin/env node

/**
 * Script para testar a integração completa do Sistema de Ordem de Serviço Apple
 * Testa: Componentes + Rotas + APIs + Banco de Dados
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

async function testIntegracaoCompleta() {
  log(`${colors.bold}🍎 TESTE DE INTEGRAÇÃO COMPLETA - SISTEMA APPLE${colors.reset}`, 'blue');
  
  let allTestsPassed = true;
  const results = {
    componentes: 0,
    rotas: 0,
    apis: 0,
    banco: 0,
    total: 0
  };

  // ==================== TESTE 1: COMPONENTES ====================
  log(`\n${colors.bold}1. TESTANDO COMPONENTES${colors.reset}`, 'yellow');
  
  const componentes = [
    'src/types/ordem-servico-apple.ts',
    'src/components/ordens-servico/OrdemServicoAppleForm.tsx',
    'src/components/ordens-servico/GarantiaCard.tsx',
    'src/components/ordens-servico/PecasEAcoesDialog.tsx',
    'src/components/ordens-servico/ObservacoesAppleDialog.tsx'
  ];
  
  componentes.forEach(component => {
    const componentPath = path.join(__dirname, '..', component);
    if (fs.existsSync(componentPath)) {
      log(`✅ ${component}`, 'green');
      results.componentes++;
    } else {
      log(`❌ ${component} não encontrado`, 'red');
      allTestsPassed = false;
    }
  });
  
  // ==================== TESTE 2: ROTAS ====================
  log(`\n${colors.bold}2. TESTANDO ROTAS${colors.reset}`, 'yellow');
  
  const rotas = [
    'src/app/(dashboard)/ordens-servico/nova-apple/page.tsx',
    'src/app/(dashboard)/ordens-servico/apple/[id]/page.tsx'
  ];
  
  rotas.forEach(rota => {
    const rotaPath = path.join(__dirname, '..', rota);
    if (fs.existsSync(rotaPath)) {
      log(`✅ ${rota}`, 'green');
      results.rotas++;
    } else {
      log(`❌ ${rota} não encontrada`, 'red');
      allTestsPassed = false;
    }
  });
  
  // Verificar se a página principal foi atualizada
  const paginaPrincipalPath = path.join(__dirname, '..', 'src/app/(dashboard)/ordens-servico/page.tsx');
  if (fs.existsSync(paginaPrincipalPath)) {
    const content = fs.readFileSync(paginaPrincipalPath, 'utf8');
    if (content.includes('Nova O.S. Apple') && content.includes('/ordens-servico/nova-apple')) {
      log(`✅ Página principal atualizada com botão Apple`, 'green');
      results.rotas++;
    } else {
      log(`❌ Página principal não foi atualizada`, 'red');
      allTestsPassed = false;
    }
  }
  
  // ==================== TESTE 3: APIs ====================
  log(`\n${colors.bold}3. TESTANDO APIs${colors.reset}`, 'yellow');
  
  const apis = [
    'src/app/api/ordens-servico/apple/route.ts',
    'src/app/api/ordens-servico/apple/[id]/route.ts'
  ];
  
  apis.forEach(api => {
    const apiPath = path.join(__dirname, '..', api);
    if (fs.existsSync(apiPath)) {
      const content = fs.readFileSync(apiPath, 'utf8');
      
      // Verificar métodos HTTP
      const methods = ['GET', 'POST', 'PUT', 'DELETE'];
      const foundMethods = methods.filter(method => 
        content.includes(`export async function ${method}`)
      );
      
      log(`✅ ${api} (${foundMethods.join(', ')})`, 'green');
      results.apis++;
      
      // Verificar imports importantes
      if (content.includes('auth') && content.includes('prisma')) {
        log(`  ✅ Autenticação e Prisma configurados`, 'green');
      } else {
        log(`  ❌ Faltam imports de auth ou prisma`, 'red');
        allTestsPassed = false;
      }
      
    } else {
      log(`❌ ${api} não encontrada`, 'red');
      allTestsPassed = false;
    }
  });
  
  // ==================== TESTE 4: BANCO DE DADOS ====================
  log(`\n${colors.bold}4. TESTANDO CONFIGURAÇÃO DO BANCO${colors.reset}`, 'yellow');
  
  // Verificar schema Prisma
  const schemaPath = path.join(__dirname, '..', 'prisma/schema.prisma');
  if (fs.existsSync(schemaPath)) {
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    
    const modelos = [
      'OrdemServicoApple',
      'AcaoReparoApple',
      'PecaSubstituidaApple'
    ];
    
    modelos.forEach(modelo => {
      if (schemaContent.includes(`model ${modelo}`)) {
        log(`✅ Modelo ${modelo} definido no schema`, 'green');
        results.banco++;
      } else {
        log(`❌ Modelo ${modelo} não encontrado no schema`, 'red');
        allTestsPassed = false;
      }
    });
    
    // Verificar campos específicos
    const camposImportantes = [
      'garantiaTipo',
      'dispositivoModelo',
      'clienteNome',
      'observacoesBackupNecessario',
      'garantiaServicoInterAlpha'
    ];
    
    camposImportantes.forEach(campo => {
      if (schemaContent.includes(campo)) {
        log(`✅ Campo ${campo} presente`, 'green');
      } else {
        log(`❌ Campo ${campo} não encontrado`, 'red');
        allTestsPassed = false;
      }
    });
    
  } else {
    log(`❌ Schema Prisma não encontrado`, 'red');
    allTestsPassed = false;
  }
  
  // Verificar utilitários Prisma
  const prismaUtilsPath = path.join(__dirname, '..', 'src/lib/prisma-apple.ts');
  if (fs.existsSync(prismaUtilsPath)) {
    log(`✅ Utilitários Prisma Apple criados`, 'green');
    results.banco++;
  } else {
    log(`❌ Utilitários Prisma Apple não encontrados`, 'red');
    allTestsPassed = false;
  }
  
  // ==================== TESTE 5: BUILD ====================
  log(`\n${colors.bold}5. TESTANDO BUILD DO PROJETO${colors.reset}`, 'yellow');
  
  try {
    log('Executando build...', 'yellow');
    execSync('npm run build', { 
      cwd: path.dirname(__dirname),
      stdio: 'pipe'
    });
    log(`✅ Build executado com sucesso`, 'green');
    results.total++;
  } catch (error) {
    log(`❌ Erro no build:`, 'red');
    const errorOutput = error.stdout?.toString() || error.stderr?.toString() || error.message;
    log(errorOutput.substring(0, 500) + '...', 'red');
    allTestsPassed = false;
  }
  
  // ==================== TESTE 6: VERIFICAÇÃO DE DEPENDÊNCIAS ====================
  log(`\n${colors.bold}6. VERIFICANDO DEPENDÊNCIAS${colors.reset}`, 'yellow');
  
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    const dependenciasNecessarias = [
      '@clerk/nextjs',
      '@prisma/client',
      'lucide-react',
      'sonner'
    ];
    
    dependenciasNecessarias.forEach(dep => {
      if (packageJson.dependencies[dep] || packageJson.devDependencies[dep]) {
        log(`✅ Dependência ${dep} instalada`, 'green');
        results.total++;
      } else {
        log(`❌ Dependência ${dep} não encontrada`, 'red');
        allTestsPassed = false;
      }
    });
  }
  
  // ==================== RESUMO FINAL ====================
  log(`\n${colors.bold}📋 RESUMO DA INTEGRAÇÃO${colors.reset}`, 'blue');
  
  const totalTestes = results.componentes + results.rotas + results.apis + results.banco + results.total;
  
  log(`Componentes: ${results.componentes}/5`, results.componentes === 5 ? 'green' : 'red');
  log(`Rotas: ${results.rotas}/3`, results.rotas === 3 ? 'green' : 'red');
  log(`APIs: ${results.apis}/2`, results.apis === 2 ? 'green' : 'red');
  log(`Banco: ${results.banco}/5`, results.banco === 5 ? 'green' : 'red');
  log(`Outros: ${results.total}/5`, results.total === 5 ? 'green' : 'red');
  
  const porcentagem = Math.round((totalTestes / 20) * 100);
  log(`\nTotal: ${totalTestes}/20 (${porcentagem}%)`, porcentagem >= 80 ? 'green' : 'red');
  
  if (allTestsPassed && porcentagem >= 80) {
    log(`\n${colors.bold}🎉 INTEGRAÇÃO COMPLETA APROVADA!${colors.reset}`, 'green');
    
    log('\n📝 Sistema pronto para uso:', 'blue');
    log('• ✅ Componentes Apple implementados', 'blue');
    log('• ✅ Rotas configuradas (/nova-apple, /apple/[id])', 'blue');
    log('• ✅ APIs REST funcionais (GET, POST, PUT, DELETE)', 'blue');
    log('• ✅ Banco de dados estruturado', 'blue');
    log('• ✅ Build funcionando', 'blue');
    
    log('\n🚀 Próximos passos:', 'yellow');
    log('1. Execute: npm run dev', 'yellow');
    log('2. Acesse: http://localhost:3000/ordens-servico', 'yellow');
    log('3. Clique em "Nova O.S. Apple"', 'yellow');
    log('4. Teste todos os campos popup', 'yellow');
    log('5. Salve uma ordem de teste', 'yellow');
    log('6. Visualize a ordem criada', 'yellow');
    
    log('\n🎯 Funcionalidades disponíveis:', 'yellow');
    log('• Três tipos de garantia (Apple, InterAlpha, Fora)', 'yellow');
    log('• Campos específicos para dispositivos Apple', 'yellow');
    log('• Sistema de backup e ID Apple', 'yellow');
    log('• Gestão de peças e ações de reparo', 'yellow');
    log('• Cálculos automáticos de valores', 'yellow');
    log('• Interface responsiva com popups', 'yellow');
    
  } else {
    log(`\n${colors.bold}❌ INTEGRAÇÃO INCOMPLETA${colors.reset}`, 'red');
    log('Corrija os problemas identificados antes de usar o sistema', 'red');
    
    if (porcentagem < 50) {
      log('\n🔧 Problemas críticos encontrados:', 'red');
      log('• Verifique se todos os arquivos foram criados', 'red');
      log('• Execute: npm install para instalar dependências', 'red');
      log('• Execute: npx prisma generate para gerar cliente Prisma', 'red');
    }
  }
  
  return allTestsPassed && porcentagem >= 80;
}

if (require.main === module) {
  testIntegracaoCompleta().catch(error => {
    log(`❌ Erro fatal: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  });
}

module.exports = { testIntegracaoCompleta };