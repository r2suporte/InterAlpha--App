#!/usr/bin/env node

/**
 * Teste Rápido das APIs do InterAlpha
 * Verifica se as principais APIs estão funcionando
 */

// Use native fetch if available (Node 18+) or require node-fetch
let fetch;
try {
  fetch = globalThis.fetch || require('node-fetch');
} catch (error) {
  console.warn('⚠️  fetch not available - using simple HTTP requests');
  fetch = null;
}

class APITester {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  async runTests() {
    console.log('🧪 Testando APIs do InterAlpha...\n');

    if (!fetch) {
      console.log('❌ Fetch não disponível - instale node-fetch ou use Node 18+');
      return;
    }

    try {
      // Aguardar servidor estar pronto
      console.log('⏳ Aguardando servidor estar pronto...');
      await this.waitForServer();

      // Testar APIs principais
      await this.testHealthAPI();
      await this.testMonitoringAPI();
      await this.testProductsAPI();
      await this.testSystemAPIs();

      this.printResults();

    } catch (error) {
      console.error('❌ Erro nos testes:', error.message);
    }
  }

  async waitForServer(maxAttempts = 30) {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await fetch(`${this.baseUrl}/api/system/health`, {
          timeout: 2000
        });
        
        if (response.status < 500) {
          console.log('✅ Servidor está respondendo\n');
          return;
        }
      } catch (error) {
        // Servidor ainda não está pronto
      }

      console.log(`   Tentativa ${i + 1}/${maxAttempts}...`);
      await this.sleep(2000);
    }

    throw new Error('Servidor não respondeu após 60 segundos');
  }

  async testHealthAPI() {
    console.log('🏥 Testando Health Check API...');
    
    await this.runTest('Health Check', async () => {
      const response = await fetch(`${this.baseUrl}/api/system/health`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.status) {
        throw new Error('Resposta inválida - campo status ausente');
      }

      return `Status: ${data.status}`;
    });
  }

  async testMonitoringAPI() {
    console.log('\n📊 Testando Monitoring API...');
    
    await this.runTest('Monitoring Dashboard', async () => {
      const response = await fetch(`${this.baseUrl}/api/system/monitoring`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.timestamp) {
        throw new Error('Resposta inválida - campo timestamp ausente');
      }

      return `Timestamp: ${data.timestamp}`;
    });
  }

  async testProductsAPI() {
    console.log('\n🛍️  Testando Products API...');
    
    await this.runTest('Products List', async () => {
      const response = await fetch(`${this.baseUrl}/api/produtos`);
      
      if (response.status === 401) {
        return 'Autenticação necessária (esperado)';
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return `Resposta OK`;
    });

    await this.runTest('Products Stats', async () => {
      const response = await fetch(`${this.baseUrl}/api/produtos/stats`);
      
      if (response.status === 401) {
        return 'Autenticação necessária (esperado)';
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return `Stats OK`;
    });
  }

  async testSystemAPIs() {
    console.log('\n🔧 Testando System APIs...');
    
    // Testar rota principal
    await this.runTest('Home Page', async () => {
      const response = await fetch(`${this.baseUrl}/`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return 'Página principal carregada';
    });

    // Testar API de validação
    await this.runTest('API Base', async () => {
      const response = await fetch(`${this.baseUrl}/api`);
      
      // Qualquer resposta diferente de 500 é aceitável
      if (response.status >= 500) {
        throw new Error(`HTTP ${response.status}`);
      }

      return `Status: ${response.status}`;
    });
  }

  async runTest(testName, testFunction) {
    this.results.total++;
    
    try {
      const result = await testFunction();
      this.results.passed++;
      this.results.tests.push({ name: testName, status: 'PASS', message: result });
      console.log(`  ✅ ${testName}: ${result}`);
    } catch (error) {
      this.results.failed++;
      this.results.tests.push({ name: testName, status: 'FAIL', message: error.message });
      console.log(`  ❌ ${testName}: ${error.message}`);
    }
  }

  printResults() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESULTADOS DOS TESTES DE API');
    console.log('='.repeat(60));
    console.log(`Total de testes: ${this.results.total}`);
    console.log(`✅ Passou: ${this.results.passed}`);
    console.log(`❌ Falhou: ${this.results.failed}`);
    console.log(`📈 Taxa de sucesso: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%`);

    if (this.results.failed > 0) {
      console.log('\n❌ Testes que falharam:');
      this.results.tests
        .filter(test => test.status === 'FAIL')
        .forEach(test => {
          console.log(`   - ${test.name}: ${test.message}`);
        });
    }

    console.log('\n💡 Próximos passos:');
    if (this.results.failed === 0) {
      console.log('   🎉 Todas as APIs estão funcionando!');
      console.log('   🌐 Acesse: http://localhost:3000');
      console.log('   📊 Dashboard: http://localhost:3000/dashboard');
    } else {
      console.log('   🔧 Corrija os problemas identificados');
      console.log('   📋 Verifique os logs do servidor');
      console.log('   🔄 Execute os testes novamente');
    }
    console.log('='.repeat(60));
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Executar testes
async function main() {
  const tester = new APITester();
  await tester.runTests();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { APITester };