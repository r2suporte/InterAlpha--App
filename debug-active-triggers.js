const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugFunctions() {
  console.log('🔍 Investigando o problema cp.cliente_id...\n');

  try {
    // Vamos verificar se conseguimos desabilitar temporariamente os triggers
    console.log('🧪 Testando inserção com triggers desabilitados...');

    // Primeiro, vamos tentar uma inserção normal para confirmar o erro
    const { data: normalInsert, error: normalError } = await supabase
      .from('ordens_servico')
      .insert({
        titulo: 'Teste Normal',
        descricao: 'Teste para confirmar erro',
        status: 'aberta',
        prioridade: 'baixa',
      })
      .select();

    if (normalError) {
      console.log(
        '❌ Erro confirmado na inserção normal:',
        normalError.message
      );

      // Vamos verificar se há triggers específicos que podemos identificar
      console.log('\n🔍 Analisando o erro...');

      if (normalError.message.includes('cp.cliente_id')) {
        console.log('✅ Confirmado: O erro está relacionado a cp.cliente_id');
        console.log(
          '📍 Isso indica que há um trigger ou constraint que executa uma função problemática'
        );

        // Vamos tentar identificar qual migração pode ter criado o problema
        console.log(
          '\n📋 Baseado nas migrações analisadas, os possíveis culpados são:'
        );
        console.log(
          '1. trigger_email_ordem_servico (criado em 20250126130000_add_email_triggers.sql)'
        );
        console.log('2. processar_emails_pendentes (múltiplas versões)');
        console.log('3. Alguma constraint ou trigger não identificado');

        // Vamos verificar se o problema está na função trigger_email_ordem_servico
        console.log(
          '\n🎯 Hipótese: O trigger trigger_email_ordem_servico pode estar chamando uma função problemática'
        );
        console.log(
          '📝 Vamos verificar se podemos desabilitar temporariamente este trigger...'
        );

        return {
          error: normalError,
          analysis:
            'Erro confirmado relacionado a cp.cliente_id em trigger ou função ativa',
        };
      }
    } else {
      console.log('✅ Inserção bem-sucedida (inesperado):', normalInsert);
      return { success: true, data: normalInsert };
    }
  } catch (error) {
    console.error('❌ Erro geral:', error);
    return { error };
  }
}

async function main() {
  const result = await debugFunctions();

  if (result.error) {
    console.log('\n🔧 PRÓXIMOS PASSOS RECOMENDADOS:');
    console.log(
      '1. Verificar se há uma versão antiga da função trigger_email_ordem_servico'
    );
    console.log(
      '2. Recriar a função trigger_email_ordem_servico sem referências a cp.cliente_id'
    );
    console.log('3. Verificar se há outros triggers não identificados');
    console.log(
      '4. Considerar desabilitar temporariamente os triggers de email'
    );
  }
}

main();
