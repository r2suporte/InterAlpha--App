require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function testInsert() {
  console.log('🧪 Testando inserção de ordem de serviço...');

  // Primeiro, vamos buscar// Buscar um cliente portal existente
  const { data: clientePortal, error: clienteError } = await supabase
    .from('clientes_portal')
    .select('*')
    .limit(1)
    .single();

  if (clienteError) {
    console.error('❌ Erro ao buscar cliente portal:', clienteError);
    return;
  }

  console.log('✅ Cliente portal encontrado:', clientePortal.nome);

  // Agora vamos tentar inserir uma ordem de serviço simples
  const ordemData = {
    cliente_portal_id: clientePortal.id,
    titulo: 'Teste de inserção',
    descricao: 'Teste de inserção de ordem de serviço',
    status: 'aberta',
    prioridade: 'media',
    valor_servico: 100.0,
  };

  console.log('📋 Dados da ordem:', ordemData);

  const { data: ordem, error: errorOrdem } = await supabase
    .from('ordens_servico')
    .insert(ordemData)
    .select();

  if (errorOrdem) {
    console.error('❌ Erro ao inserir ordem:', errorOrdem);
  } else {
    console.log('✅ Ordem inserida com sucesso:', ordem);
  }
}

testInsert().catch(console.error);
