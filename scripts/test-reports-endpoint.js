const fetch = require('node-fetch');

async function testReportsEndpoint() {
  try {
    console.log('🧪 Testando endpoint de relatórios...\n');

    const response = await fetch(
      'http://localhost:3000/api/dashboard/reports',
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Simulando uma requisição sem autenticação primeiro
        },
      }
    );

    console.log('📊 Status da resposta:', response.status);
    console.log(
      '📊 Headers da resposta:',
      Object.fromEntries(response.headers.entries())
    );

    const data = await response.json();
    console.log('\n📊 Dados retornados:');
    console.log(JSON.stringify(data, null, 2));

    if (response.status === 401) {
      console.log('\n✅ Endpoint agora requer autenticação (como esperado)');
      console.log('🔒 RLS está funcionando corretamente');
    } else if (response.status === 200) {
      console.log('\n📈 Dados do relatório:');
      console.log('- Total de clientes:', data.summary?.totalClientes || 0);
      console.log('- Total de ordens:', data.summary?.totalOrdens || 0);
      console.log('- Ordens abertas:', data.summary?.ordensAbertas || 0);
      console.log(
        '- Ordens finalizadas:',
        data.summary?.ordensFinalizadas || 0
      );
      console.log('- Faturamento do mês:', data.summary?.faturamentoMes || 0);
    }
  } catch (error) {
    console.error('❌ Erro ao testar endpoint:', error.message);
  }
}

testReportsEndpoint();
