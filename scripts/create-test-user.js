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

async function createTestUser() {
  try {
    console.log('🧪 Criando usuário de teste...\n');

    // Dados do usuário de teste
    const testUserData = {
      email: 'teste@interalpha.com',
      password: 'teste123456',
      name: 'Usuário de Teste',
      phone: '(11) 99999-9999'
    };

    console.log('📧 Criando usuário no Supabase Auth...');
    
    // 1. Criar usuário no Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: testUserData.email,
      password: testUserData.password,
      email_confirm: true,
      user_metadata: {
        name: testUserData.name,
        phone: testUserData.phone
      }
    });

    if (authError) {
      if (authError.message.includes('already registered') || authError.code === 'email_exists') {
        console.log('⚠️ Usuário já existe no Supabase Auth');
        
        // Buscar usuário existente
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        const existingUser = existingUsers.users.find(u => u.email === testUserData.email);
        
        if (existingUser) {
          console.log('✅ Usuário encontrado no Auth!');
          console.log('👤 ID do usuário:', existingUser.id);
          
          // Verificar se existe na tabela users
          await ensureUserInTable(existingUser, testUserData);
          await createTestData();
          
          console.log('\n🎉 Configuração do usuário de teste concluída!');
          console.log('\n📋 Credenciais para login:');
          console.log('Email:', testUserData.email);
          console.log('Senha:', testUserData.password);
          console.log('\n🌐 Acesse: http://localhost:3000/auth/login');
          
          return { user: existingUser, credentials: testUserData };
        }
      } else {
        throw authError;
      }
    } else {
      console.log('✅ Usuário criado no Supabase Auth!');
      console.log('👤 ID do usuário:', authUser.user.id);
      
      // Adicionar à tabela users
      await ensureUserInTable(authUser.user, testUserData);
      await createTestData();
      
      console.log('\n🎉 Usuário de teste criado com sucesso!');
      console.log('\n📋 Credenciais para login:');
      console.log('Email:', testUserData.email);
      console.log('Senha:', testUserData.password);
      console.log('\n🌐 Acesse: http://localhost:3000/auth/login');
      
      return { user: authUser.user, credentials: testUserData };
    }

  } catch (error) {
    console.error('❌ Erro ao criar usuário de teste:', error.message);
    throw error;
  }
}

async function ensureUserInTable(authUser, userData) {
  try {
    console.log('\n👥 Verificando tabela users...');
    
    // Verificar se já existe
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('email', userData.email)
      .single();

    if (existingUser) {
      console.log('✅ Usuário já existe na tabela users');
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
          role: 'admin'
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

async function createTestData() {
  try {
    console.log('\n📊 Criando dados de teste...');

    // Buscar o usuário de teste na tabela users
    const { data: testUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'teste@interalpha.com')
      .single();

    if (userError || !testUser) {
      console.log('⚠️ Não foi possível encontrar o usuário de teste na tabela users');
      return;
    }

    console.log('👤 Usuário encontrado:', testUser.name);

    // 1. Criar clientes de teste (se não existirem)
    console.log('🏢 Verificando clientes de teste...');
    
    const { data: existingClientes } = await supabase
      .from('clientes')
      .select('*')
      .eq('created_by', testUser.id);

    if (existingClientes && existingClientes.length > 0) {
      console.log(`✅ ${existingClientes.length} clientes já existem para este usuário`);
    } else {
      // Função para gerar UUID
      function generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      }

      const clientesData = [
         {
           id: generateUUID(),
           nome: 'Empresa Alpha Ltda',
           email: 'contato@alpha.com',
           telefone: '(11) 3333-4444',
           cpf_cnpj: '12.345.678/0001-90',
           tipo_pessoa: 'juridica',
           endereco: 'Rua das Empresas, 123',
           cidade: 'São Paulo',
           estado: 'SP',
           cep: '01234-567',
           created_by: testUser.id
         },
         {
           id: generateUUID(),
           nome: 'João Silva',
           email: 'joao@email.com',
           telefone: '(11) 99999-8888',
           cpf_cnpj: '123.456.789-00',
           tipo_pessoa: 'fisica',
           endereco: 'Rua dos Clientes, 456',
           cidade: 'São Paulo',
           estado: 'SP',
           cep: '01234-568',
           created_by: testUser.id
         }
       ];

      const { data: clientes, error: clientesError } = await supabase
        .from('clientes')
        .insert(clientesData)
        .select();

      if (clientesError) {
        console.log('⚠️ Erro ao criar clientes:', clientesError.message);
      } else {
        console.log(`✅ ${clientes.length} clientes criados!`);
      }
    }

    // 2. Buscar clientes para criar ordens de serviço
    const { data: allClientes } = await supabase
      .from('clientes')
      .select('*')
      .eq('created_by', testUser.id)
      .limit(3);

    if (allClientes && allClientes.length > 0) {
      console.log('📋 Criando ordens de serviço de teste...');
      
      // Verificar se já existem ordens
      const { data: existingOrdens } = await supabase
        .from('ordens_servico')
        .select('*')
        .eq('created_by', testUser.id);

      if (existingOrdens && existingOrdens.length > 0) {
        console.log(`✅ ${existingOrdens.length} ordens de serviço já existem`);
      } else {
        const ordensData = [
          {
            id: generateUUID(),
            cliente_id: allClientes[0].id,
            titulo: 'Manutenção de Sistema',
            descricao: 'Manutenção preventiva do sistema de gestão',
            status: 'PENDENTE',
            prioridade: 'ALTA',
            valor: 1500.00,
            created_by: testUser.id
          },
          {
            id: generateUUID(),
            cliente_id: allClientes[1] ? allClientes[1].id : allClientes[0].id,
            titulo: 'Instalação de Software',
            descricao: 'Instalação e configuração de novo software',
            status: 'EM_ANDAMENTO',
            prioridade: 'MEDIA',
            valor: 800.00,
            created_by: testUser.id
          }
        ];

        const { data: ordens, error: ordensError } = await supabase
          .from('ordens_servico')
          .insert(ordensData)
          .select();

        if (ordensError) {
          console.log('⚠️ Erro ao criar ordens de serviço:', ordensError.message);
        } else {
          console.log(`✅ ${ordens.length} ordens de serviço criadas!`);
        }
      }
    }

    console.log('✅ Dados de teste configurados com sucesso!');

  } catch (error) {
    console.error('❌ Erro ao criar dados de teste:', error.message);
  }
}

// Executar o script
if (require.main === module) {
  createTestUser()
    .then(() => {
      console.log('\n🎯 Script executado com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Erro na execução do script:', error);
      process.exit(1);
    });
}

module.exports = { createTestUser, createTestData };