const { createClient } = require('@supabase/supabase-js');

// Carregar variáveis de ambiente do .env.local
require('dotenv').config({ path: '.env.local' });

async function verifyTables() {
  console.log('🔍 Verificando tabelas no Supabase...\n');

  // Verificar variáveis de ambiente
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Erro: Variáveis de ambiente do Supabase não encontradas');
    console.error('   Verifique NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  // Criar cliente Supabase
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Verificar tabela users
    console.log('📋 Verificando tabela users...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (usersError) {
      console.log(`❌ Tabela users: ${usersError.message}`);
    } else {
      console.log('✅ Tabela users: OK');
    }

    // Verificar tabela clientes
    console.log('📋 Verificando tabela clientes...');
    const { data: clientes, error: clientesError } = await supabase
      .from('clientes')
      .select('*')
      .limit(1);
    
    if (clientesError) {
      console.log(`❌ Tabela clientes: ${clientesError.message}`);
    } else {
      console.log('✅ Tabela clientes: OK');
    }

    // Verificar tabela ordens_servico
    console.log('📋 Verificando tabela ordens_servico...');
    const { data: ordens, error: ordensError } = await supabase
      .from('ordens_servico')
      .select('*')
      .limit(1);
    
    if (ordensError) {
      console.log(`❌ Tabela ordens_servico: ${ordensError.message}`);
    } else {
      console.log('✅ Tabela ordens_servico: OK');
    }

    // Verificar tabela pagamentos
    console.log('📋 Verificando tabela pagamentos...');
    const { data: pagamentos, error: pagamentosError } = await supabase
      .from('pagamentos')
      .select('*')
      .limit(1);
    
    if (pagamentosError) {
      console.log(`❌ Tabela pagamentos: ${pagamentosError.message}`);
    } else {
      console.log('✅ Tabela pagamentos: OK');
    }

    console.log('\n🎉 Verificação concluída!');

  } catch (error) {
    console.error('❌ Erro durante a verificação:', error.message);
    process.exit(1);
  }
}

verifyTables();