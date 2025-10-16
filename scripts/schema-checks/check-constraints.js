require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkConstraints() {
  console.log(
    '🔍 Verificando constraints e estrutura da tabela ordens_servico...\n'
  );

  try {
    // Vamos tentar uma inserção com dados mínimos para ver o erro exato
    console.log('🧪 Testando inserção com dados mínimos...');

    const { data: insertResult, error: insertError } = await supabase
      .from('ordens_servico')
      .insert({
        titulo: 'Test',
      });

    if (insertError) {
      console.log('❌ Erro na inserção (esperado):', insertError);
      console.log('📋 Código do erro:', insertError.code);
      console.log('📋 Mensagem:', insertError.message);
      console.log('📋 Detalhes:', insertError.details);
      console.log('📋 Hint:', insertError.hint);
    } else {
      console.log('✅ Inserção bem-sucedida (inesperado):', insertResult);
    }

    // Vamos tentar uma inserção com cliente_portal_id válido
    console.log('\n🧪 Testando inserção com cliente_portal_id...');

    const { data: insertResult2, error: insertError2 } = await supabase
      .from('ordens_servico')
      .insert({
        cliente_portal_id: '3fef921d-5e1d-408c-9937-3385df3d54d7',
        titulo: 'Test with client',
      });

    if (insertError2) {
      console.log('❌ Erro na inserção com cliente:', insertError2);
      console.log('📋 Código do erro:', insertError2.code);
      console.log('📋 Mensagem:', insertError2.message);
      console.log('📋 Detalhes:', insertError2.details);
      console.log('📋 Hint:', insertError2.hint);
    } else {
      console.log('✅ Inserção com cliente bem-sucedida:', insertResult2);
    }

    // Vamos tentar verificar a estrutura da tabela
    console.log('\n🔍 Verificando estrutura da tabela...');

    const { data: tableInfo, error: tableError } = await supabase
      .from('ordens_servico')
      .select('*')
      .limit(1);

    if (tableError) {
      console.log('❌ Erro ao verificar estrutura:', tableError);
    } else {
      console.log('✅ Estrutura da tabela verificada. Colunas disponíveis:');
      if (tableInfo && tableInfo.length > 0) {
        console.log('📋 Colunas:', Object.keys(tableInfo[0]));
      } else {
        console.log('📋 Tabela vazia, não foi possível verificar colunas');
      }
    }
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkConstraints();
