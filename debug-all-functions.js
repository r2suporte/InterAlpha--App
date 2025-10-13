require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugAllFunctions() {
  console.log('🔍 Verificando todas as funções e triggers no banco...\n');

  try {
    // 1. Listar todas as funções
    console.log('📋 1. Listando todas as funções:');
    const { data: functions, error: funcError } = await supabase.rpc(
      'execute_sql',
      {
        query: `
        SELECT 
          routine_name,
          routine_type,
          routine_definition
        FROM information_schema.routines 
        WHERE routine_schema = 'public' 
        AND routine_type = 'FUNCTION'
        ORDER BY routine_name;
      `,
      }
    );

    if (funcError) {
      console.log('❌ Erro ao listar funções:', funcError);
    } else {
      functions.forEach(func => {
        console.log(`\n📝 Função: ${func.routine_name}`);
        if (
          func.routine_definition &&
          func.routine_definition.includes('cp.cliente_id')
        ) {
          console.log('⚠️  CONTÉM REFERÊNCIA PROBLEMÁTICA: cp.cliente_id');
          console.log(
            'Definição:',
            `${func.routine_definition.substring(0, 200)  }...`
          );
        }
      });
    }

    // 2. Listar todos os triggers
    console.log('\n\n📋 2. Listando todos os triggers:');
    const { data: triggers, error: trigError } = await supabase.rpc(
      'execute_sql',
      {
        query: `
        SELECT 
          trigger_name,
          event_manipulation,
          event_object_table,
          action_statement,
          action_timing
        FROM information_schema.triggers 
        WHERE trigger_schema = 'public'
        ORDER BY trigger_name;
      `,
      }
    );

    if (trigError) {
      console.log('❌ Erro ao listar triggers:', trigError);
    } else {
      triggers.forEach(trigger => {
        console.log(`\n🔗 Trigger: ${trigger.trigger_name}`);
        console.log(`   Tabela: ${trigger.event_object_table}`);
        console.log(
          `   Evento: ${trigger.event_manipulation} ${trigger.action_timing}`
        );
        console.log(`   Ação: ${trigger.action_statement}`);

        if (
          trigger.action_statement &&
          trigger.action_statement.includes('cp.cliente_id')
        ) {
          console.log(
            '⚠️  TRIGGER CONTÉM REFERÊNCIA PROBLEMÁTICA: cp.cliente_id'
          );
        }
      });
    }

    // 3. Verificar especificamente a função processar_emails_pendentes
    console.log('\n\n📋 3. Verificando função processar_emails_pendentes:');
    const { data: procFunc, error: procError } = await supabase.rpc(
      'execute_sql',
      {
        query: `
        SELECT pg_get_functiondef(oid) as definition
        FROM pg_proc 
        WHERE proname = 'processar_emails_pendentes';
      `,
      }
    );

    if (procError) {
      console.log(
        '❌ Erro ao verificar função processar_emails_pendentes:',
        procError
      );
    } else if (procFunc && procFunc.length > 0) {
      console.log('📝 Definição atual da função processar_emails_pendentes:');
      console.log(procFunc[0].definition);

      if (procFunc[0].definition.includes('cp.cliente_id')) {
        console.log(
          '\n⚠️  FUNÇÃO AINDA CONTÉM REFERÊNCIA PROBLEMÁTICA: cp.cliente_id'
        );
      } else {
        console.log('\n✅ Função não contém referências problemáticas');
      }
    } else {
      console.log('❌ Função processar_emails_pendentes não encontrada');
    }

    // 4. Verificar triggers na tabela ordens_servico
    console.log(
      '\n\n📋 4. Verificando triggers específicos da tabela ordens_servico:'
    );
    const { data: osTriggers, error: osError } = await supabase.rpc(
      'execute_sql',
      {
        query: `
        SELECT 
          t.trigger_name,
          t.action_statement,
          p.prosrc as function_source
        FROM information_schema.triggers t
        LEFT JOIN pg_proc p ON p.proname = REPLACE(REPLACE(t.action_statement, 'EXECUTE FUNCTION ', ''), '()', '')
        WHERE t.event_object_table = 'ordens_servico'
        AND t.trigger_schema = 'public';
      `,
      }
    );

    if (osError) {
      console.log('❌ Erro ao verificar triggers de ordens_servico:', osError);
    } else {
      osTriggers.forEach(trigger => {
        console.log(`\n🔗 Trigger: ${trigger.trigger_name}`);
        console.log(`   Ação: ${trigger.action_statement}`);

        if (trigger.function_source) {
          console.log(`   Código da função:`);
          console.log(`${trigger.function_source.substring(0, 300)  }...`);

          if (trigger.function_source.includes('cp.cliente_id')) {
            console.log(
              '⚠️  FUNÇÃO DO TRIGGER CONTÉM REFERÊNCIA PROBLEMÁTICA: cp.cliente_id'
            );
          }
        }
      });
    }
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

debugAllFunctions();
