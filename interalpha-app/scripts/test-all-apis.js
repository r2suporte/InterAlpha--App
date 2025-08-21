#!/usr/bin/env node

/**
 * Script para testar todas as APIs do sistema InterAlpha
 * Executa testes em todas as rotas disponíveis
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configurações
const BASE_URL = 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api`;

// Cores para output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

// Resultados dos testes
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: []
};

// Função para fazer requisições HTTP
async function makeRequest(url, method = 'GET', body = null, headers = {}) {
  try {
    const fetch = (await import('node-fetch')).default;
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const data = await response.text();
    
    let jsonData;
    try {
      jsonData = JSON.parse(data);
    } catch {
      jsonData = data;
    }

    return {
      status: response.status,
      data: jsonData,
      headers: response.headers
    };
  } catch (error) {
    return {
      status: 0,
      error: error.message,
      data: null
    };
  }
}

// Função para log colorido
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Função para testar uma rota
async function testRoute(route, method = 'GET', expectedStatus = 200, body = null, description = '') {
  testResults.total++;
  
  const url = `${API_BASE}${route}`;
  log(`\n${colors.blue}Testing ${method} ${route}${colors.reset}`, 'blue');
  if (description) log(`  Description: ${description}`, 'yellow');
  
  const result = await makeRequest(url, method, body);
  
  if (result.status === expectedStatus) {
    log(`  ✅ PASS - Status: ${result.status}`, 'green');
    testResults.passed++;
    return true;
  } else {
    log(`  ❌ FAIL - Expected: ${expectedStatus}, Got: ${result.status}`, 'red');
    if (result.error) log(`  Error: ${result.error}`, 'red');
    if (result.data) log(`  Response: ${JSON.stringify(result.data).substring(0, 200)}...`, 'red');
    
    testResults.failed++;
    testResults.errors.push({
      route,
      method,
      expected: expectedStatus,
      actual: result.status,
      error: result.error,
      response: result.data
    });
    return false;
  }
}

// Função principal de teste
async function runAllTests() {
  log(`${colors.bold}🚀 Iniciando testes de todas as APIs do InterAlpha${colors.reset}`, 'blue');
  log(`Base URL: ${BASE_URL}`, 'yellow');
  
  // Verificar se o servidor está rodando
  try {
    const healthCheck = await makeRequest(`${BASE_URL}/api/system/health`);
    if (healthCheck.status !== 200) {
      log('❌ Servidor não está respondendo. Certifique-se de que está rodando na porta 3000', 'red');
      process.exit(1);
    }
    log('✅ Servidor está online', 'green');
  } catch (error) {
    log('❌ Erro ao conectar com o servidor. Certifique-se de que está rodando na porta 3000', 'red');
    process.exit(1);
  }

  // ==================== TESTES DE SISTEMA ====================
  log(`\n${colors.bold}=== TESTES DE SISTEMA ===${colors.reset}`, 'bold');
  
  await testRoute('/system/health', 'GET', 200, null, 'Health check do sistema');
  await testRoute('/system/monitoring', 'GET', 200, null, 'Monitoramento do sistema');

  // ==================== TESTES DE AUTENTICAÇÃO ====================
  log(`\n${colors.bold}=== TESTES DE AUTENTICAÇÃO ===${colors.reset}`, 'bold');
  
  await testRoute('/auth/me', 'GET', 401, null, 'Verificar usuário atual (sem auth)');
  await testRoute('/auth/client/validate', 'POST', 400, {}, 'Validar cliente (dados inválidos)');
  await testRoute('/auth/client/request-key', 'POST', 400, {}, 'Solicitar chave de acesso (dados inválidos)');

  // ==================== TESTES DE FUNCIONÁRIOS ====================
  log(`\n${colors.bold}=== TESTES DE FUNCIONÁRIOS ===${colors.reset}`, 'bold');
  
  await testRoute('/admin/funcionarios', 'GET', 401, null, 'Listar funcionários (sem auth)');
  await testRoute('/admin/funcionarios/stats', 'GET', 401, null, 'Estatísticas de funcionários (sem auth)');
  await testRoute('/admin/funcionarios', 'POST', 401, {
    name: 'Teste',
    email: 'teste@teste.com',
    role: 'TECNICO'
  }, 'Criar funcionário (sem auth)');

  // ==================== TESTES DE CLIENTES ====================
  log(`\n${colors.bold}=== TESTES DE CLIENTES ===${colors.reset}`, 'bold');
  
  await testRoute('/clientes', 'GET', 401, null, 'Listar clientes (sem auth)');
  await testRoute('/clientes/estatisticas', 'GET', 401, null, 'Estatísticas de clientes (sem auth)');
  await testRoute('/clientes', 'POST', 401, {
    nome: 'Cliente Teste',
    email: 'cliente@teste.com',
    documento: '12345678901',
    tipoDocumento: 'CPF'
  }, 'Criar cliente (sem auth)');

  // ==================== TESTES DE PRODUTOS ====================
  log(`\n${colors.bold}=== TESTES DE PRODUTOS ===${colors.reset}`, 'bold');
  
  await testRoute('/produtos', 'GET', 401, null, 'Listar produtos (sem auth)');
  await testRoute('/produtos/stats', 'GET', 401, null, 'Estatísticas de produtos (sem auth)');
  await testRoute('/produtos/categorias', 'GET', 401, null, 'Listar categorias (sem auth)');
  await testRoute('/produtos/estoque', 'GET', 401, null, 'Consultar estoque (sem auth)');
  await testRoute('/produtos/validate', 'POST', 400, {}, 'Validar produto (dados inválidos)');
  await testRoute('/produtos/suggest-part-number', 'POST', 400, {}, 'Sugerir part number (dados inválidos)');
  await testRoute('/produtos/notificacoes', 'GET', 401, null, 'Notificações de produtos (sem auth)');

  // ==================== TESTES DE ORDENS DE SERVIÇO ====================
  log(`\n${colors.bold}=== TESTES DE ORDENS DE SERVIÇO ===${colors.reset}`, 'bold');
  
  await testRoute('/ordens-servico', 'GET', 401, null, 'Listar ordens de serviço (sem auth)');
  await testRoute('/ordens-servico/estatisticas', 'GET', 401, null, 'Estatísticas de ordens (sem auth)');
  await testRoute('/ordens-servico', 'POST', 401, {
    titulo: 'Ordem Teste',
    descricao: 'Descrição teste',
    clienteId: 'test-id'
  }, 'Criar ordem de serviço (sem auth)');

  // ==================== TESTES DE PAGAMENTOS ====================
  log(`\n${colors.bold}=== TESTES DE PAGAMENTOS ===${colors.reset}`, 'bold');
  
  await testRoute('/pagamentos', 'GET', 401, null, 'Listar pagamentos (sem auth)');
  await testRoute('/pagamentos/estatisticas', 'GET', 401, null, 'Estatísticas de pagamentos (sem auth)');
  await testRoute('/pagamentos', 'POST', 401, {
    valor: 100.00,
    metodo: 'PIX',
    descricao: 'Pagamento teste'
  }, 'Criar pagamento (sem auth)');

  // ==================== TESTES DE DASHBOARD ====================
  log(`\n${colors.bold}=== TESTES DE DASHBOARD ===${colors.reset}`, 'bold');
  
  await testRoute('/dashboard/stats', 'GET', 401, null, 'Estatísticas do dashboard (sem auth)');
  await testRoute('/dashboard/activities', 'GET', 401, null, 'Atividades do dashboard (sem auth)');

  // ==================== TESTES DE RELATÓRIOS ====================
  log(`\n${colors.bold}=== TESTES DE RELATÓRIOS ===${colors.reset}`, 'bold');
  
  await testRoute('/relatorios/mensal', 'GET', 401, null, 'Relatório mensal (sem auth)');

  // ==================== TESTES DE NOTIFICAÇÕES ====================
  log(`\n${colors.bold}=== TESTES DE NOTIFICAÇÕES ===${colors.reset}`, 'bold');
  
  await testRoute('/notifications', 'GET', 401, null, 'Listar notificações (sem auth)');
  await testRoute('/notifications/stats', 'GET', 401, null, 'Estatísticas de notificações (sem auth)');
  await testRoute('/notifications/preferences', 'GET', 401, null, 'Preferências de notificações (sem auth)');
  await testRoute('/notifications/test', 'POST', 401, {}, 'Testar notificação (sem auth)');

  // ==================== TESTES DE AUDITORIA ====================
  log(`\n${colors.bold}=== TESTES DE AUDITORIA ===${colors.reset}`, 'bold');
  
  await testRoute('/audit/logs', 'GET', 401, null, 'Logs de auditoria (sem auth)');
  await testRoute('/audit/stats', 'GET', 401, null, 'Estatísticas de auditoria (sem auth)');
  await testRoute('/audit/dashboard', 'GET', 401, null, 'Dashboard de auditoria (sem auth)');
  await testRoute('/audit/reports', 'GET', 401, null, 'Relatórios de auditoria (sem auth)');

  // ==================== TESTES DE INTEGRAÇÃO ====================
  log(`\n${colors.bold}=== TESTES DE INTEGRAÇÃO ===${colors.reset}`, 'bold');
  
  await testRoute('/integrations/health', 'GET', 200, null, 'Health check das integrações');
  await testRoute('/integrations/workflows', 'GET', 401, null, 'Workflows de integração (sem auth)');

  // ==================== TESTES DE COMUNICAÇÃO ====================
  log(`\n${colors.bold}=== TESTES DE COMUNICAÇÃO ===${colors.reset}`, 'bold');
  
  await testRoute('/communication/messages', 'GET', 401, null, 'Mensagens (sem auth)');
  await testRoute('/communication/chat-rooms', 'GET', 401, null, 'Salas de chat (sem auth)');
  await testRoute('/communication/support-tickets', 'GET', 401, null, 'Tickets de suporte (sem auth)');
  await testRoute('/communication/stats', 'GET', 401, null, 'Estatísticas de comunicação (sem auth)');

  // ==================== TESTES DE RBAC ====================
  log(`\n${colors.bold}=== TESTES DE RBAC ===${colors.reset}`, 'bold');
  
  await testRoute('/rbac/roles', 'GET', 401, null, 'Listar roles (sem auth)');
  await testRoute('/rbac/assignments', 'GET', 401, null, 'Atribuições de roles (sem auth)');

  // ==================== TESTES DE VALIDAÇÃO ====================
  log(`\n${colors.bold}=== TESTES DE VALIDAÇÃO ===${colors.reset}`, 'bold');
  
  await testRoute('/validate/cpf-cnpj', 'POST', 400, {}, 'Validar CPF/CNPJ (dados inválidos)');

  // ==================== TESTES DE WEBHOOKS ====================
  log(`\n${colors.bold}=== TESTES DE WEBHOOKS ===${colors.reset}`, 'bold');
  
  await testRoute('/webhooks/whatsapp', 'POST', 400, {}, 'Webhook WhatsApp (dados inválidos)');

  // ==================== TESTES DE STRIPE ====================
  log(`\n${colors.bold}=== TESTES DE STRIPE ===${colors.reset}`, 'bold');
  
  await testRoute('/stripe/checkout', 'POST', 400, {}, 'Checkout Stripe (dados inválidos)');

  // ==================== TESTES DE CALENDAR ====================
  log(`\n${colors.bold}=== TESTES DE CALENDAR ===${colors.reset}`, 'bold');
  
  await testRoute('/calendar/auth', 'GET', 401, null, 'Autenticação do calendário (sem auth)');
  await testRoute('/calendar/availability', 'GET', 401, null, 'Disponibilidade do calendário (sem auth)');
  await testRoute('/calendar/integrations', 'GET', 401, null, 'Integrações do calendário (sem auth)');

  // ==================== TESTES DE ANALYTICS ====================
  log(`\n${colors.bold}=== TESTES DE ANALYTICS ===${colors.reset}`, 'bold');
  
  await testRoute('/analytics', 'GET', 401, null, 'Analytics (sem auth)');
  await testRoute('/analytics/export', 'POST', 401, {}, 'Exportar analytics (sem auth)');

  // ==================== TESTES DE ACCOUNTING ====================
  log(`\n${colors.bold}=== TESTES DE ACCOUNTING ===${colors.reset}`, 'bold');
  
  await testRoute('/accounting/systems', 'GET', 401, null, 'Sistemas contábeis (sem auth)');
  await testRoute('/accounting/sync', 'POST', 401, {}, 'Sincronização contábil (sem auth)');
  await testRoute('/accounting/conflicts', 'GET', 401, null, 'Conflitos contábeis (sem auth)');

  // ==================== RESUMO DOS TESTES ====================
  log(`\n${colors.bold}=== RESUMO DOS TESTES ===${colors.reset}`, 'bold');
  log(`Total de testes: ${testResults.total}`, 'blue');
  log(`Testes aprovados: ${testResults.passed}`, 'green');
  log(`Testes falharam: ${testResults.failed}`, 'red');
  
  const successRate = ((testResults.passed / testResults.total) * 100).toFixed(2);
  log(`Taxa de sucesso: ${successRate}%`, successRate > 80 ? 'green' : 'yellow');

  if (testResults.errors.length > 0) {
    log(`\n${colors.bold}=== ERROS DETALHADOS ===${colors.reset}`, 'bold');
    testResults.errors.forEach((error, index) => {
      log(`\n${index + 1}. ${error.method} ${error.route}`, 'red');
      log(`   Esperado: ${error.expected}, Recebido: ${error.actual}`, 'red');
      if (error.error) log(`   Erro: ${error.error}`, 'red');
    });
  }

  // Salvar relatório
  const report = {
    timestamp: new Date().toISOString(),
    summary: testResults,
    baseUrl: BASE_URL,
    environment: process.env.NODE_ENV || 'development'
  };

  fs.writeFileSync(
    path.join(__dirname, '..', 'api-test-report.json'),
    JSON.stringify(report, null, 2)
  );

  log(`\n📊 Relatório salvo em: api-test-report.json`, 'blue');
  
  // Exit code baseado nos resultados
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Executar testes
if (require.main === module) {
  runAllTests().catch(error => {
    log(`❌ Erro fatal: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  });
}

module.exports = { runAllTests, testRoute, makeRequest };