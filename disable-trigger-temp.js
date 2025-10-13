const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function disableTrigger() {
  console.log(
    '🔧 Tentando desabilitar temporariamente o trigger problemático...\n'
  );

  try {
    // Tentar desabilitar o trigger que está causando o problema
    const { data, error } = await supabase.rpc('execute_sql', {
      query:
        'ALTER TABLE ordens_servico DISABLE TRIGGER trigger_email_ordem_servico;',
    });

    if (error) {
      console.log('❌ Erro ao desabilitar trigger via RPC:', error.message);

      // Tentar abordagem alternativa - verificar se conseguimos fazer uma inserção simples
      console.log('\n🧪 Testando inserção após tentativa de desabilitar...');

      const { data: insertTest, error: insertError } = await supabase
        .from('ordens_servico')
        .insert({
          titulo: 'Teste Sem Trigger',
          descricao: 'Teste para verificar se trigger foi desabilitado',
          status: 'aberta',
          prioridade: 'baixa',
        })
        .select();

      if (insertError) {
        console.log('❌ Erro persiste na inserção:', insertError.message);

        if (insertError.message.includes('cp.cliente_id')) {
          console.log('\n🎯 DIAGNÓSTICO FINAL:');
          console.log('1. O erro "cp.cliente_id does not exist" persiste');
          console.log(
            '2. Isso indica que há uma função ou trigger ativo que não foi corrigido'
          );
          console.log(
            '3. A função processar_emails_pendentes() original ainda está ativa no banco'
          );
          console.log(
            '4. É necessário aplicar a migração de correção quando a conectividade for restaurada'
          );

          console.log('\n📋 SOLUÇÕES RECOMENDADAS:');
          console.log(
            'A. Aguardar conectividade do Supabase e aplicar: npx supabase db push'
          );
          console.log(
            'B. Aplicar manualmente via Dashboard do Supabase a migração 20250926090000_force_fix_processar_emails.sql'
          );
          console.log(
            'C. Verificar se há outras funções não identificadas que usam cp.cliente_id'
          );

          return {
            status: 'error_persists',
            error: insertError,
            recommendation: 'apply_migration_manually',
          };
        }
      } else {
        console.log(
          '✅ Inserção bem-sucedida após desabilitar trigger:',
          insertTest
        );
        return { status: 'success', data: insertTest };
      }
    } else {
      console.log('✅ Trigger desabilitado com sucesso');

      // Testar inserção após desabilitar
      const { data: insertTest, error: insertError } = await supabase
        .from('ordens_servico')
        .insert({
          titulo: 'Teste Sem Trigger',
          descricao: 'Teste para verificar se trigger foi desabilitado',
          status: 'aberta',
          prioridade: 'baixa',
        })
        .select();

      if (insertError) {
        console.log(
          '❌ Erro persiste mesmo com trigger desabilitado:',
          insertError.message
        );
        return { status: 'error_persists', error: insertError };
      } 
        console.log(
          '✅ Inserção bem-sucedida com trigger desabilitado:',
          insertTest
        );
        return { status: 'success', data: insertTest };
      
    }
  } catch (error) {
    console.error('❌ Erro geral:', error);
    return { status: 'error', error };
  }
}

async function main() {
  const result = await disableTrigger();

  console.log('\n📊 RESULTADO FINAL:');
  console.log('Status:', result.status);

  if (result.status === 'error_persists') {
    console.log('\n🚨 AÇÃO NECESSÁRIA:');
    console.log(
      'O problema persiste e requer intervenção manual no banco de dados.'
    );
    console.log(
      'A função processar_emails_pendentes() precisa ser corrigida removendo a referência a cp.cliente_id'
    );
  }
}

main();
