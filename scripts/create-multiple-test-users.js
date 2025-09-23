require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas!');
  console.log('Certifique-se de que NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão definidas no .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Dados dos usuários de teste
const testUsers = [
  {
    email: 'funcionario@interalpha.com',
    password: 'funcionario123',
    name: 'João Funcionário',
    phone: '(11) 98888-7777',
    role: 'technician'
  },
  {
    email: 'cliente@interalpha.com',
    password: 'cliente123',
    name: 'Maria Cliente',
    phone: '(11) 97777-6666',
    role: 'user'
  }
];

async function createMultipleTestUsers() {
  try {
    console.log('🧪 Criando múltiplos usuários de teste...\n');

    for (const userData of testUsers) {
      console.log(`📧 Criando usuário: ${userData.name} (${userData.role})...`);
      
      // 1. Criar usuário no Supabase Auth
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          name: userData.name,
          phone: userData.phone,
          role: userData.role
        }
      });

      if (authError) {
        if (authError.message.includes('already registered') || authError.code === 'email_exists') {
          console.log(`⚠️ Usuário ${userData.email} já existe no Supabase Auth`);
          
          // Buscar usuário existente
          const { data: existingUsers } = await supabase.auth.admin.listUsers();
          const existingUser = existingUsers.users.find(u => u.email === userData.email);
          
          if (existingUser) {
            console.log('✅ Usuário encontrado no Auth!');
            console.log('👤 ID do usuário:', existingUser.id);
            
            // Verificar se existe na tabela users
            await ensureUserInTable(existingUser, userData);
          }
        } else {
          console.error(`❌ Erro ao criar usuário ${userData.email}:`, authError.message);
          continue;
        }
      } else {
        console.log('✅ Usuário criado no Supabase Auth!');
        console.log('👤 ID do usuário:', authUser.user.id);
        
        // Adicionar à tabela users
        await ensureUserInTable(authUser.user, userData);
      }

      console.log(`✅ Usuário ${userData.name} configurado com sucesso!\n`);
    }

    console.log('🎉 Todos os usuários de teste foram criados!\n');
    console.log('📋 Credenciais para login:\n');
    
    testUsers.forEach(user => {
      console.log(`${user.role.toUpperCase()}:`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Senha: ${user.password}\n`);
    });
    
    console.log('🌐 Acesse: http://localhost:3000/auth/login');

  } catch (error) {
    console.error('❌ Erro ao criar usuários de teste:', error.message);
    throw error;
  }
}

async function ensureUserInTable(authUser, userData) {
  try {
    console.log('👥 Verificando tabela users...');
    
    // Verificar se já existe
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('email', userData.email)
      .single();

    if (existingUser) {
      console.log('✅ Usuário já existe na tabela users');
      
      // Atualizar role se necessário
      if (existingUser.role !== userData.role) {
        const { error: updateError } = await supabase
          .from('users')
          .update({ role: userData.role })
          .eq('email', userData.email);
          
        if (updateError) {
          console.log('⚠️ Erro ao atualizar role:', updateError.message);
        } else {
          console.log(`✅ Role atualizada para: ${userData.role}`);
        }
      }
      
      return existingUser;
    }

    // Criar novo registro
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([
        {
          email: userData.email,
          name: userData.name,
          phone: userData.phone,
          role: userData.role
        }
      ])
      .select()
      .single();

    if (insertError) {
      console.log('⚠️ Erro ao criar registro na tabela users:', insertError.message);
      return null;
    } else {
      console.log('✅ Registro criado na tabela users!');
      return newUser;
    }

  } catch (error) {
    console.error('❌ Erro ao verificar/criar usuário na tabela:', error.message);
    return null;
  }
}

// Executar o script
if (require.main === module) {
  createMultipleTestUsers()
    .then(() => {
      console.log('\n🎯 Script executado com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Erro na execução do script:', error);
      process.exit(1);
    });
}

module.exports = { createMultipleTestUsers };