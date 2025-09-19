require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function investigateReferences() {
  console.log('🔍 Investigando referências a cp.cliente_id...\n');

  try {
    // 1. Buscar views que referenciam cp.cliente_id
    console.log('1. Buscando views...');
    const { data: views, error: viewsError } = await supabase.rpc('exec_sql', {
      sql: `SELECT schemaname, viewname, definition FROM pg_views WHERE definition ILIKE '%cp.cliente_id%'`
    });
    
    if (viewsError) {
      console.log('Erro ao buscar views:', viewsError);
    } else {
      console.log('Views encontradas:', views);
    }

    // 2. Buscar funções que referenciam cp.cliente_id
    console.log('\n2. Buscando funções...');
    const { data: functions, error: functionsError } = await supabase.rpc('exec_sql', {
      sql: `SELECT proname, prosrc FROM pg_proc WHERE prosrc ILIKE '%cp.cliente_id%'`
    });
    
    if (functionsError) {
      console.log('Erro ao buscar funções:', functionsError);
    } else {
      console.log('Funções encontradas:', functions);
    }

    // 3. Buscar políticas RLS
    console.log('\n3. Buscando políticas RLS...');
    const { data: policies, error: policiesError } = await supabase.rpc('exec_sql', {
      sql: `SELECT schemaname, tablename, policyname, qual FROM pg_policies WHERE qual ILIKE '%cp.cliente_id%'`
    });
    
    if (policiesError) {
      console.log('Erro ao buscar políticas:', policiesError);
    } else {
      console.log('Políticas encontradas:', policies);
    }

    // 4. Buscar triggers
    console.log('\n4. Buscando triggers...');
    const { data: triggers, error: triggersError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT t.tgname, c.relname, p.prosrc
        FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        JOIN pg_proc p ON t.tgfoid = p.oid
        WHERE p.prosrc ILIKE '%cp.cliente_id%'
      `
    });
    
    if (triggersError) {
      console.log('Erro ao buscar triggers:', triggersError);
    } else {
      console.log('Triggers encontrados:', triggers);
    }

    // 5. Buscar qualquer referência a "cp." em geral
    console.log('\n5. Buscando referências gerais a "cp."...');
    const { data: generalRefs, error: generalError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 'view' as type, viewname as name, definition as content FROM pg_views WHERE definition ILIKE '%cp.%'
        UNION ALL
        SELECT 'function' as type, proname as name, prosrc as content FROM pg_proc WHERE prosrc ILIKE '%cp.%'
        UNION ALL
        SELECT 'policy' as type, policyname as name, qual as content FROM pg_policies WHERE qual ILIKE '%cp.%'
      `
    });
    
    if (generalError) {
      console.log('Erro ao buscar referências gerais:', generalError);
    } else {
      console.log('Referências gerais encontradas:', generalRefs);
    }

  } catch (error) {
    console.error('Erro geral:', error);
  }
}

investigateReferences();