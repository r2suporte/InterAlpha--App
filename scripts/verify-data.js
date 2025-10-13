const { createClient } = require('@supabase/supabase-js');

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyData() {
  try {
    console.log('🔍 Verificando dados no banco...\n');

    // Verificar clientes
    const { data: clientes, error: clientesError } = await supabase
      .from('clientes')
      .select('*');

    if (clientesError) {
      console.error('❌ Erro ao buscar clientes:', clientesError);
    } else {
      console.log(`✅ Clientes encontrados: ${clientes.length}`);
      clientes.forEach((cliente, index) => {
        console.log(`   ${index + 1}. ${cliente.nome} - ${cliente.email}`);
      });
    }

    // Verificar equipamentos
    const { data: equipamentos, error: equipamentosError } = await supabase
      .from('equipamentos')
      .select('*');

    if (equipamentosError) {
      console.error('❌ Erro ao buscar equipamentos:', equipamentosError);
    } else {
      console.log(`\n✅ Equipamentos encontrados: ${equipamentos.length}`);
      equipamentos.forEach((equipamento, index) => {
        console.log(
          `   ${index + 1}. ${equipamento.tipo} ${equipamento.modelo} - ${equipamento.serial_number}`
        );
      });
    }

    // Verificar ordens de serviço
    const { data: ordens, error: ordensError } = await supabase
      .from('ordens_servico')
      .select('*');

    if (ordensError) {
      console.error('❌ Erro ao buscar ordens:', ordensError);
    } else {
      console.log(`\n✅ Ordens de serviço encontradas: ${ordens.length}`);
      ordens.forEach((ordem, index) => {
        console.log(
          `   ${index + 1}. ${ordem.titulo} - Status: ${ordem.status} - Valor: R$ ${ordem.valor_servico}`
        );
        console.log(
          `      Cliente ID: ${ordem.cliente_id}, Equipamento ID: ${ordem.equipamento_id}`
        );
        console.log(`      Criado em: ${ordem.created_at}`);
      });
    }

    // Verificar estrutura das tabelas
    console.log('\n🔍 Verificando estrutura das tabelas...');

    // Testar consulta similar ao endpoint
    const { data: ordensRecentes, error: ordensRecentesError } = await supabase
      .from('ordens_servico')
      .select('*')
      .gte(
        'created_at',
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      );

    if (ordensRecentesError) {
      console.error('❌ Erro ao buscar ordens recentes:', ordensRecentesError);
    } else {
      console.log(`\n✅ Ordens dos últimos 30 dias: ${ordensRecentes.length}`);
    }
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

verifyData();
