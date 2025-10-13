require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRLSPolicies() {
  console.log(
    '🔍 Verificando políticas RLS que podem estar causando o erro...\n'
  );

  try {
    // Primeiro, vamos tentar inserir com bypass de RLS para ver se o problema é RLS
    console.log('🧪 Testando inserção com service role (bypass RLS)...');

    const { data: insertData, error: insertError } = await supabase
      .from('ordens_servico')
      .insert({
        cliente_portal_id: '3fef921d-5e1d-408c-9937-3385df3d54d7',
        titulo: 'Teste RLS Bypass',
        descricao: 'Teste para verificar se RLS é o problema',
        status: 'aberta',
        prioridade: 'media',
        valor_servico: 30.0,
      })
      .select();

    if (insertError) {
      console.log('❌ Erro mesmo com service role (não é problema de RLS):');
      console.log('Code:', insertError.code);
      console.log('Message:', insertError.message);
      console.log('Details:', insertError.details);

      // Se ainda há erro, vamos verificar se há triggers ativos
      console.log(
        '\n🔍 Verificando se há triggers na tabela ordens_servico...'
      );

      // Vamos tentar uma abordagem diferente - verificar a estrutura da tabela
      const { data: tableInfo, error: tableError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_name', 'ordens_servico')
        .eq('table_schema', 'public');

      if (tableError) {
        console.log('❌ Erro ao buscar estrutura da tabela:', tableError);
      } else {
        console.log('📋 Estrutura da tabela ordens_servico:');
        tableInfo.forEach(col => {
          console.log(
            `- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`
          );
        });
      }
    } else {
      console.log('✅ Inserção com service role bem-sucedida!', insertData);
      console.log(
        '🎯 O problema não é RLS - a inserção funcionou com service role'
      );

      // Limpar o registro de teste
      if (insertData && insertData[0]) {
        await supabase
          .from('ordens_servico')
          .delete()
          .eq('id', insertData[0].id);
        console.log('🧹 Registro de teste removido');
      }
    }
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkRLSPolicies();
