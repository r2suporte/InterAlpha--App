const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTableStructure() {
  try {
    console.log('🔍 Verificando estrutura da tabela ordens_servico...\n');

    // Verificar colunas e suas constraints
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, is_nullable, data_type, column_default')
      .eq('table_name', 'ordens_servico')
      .eq('table_schema', 'public');

    if (columnsError) {
      console.error('❌ Erro ao buscar colunas:', columnsError);
    } else {
      console.log('📋 Colunas da tabela:');
      columns.forEach(col => {
        if (col.column_name === 'cliente_id' || col.column_name === 'cliente_portal_id') {
          console.log(`  - ${col.column_name}: ${col.data_type}, nullable: ${col.is_nullable}, default: ${col.column_default}`);
        }
      });
    }

    // Verificar constraints
    const { data: constraints, error: constraintsError } = await supabase
      .from('information_schema.table_constraints')
      .select('constraint_name, constraint_type')
      .eq('table_name', 'ordens_servico')
      .eq('table_schema', 'public');

    if (constraintsError) {
      console.error('❌ Erro ao buscar constraints:', constraintsError);
    } else {
      console.log('\n🔒 Constraints da tabela:');
      constraints.forEach(constraint => {
        console.log(`  - ${constraint.constraint_name}: ${constraint.constraint_type}`);
      });
    }

    // Verificar constraint específica
    const { data: checkConstraints, error: checkError } = await supabase
      .from('information_schema.check_constraints')
      .select('constraint_name, check_clause')
      .eq('constraint_schema', 'public');

    if (checkError) {
      console.error('❌ Erro ao buscar check constraints:', checkError);
    } else {
      console.log('\n✅ Check constraints:');
      checkConstraints
        .filter(c => c.constraint_name.includes('cliente'))
        .forEach(constraint => {
          console.log(`  - ${constraint.constraint_name}: ${constraint.check_clause}`);
        });
    }

    // Tentar inserção direta via SQL
    console.log('\n🧪 Testando inserção direta via SQL...');
    const { data: insertResult, error: insertError } = await supabase.rpc('exec_sql', {
      sql: `
        INSERT INTO ordens_servico (
          cliente_portal_id, 
          titulo, 
          descricao, 
          status, 
          prioridade, 
          valor_servico
        ) VALUES (
          '3fef921d-5e1d-408c-9937-3385df3d54d7',
          'Teste SQL direto',
          'Teste de inserção via SQL',
          'aberta',
          'media',
          100.00
        ) RETURNING id, numero_os, cliente_id, cliente_portal_id;
      `
    });

    if (insertError) {
      console.error('❌ Erro na inserção SQL:', insertError);
    } else {
      console.log('✅ Inserção SQL bem-sucedida:', insertResult);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkTableStructure();