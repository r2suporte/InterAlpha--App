require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function investigateClienteId() {
  console.log('🔍 Investigando referências a cliente_id...\n');

  // 1. Verificar views que podem estar usando cp.cliente_id
  console.log('📋 Verificando views...');
  const { data: views, error: viewsError } = await supabase.rpc('exec_sql', {
    sql: `
        SELECT schemaname, viewname, definition 
        FROM pg_views 
        WHERE schemaname = 'public' 
        AND definition ILIKE '%cliente_id%'
      `,
  });

  if (viewsError) {
    console.log('❌ Erro ao buscar views:', viewsError);
  } else {
    console.log('Views encontradas:', views);
  }

  // 2. Verificar triggers
  console.log('\n🔧 Verificando triggers...');
  const { data: triggers, error: triggersError } = await supabase.rpc(
    'exec_sql',
    {
      sql: `
        SELECT 
          t.trigger_name,
          t.event_object_table,
          p.prosrc as trigger_function
        FROM information_schema.triggers t
        JOIN pg_proc p ON p.proname = t.action_statement
        WHERE t.event_object_schema = 'public'
        AND (t.event_object_table = 'ordens_servico' OR p.prosrc ILIKE '%cliente_id%')
      `,
    }
  );

  if (triggersError) {
    console.log('❌ Erro ao buscar triggers:', triggersError);
  } else {
    console.log('Triggers encontrados:', triggers);
  }

  // 3. Verificar funções que podem estar sendo chamadas
  console.log('\n⚙️ Verificando funções...');
  const { data: functions, error: functionsError } = await supabase.rpc(
    'exec_sql',
    {
      sql: `
        SELECT 
          proname as function_name,
          prosrc as function_body
        FROM pg_proc 
        WHERE prosrc ILIKE '%cp.cliente_id%' 
        OR prosrc ILIKE '%cliente_portal%'
      `,
    }
  );

  if (functionsError) {
    console.log('❌ Erro ao buscar funções:', functionsError);
  } else {
    console.log('Funções encontradas:', functions);
  }

  // 4. Verificar se há alguma RLS policy
  console.log('\n🔒 Verificando políticas RLS...');
  const { data: policies, error: policiesError } = await supabase.rpc(
    'exec_sql',
    {
      sql: `
        SELECT 
          schemaname,
          tablename,
          policyname,
          qual,
          with_check
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'ordens_servico'
      `,
    }
  );

  if (policiesError) {
    console.log('❌ Erro ao buscar políticas:', policiesError);
  } else {
    console.log('Políticas RLS encontradas:', policies);
  }

  // 5. Tentar inserção direta via SQL para ver o erro completo
  console.log('\n💉 Testando inserção direta via SQL...');
  const { data: insertTest, error: insertError } = await supabase.rpc(
    'exec_sql',
    {
      sql: `
        INSERT INTO public.ordens_servico (
          cliente_portal_id,
          titulo,
          descricao,
          status,
          prioridade,
          valor_servico
        ) VALUES (
          (SELECT id FROM public.clientes_portal LIMIT 1),
          'Teste SQL direto',
          'Teste de inserção via SQL',
          'aberta',
          'media',
          100.00
        ) RETURNING *;
      `,
    }
  );

  if (insertError) {
    console.log('❌ Erro na inserção SQL:', insertError);
  } else {
    console.log('✅ Inserção SQL bem-sucedida:', insertTest);
  }
}

investigateClienteId().catch(console.error);
