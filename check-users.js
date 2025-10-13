#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function checkUsers() {
  try {
    console.log('🔍 Verificando usuários no banco...');
    
    // Verificar usuários na tabela users
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .limit(10);
    
    if (error) {
      console.error('❌ Erro ao buscar usuários:', error);
      return;
    }
    
    console.log('👥 Usuários encontrados:', users?.length || 0);
    if (users && users.length > 0) {
      users.forEach(user => {
        console.log(`  - ${user.email} (${user.role}) - Ativo: ${user.is_active}`);
      });
    }
    
    // Verificar especificamente o admin
    const { data: admin, error: adminError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'adm@interalpha.com.br')
      .single();
    
    if (adminError && adminError.code !== 'PGRST116') {
      console.error('❌ Erro ao buscar admin:', adminError);
    } else if (admin) {
      console.log('✅ Admin encontrado:', admin);
    } else {
      console.log('⚠️  Admin não encontrado na tabela users');
    }
    
    // Verificar usuários no Supabase Auth
    console.log('\n🔍 Verificando usuários no Supabase Auth...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Erro ao buscar usuários do Auth:', authError);
    } else {
      console.log('👥 Usuários no Auth:', authUsers.users?.length || 0);
      authUsers.users?.forEach(user => {
        console.log(`  - ${user.email} - Confirmado: ${user.email_confirmed_at ? 'Sim' : 'Não'}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

checkUsers();