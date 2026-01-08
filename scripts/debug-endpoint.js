const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function debugEndpointQueries() {
  console.log('🔍 Debugando consultas do endpoint...\n');

  const now = new Date();
  const periodo = '30';
  const dataFim = now;
  const dataInicio = new Date(
    now.getTime() - parseInt(periodo, 10) * 24 * 60 * 60 * 1000
  );
  const periodoAnterior = new Date(
    dataInicio.getTime() - parseInt(periodo, 10) * 24 * 60 * 60 * 1000
  );

  console.log('📅 Datas calculadas:');
  console.log(`   Data início: ${dataInicio.toISOString()}`);
  console.log(`   Data fim: ${dataFim.toISOString()}`);
  console.log(`   Período anterior: ${periodoAnterior.toISOString()}\n`);

  try {
    // Teste 1: Total de clientes
    console.log('1️⃣ Testando consulta de total de clientes...');
    const totalClientesResult = await supabase
      .from('clientes')
      .select('id', { count: 'exact', head: true });

    console.log('   Resultado:', totalClientesResult);
    console.log(`   Count: ${totalClientesResult.count}\n`);

    // Teste 2: Clientes novos
    console.log('2️⃣ Testando consulta de clientes novos...');
    const clientesNovosResult = await supabase
      .from('clientes')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', dataInicio.toISOString());

    console.log('   Resultado:', clientesNovosResult);
    console.log(`   Count: ${clientesNovosResult.count}\n`);

    // Teste 3: Total de ordens
    console.log('3️⃣ Testando consulta de total de ordens...');
    const totalOrdensResult = await supabase
      .from('ordens_servico')
      .select('id', { count: 'exact', head: true });

    console.log('   Resultado:', totalOrdensResult);
    console.log(`   Count: ${totalOrdensResult.count}\n`);

    // Teste 4: Ordens abertas
    console.log('4️⃣ Testando consulta de ordens abertas...');
    const ordensAbertasResult = await supabase
      .from('ordens_servico')
      .select('id', { count: 'exact', head: true })
      .in('status', ['aberta', 'em_andamento', 'aguardando_peca']);

    console.log('   Resultado:', ordensAbertasResult);
    console.log(`   Count: ${ordensAbertasResult.count}\n`);

    // Teste 5: Ordens finalizadas
    console.log('5️⃣ Testando consulta de ordens finalizadas...');
    const ordensFinalizadasResult = await supabase
      .from('ordens_servico')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'concluida');

    console.log('   Resultado:', ordensFinalizadasResult);
    console.log(`   Count: ${ordensFinalizadasResult.count}\n`);

    // Teste 6: Faturamento
    console.log('6️⃣ Testando consulta de faturamento...');
    const faturamentoResult = await supabase
      .from('ordens_servico')
      .select('valor_servico')
      .eq('status', 'concluida')
      .gte('created_at', dataInicio.toISOString())
      .lte('created_at', dataFim.toISOString());

    console.log('   Resultado:', faturamentoResult);

    if (faturamentoResult.data) {
      const faturamento = faturamentoResult.data.reduce(
        (acc, ordem) => acc + (ordem.valor_servico || 0),
        0
      );
      console.log(`   Faturamento calculado: R$ ${faturamento}\n`);
    }

    // Teste 7: Verificar estrutura da tabela clientes
    console.log('7️⃣ Verificando estrutura da tabela clientes...');
    const clientesStructure = await supabase
      .from('clientes')
      .select('*')
      .limit(1);

    console.log('   Estrutura:', clientesStructure);

    // Teste 8: Verificar estrutura da tabela ordens_servico
    console.log('\n8️⃣ Verificando estrutura da tabela ordens_servico...');
    const ordensStructure = await supabase
      .from('ordens_servico')
      .select('*')
      .limit(1);

    console.log('   Estrutura:', ordensStructure);
  } catch (error) {
    console.error('❌ Erro durante debug:', error);
  }
}

debugEndpointQueries();
