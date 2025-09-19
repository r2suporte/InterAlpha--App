require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkData() {
  try {
    console.log('🔍 Verificando dados existentes...\n');
    
    // Verificar usuários
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*');
    
    if (usersError) {
      console.log('❌ Erro ao buscar usuários:', usersError.message);
    } else {
      console.log('👥 Usuários existentes:', users.length);
      users.forEach(user => {
        console.log(`- ID: ${user.id}, Email: ${user.email}, Nome: ${user.name}`);
      });
    }
    
    // Verificar clientes
    const { data: clientes, error: clientesError } = await supabase
      .from('clientes')
      .select('*');
    
    if (clientesError) {
      console.log('❌ Erro ao buscar clientes:', clientesError.message);
    } else {
      console.log('\n🏢 Clientes existentes:', clientes.length);
      clientes.forEach(cliente => {
        console.log(`- ID: ${cliente.id}, Nome: ${cliente.nome}, Email: ${cliente.email}`);
      });
    }
    
    // Verificar ordens de serviço
    const { data: ordens, error: ordensError } = await supabase
      .from('ordens_servico')
      .select('*');
    
    if (ordensError) {
      console.log('❌ Erro ao buscar ordens:', ordensError.message);
    } else {
      console.log('\n📋 Ordens de serviço existentes:', ordens.length);
      ordens.forEach(ordem => {
        console.log(`- ID: ${ordem.id}, Título: ${ordem.titulo}, Status: ${ordem.status}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

checkData();