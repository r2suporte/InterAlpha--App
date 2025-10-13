const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function applyMigrationViaSupabase() {
  console.log(
    '🚀 Iniciando correção do problema cp.cliente_id via Supabase...\n'
  );

  // Criar cliente Supabase com service role key
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    console.log('🔌 Conectando ao Supabase...');
    console.log('📍 URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);

    // Ler o conteúdo da migração
    const migrationPath = path.join(
      __dirname,
      'supabase/migrations/20250926090000_force_fix_processar_emails.sql'
    );

    if (!fs.existsSync(migrationPath)) {
      console.log('❌ Arquivo de migração não encontrado:', migrationPath);
      return { success: false };
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('📄 Migração carregada:', migrationPath);
    console.log(
      '🎯 Objetivo: Corrigir função processar_emails_pendentes removendo cp.cliente_id\n'
    );

    // Dividir o SQL em comandos individuais
    const sqlCommands = migrationSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0);

    console.log(`📋 Executando ${sqlCommands.length} comandos SQL...`);

    // Executar cada comando
    for (let i = 0; i < sqlCommands.length; i++) {
      const command = sqlCommands[i];
      if (command.trim()) {
        console.log(`\n🔄 Executando comando ${i + 1}/${sqlCommands.length}:`);
        console.log(
          `   ${command.substring(0, 80)}${command.length > 80 ? '...' : ''}`
        );

        try {
          const { data, error } = await supabase.rpc('execute_sql', {
            sql: command,
          });

          if (error) {
            console.log(`❌ Erro no comando ${i + 1}:`, error.message);

            // Tentar executar via query direta se RPC falhar
            console.log('🔄 Tentando via query direta...');
            const { data: directData, error: directError } = await supabase
              .from('_temp_sql_execution')
              .select('*')
              .limit(0); // Isso vai falhar, mas vamos tentar outro método

            // Se não conseguir via RPC, vamos tentar uma abordagem diferente
            console.log(
              '⚠️ RPC execute_sql não disponível, tentando abordagem alternativa...'
            );
            break;
          } else {
            console.log(`✅ Comando ${i + 1} executado com sucesso`);
          }
        } catch (cmdError) {
          console.log(`❌ Erro no comando ${i + 1}:`, cmdError.message);
          break;
        }
      }
    }

    // Verificar se a função foi corrigida
    console.log('\n🔍 Verificando se a função foi corrigida...');

    try {
      const { data, error } = await supabase.rpc('get_function_definition', {
        function_name: 'processar_emails_pendentes',
      });

      if (error) {
        console.log('⚠️ Não foi possível verificar a função via RPC');
        console.log('   Vamos tentar o teste de inserção diretamente...');
      } else if (data && data.includes && data.includes('cp.cliente_id')) {
        console.log(
          '❌ ATENÇÃO: A função ainda contém referência a cp.cliente_id'
        );
      } else {
        console.log('✅ Função parece estar corrigida!');
      }
    } catch (checkError) {
      console.log('⚠️ Erro ao verificar função:', checkError.message);
    }
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    return { success: false, error };
  }

  return { success: true };
}

async function testInsertion() {
  console.log('\n🧪 Testando inserção após tentativa de correção...');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    const { data, error } = await supabase
      .from('ordens_servico')
      .insert({
        titulo: 'Teste Pós-Correção Via Supabase',
        descricao: 'Teste para verificar se o erro cp.cliente_id foi corrigido',
        status: 'aberta',
        prioridade: 'baixa',
      })
      .select();

    if (error) {
      console.log('❌ Erro na inserção:', error.message);

      if (error.message.includes('cp.cliente_id')) {
        console.log('🚨 O erro cp.cliente_id ainda persiste!');
        console.log('   A migração não foi aplicada com sucesso.');

        // Vamos tentar uma abordagem mais direta
        console.log('\n🔧 Tentando correção direta da função...');
        return await tryDirectFunctionFix(supabase);
      } 
        console.log('⚠️ Erro diferente encontrado:', error.message);
      
      return { success: false, error };
    } 
      console.log('✅ Inserção bem-sucedida!', data);
      console.log('🎉 Problema resolvido! O erro cp.cliente_id foi corrigido.');
      return { success: true, data };
    
  } catch (testError) {
    console.error('❌ Erro no teste:', testError.message);
    return { success: false, error: testError };
  }
}

async function tryDirectFunctionFix(supabase) {
  console.log(
    '🔧 Tentando correção direta da função processar_emails_pendentes...'
  );

  // SQL para recriar a função sem cp.cliente_id
  const fixSQL = `
    -- Dropar função existente
    DROP FUNCTION IF EXISTS processar_emails_pendentes();
    
    -- Recriar função corrigida
    CREATE OR REPLACE FUNCTION processar_emails_pendentes()
    RETURNS void
    LANGUAGE plpgsql
    AS $$
    BEGIN
      INSERT INTO comunicacoes_cliente (
        ordem_servico_id,
        tipo,
        conteudo,
        status,
        tentativas,
        created_at
      )
      SELECT DISTINCT
        cc.ordem_servico_id,
        'email'::comunicacao_tipo,
        'Ordem de serviço criada: ' || os.titulo,
        'pendente'::comunicacao_status,
        0,
        NOW()
      FROM comunicacoes_cliente cc
      JOIN ordens_servico os ON cc.ordem_servico_id = os.id
      WHERE cc.status = 'pendente'
        AND cc.tipo = 'email'
        AND cc.created_at > NOW() - INTERVAL '1 hour'
      ON CONFLICT (ordem_servico_id, tipo) 
      WHERE status = 'pendente' 
      DO NOTHING;
    END;
    $$;
  `;

  try {
    // Tentar executar via diferentes métodos
    console.log('📝 Executando SQL de correção...');

    // Método 1: Tentar via RPC se disponível
    try {
      const { data, error } = await supabase.rpc('execute_sql', {
        sql: fixSQL,
      });
      if (!error) {
        console.log('✅ Função corrigida via RPC!');
        return await testInsertionAgain(supabase);
      }
    } catch (rpcError) {
      console.log('⚠️ RPC não disponível, tentando método alternativo...');
    }

    // Método 2: Tentar via Edge Function (se disponível)
    console.log('🔄 Tentando via método alternativo...');

    // Como não temos acesso direto ao SQL, vamos sugerir a solução manual
    console.log('\n📋 SOLUÇÃO MANUAL NECESSÁRIA:');
    console.log(
      'Como não conseguimos executar SQL diretamente via API, você precisa:'
    );
    console.log('');
    console.log('1. Acessar o Dashboard do Supabase:');
    console.log(
      '   https://supabase.com/dashboard/project/qwbtqlkvooguijchbuxx'
    );
    console.log('');
    console.log('2. Ir em "SQL Editor"');
    console.log('');
    console.log('3. Executar este SQL:');
    console.log('```sql');
    console.log(fixSQL);
    console.log('```');
    console.log('');
    console.log(
      '4. Depois executar o teste novamente com: node test-insert.js'
    );

    return { success: false, needsManualFix: true };
  } catch (directError) {
    console.error('❌ Erro na correção direta:', directError.message);
    return { success: false, error: directError };
  }
}

async function testInsertionAgain(supabase) {
  console.log('\n🔄 Testando inserção novamente...');

  try {
    const { data, error } = await supabase
      .from('ordens_servico')
      .insert({
        titulo: 'Teste Final Pós-Correção',
        descricao: 'Teste final após correção direta da função',
        status: 'aberta',
        prioridade: 'baixa',
      })
      .select();

    if (error) {
      console.log('❌ Erro persiste:', error.message);
      return { success: false, error };
    } 
      console.log('✅ Sucesso! Inserção funcionando!', data);
      return { success: true, data };
    
  } catch (testError) {
    console.error('❌ Erro no teste final:', testError.message);
    return { success: false, error: testError };
  }
}

async function main() {
  console.log('🚀 Iniciando correção do problema cp.cliente_id...\n');

  const migrationResult = await applyMigrationViaSupabase();

  // Aguardar um momento para processamento
  console.log('\n⏳ Aguardando processamento...');
  await new Promise(resolve => setTimeout(resolve, 2000));

  const testResult = await testInsertion();

  if (testResult.success) {
    console.log('\n🎯 RESULTADO FINAL: SUCESSO!');
    console.log('✅ O erro cp.cliente_id foi corrigido');
    console.log('✅ Inserções em ordens_servico funcionam normalmente');
  } else if (testResult.needsManualFix) {
    console.log('\n⚠️ RESULTADO FINAL: AÇÃO MANUAL NECESSÁRIA');
    console.log('📋 Siga as instruções acima para completar a correção');
  } else {
    console.log('\n❌ RESULTADO FINAL: PROBLEMA PERSISTE');
    console.log('❌ O erro cp.cliente_id ainda não foi resolvido');
    console.log('📋 Pode ser necessária investigação adicional');
  }
}

main();
