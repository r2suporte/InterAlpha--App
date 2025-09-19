require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function fixCheckConstraint() {
  console.log('🔍 Verificando constraint check_cliente_reference...\n');

  // 1. Verificar se a constraint existe
  const { data: constraints, error: constraintsError } = await supabase
    .from('information_schema.table_constraints')
    .select('*')
    .eq('table_name', 'ordens_servico')
    .eq('constraint_type', 'CHECK');

  if (constraintsError) {
    console.log('❌ Erro ao buscar constraints:', constraintsError);
    return;
  }

  console.log('📋 Constraints CHECK encontradas:', constraints);

  // 2. Tentar remover a constraint problemática via SQL raw
  console.log('\n🔧 Removendo constraint check_cliente_reference...');
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE public.ordens_servico DROP CONSTRAINT IF EXISTS check_cliente_reference;'
    });

    if (error) {
      console.log('❌ Erro ao remover constraint:', error);
    } else {
      console.log('✅ Constraint removida com sucesso');
    }
  } catch (err) {
    console.log('❌ Erro na execução:', err);
  }

  // 3. Testar inserção após remoção
  console.log('\n💉 Testando inserção após remoção da constraint...');
  
  // Primeiro, buscar um cliente portal
  const { data: clientePortal } = await supabase
    .from('clientes_portal')
    .select('id')
    .limit(1)
    .single();

  if (!clientePortal) {
    console.log('❌ Nenhum cliente portal encontrado');
    return;
  }

  // Tentar inserir ordem de serviço
  const { data: ordem, error: ordemError } = await supabase
    .from('ordens_servico')
    .insert({
      cliente_portal_id: clientePortal.id,
      titulo: 'Teste após fix constraint',
      descricao: 'Teste de inserção após remoção da constraint',
      status: 'aberta',
      prioridade: 'media',
      valor_servico: 100.00
    })
    .select();

  if (ordemError) {
    console.log('❌ Erro na inserção:', ordemError);
  } else {
    console.log('✅ Inserção bem-sucedida:', ordem);
  }
}

fixCheckConstraint().catch(console.error);