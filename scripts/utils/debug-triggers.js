require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugTriggers() {
  console.log('🔍 Investigando triggers ativos na tabela ordens_servico...\n');

  try {
    // Usar SQL direto para buscar triggers
    const { data, error } = await supabase.from('pg_trigger').select(`
        tgname,
        tgrelid,
        tgfoid,
        tgenabled
      `);

    if (error) {
      console.log('Erro ao buscar triggers via tabela:', error);

      // Tentar uma abordagem diferente - inserir diretamente e capturar o erro detalhado
      console.log(
        '\n🧪 Tentando inserção direta para capturar erro detalhado...'
      );

      const { data: insertData, error: insertError } = await supabase
        .from('ordens_servico')
        .insert({
          cliente_portal_id: '3fef921d-5e1d-408c-9937-3385df3d54d7',
          titulo: 'Debug Test',
          descricao: 'Teste para debug',
          status: 'aberta',
          prioridade: 'media',
          valor_servico: 50.0,
        })
        .select();

      if (insertError) {
        console.log(
          '❌ Erro detalhado na inserção:',
          JSON.stringify(insertError, null, 2)
        );
      } else {
        console.log('✅ Inserção bem-sucedida!', insertData);
      }
    } else {
      console.log('Triggers encontrados:', data);
    }
  } catch (error) {
    console.error('Erro geral:', error);
  }
}

debugTriggers();
