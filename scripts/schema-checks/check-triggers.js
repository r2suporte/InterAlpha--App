require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTriggers() {
  console.log('🔍 Verificando triggers ativos na tabela ordens_servico...\n');

  try {
    // Verificar triggers na tabela ordens_servico usando uma abordagem mais simples
    const { data: triggers, error: triggerError } = await supabase
      .from('information_schema.triggers')
      .select('*')
      .eq('event_object_table', 'ordens_servico');

    if (triggerError) {
      console.log(
        '❌ Erro ao buscar triggers via information_schema:',
        triggerError
      );

      // Tentar uma abordagem mais direta
      console.log('\n🔍 Tentando buscar triggers diretamente...');

      const { data: directTriggers, error: directError } = await supabase
        .from('pg_trigger')
        .select('*');

      if (directError) {
        console.log('❌ Erro ao buscar triggers diretamente:', directError);
      } else {
        console.log('📋 Triggers encontrados (direto):', directTriggers);
      }
    } else {
      console.log('📋 Triggers encontrados na tabela ordens_servico:');
      console.log(JSON.stringify(triggers, null, 2));
    }

    // Tentar uma inserção simples para ver o erro completo
    console.log('\n🧪 Tentando inserção simples para capturar stack trace...');

    const { data: insertData, error: insertError } = await supabase
      .from('ordens_servico')
      .insert({
        cliente_portal_id: '3fef921d-5e1d-408c-9937-3385df3d54d7',
        titulo: 'Debug Test Simple',
        descricao: 'Teste simples para debug',
        status: 'aberta',
        prioridade: 'media',
        valor_servico: 25.0,
      })
      .select();

    if (insertError) {
      console.log('❌ Erro na inserção simples:');
      console.log('Code:', insertError.code);
      console.log('Message:', insertError.message);
      console.log('Details:', insertError.details);
      console.log('Hint:', insertError.hint);
      console.log('Full error:', JSON.stringify(insertError, null, 2));
    } else {
      console.log('✅ Inserção simples bem-sucedida!', insertData);
    }
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkTriggers();
