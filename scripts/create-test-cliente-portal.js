require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas!');
  console.log(
    'Certifique-se de que NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão definidas no .env.local'
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createTestClientePortal() {
  try {
    console.log('🧪 Criando cliente de teste para o portal...\n');

    // Dados do cliente de teste
    const testClienteData = {
      nome: 'João Silva',
      email: 'joao.silva@empresa.com',
      telefone: '(11) 98765-4321',
      login: 'joao_silva',
      senha: 'teste123',
    };

    console.log('🏢 Verificando se cliente já existe...');

    // Verificar se cliente já existe
    const { data: clienteExistente, error: errorBusca } = await supabase
      .from('clientes_portal')
      .select('*')
      .eq('email', testClienteData.email)
      .single();

    if (clienteExistente) {
      console.log('⚠️ Cliente já existe no portal!');
      console.log('✅ Cliente encontrado:', clienteExistente.nome);

      // Criar dados de teste para este cliente
      await createTestDataForCliente(clienteExistente);

      console.log('\n🎉 Dados de teste atualizados!');
      console.log('\n📋 Credenciais para login:');
      console.log('Login:', clienteExistente.login);
      console.log('Senha:', clienteExistente.senha_temporaria || 'teste123');
      console.log('\n🌐 Acesse: http://localhost:3000/portal/cliente/login');

      return { cliente: clienteExistente };
    }

    // Criar hash da senha
    const senhaHash = await bcrypt.hash(testClienteData.senha, 12);

    console.log('👤 Criando cliente no portal...');

    // Criar cliente no portal
    const { data: novoCliente, error: errorCriacao } = await supabase
      .from('clientes_portal')
      .insert({
        nome: testClienteData.nome,
        email: testClienteData.email,
        telefone: testClienteData.telefone,
        login: testClienteData.login,
        senha_hash: senhaHash,
        senha_temporaria: testClienteData.senha,
        primeiro_acesso: true,
        ativo: true,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (errorCriacao) {
      console.error('❌ Erro ao criar cliente:', errorCriacao);
      throw errorCriacao;
    }

    console.log('✅ Cliente criado no portal!');
    console.log('👤 ID do cliente:', novoCliente.id);

    // Criar dados de teste
    await createTestDataForCliente(novoCliente);

    console.log('\n🎉 Cliente de teste criado com sucesso!');
    console.log('\n📋 Credenciais para login:');
    console.log('Login:', testClienteData.login);
    console.log('Senha:', testClienteData.senha);
    console.log('\n🌐 Acesse: http://localhost:3000/portal/cliente/login');

    return { cliente: novoCliente, credenciais: testClienteData };
  } catch (error) {
    console.error('❌ Erro ao criar cliente de teste:', error.message);
    throw error;
  }
}

async function createTestDataForCliente(cliente) {
  try {
    console.log('\n📊 Criando dados de teste para o cliente...');

    // 1. Criar ordens de serviço de teste
    console.log('📋 Criando ordens de serviço...');

    // Primeiro, vamos buscar um cliente existente ou criar um
    const clienteExistente = await supabase
      .from('clientes')
      .select('id')
      .limit(1)
      .single();

    let clienteId;
    if (clienteExistente.error) {
      // Criar um cliente se não existir
      const novoCliente = await supabase
        .from('clientes')
        .insert({
          nome: 'João Silva',
          email: 'joao.silva@email.com',
          telefone: '(11) 99999-9999',
          cpf_cnpj: '123.456.789-00',
          endereco: 'Rua das Flores, 123',
          cidade: 'São Paulo',
          estado: 'SP',
          cep: '01234-567',
        })
        .select('id')
        .single();

      if (novoCliente.error) {
        console.error('Erro ao criar cliente:', novoCliente.error);
        return;
      }
      clienteId = novoCliente.data.id;
    } else {
      clienteId = clienteExistente.data.id;
    }

    const ordensData = [
      {
        numero_os: 'OS-2025-001',
        cliente_id: clienteId, // Campo obrigatório
        titulo: 'Manutenção Ar Condicionado', // Campo obrigatório
        descricao:
          'Manutenção preventiva completa do sistema de ar condicionado central',
        status: 'em_andamento',
        prioridade: 'media',
        valor_servico: 850.0,
        data_abertura: new Date().toISOString(),
        data_inicio: new Date().toISOString(),
        cliente_portal_id: cliente.id,
        created_at: new Date().toISOString(),
      },
      {
        numero_os: 'OS-2025-002',
        cliente_id: clienteId, // Campo obrigatório
        titulo: 'Reparo Quadro Elétrico', // Campo obrigatório
        descricao:
          'Reparo no quadro elétrico principal - substituição de disjuntores',
        status: 'aguardando_aprovacao',
        prioridade: 'alta',
        valor_servico: 1200.0,
        data_abertura: new Date(
          Date.now() - 2 * 24 * 60 * 60 * 1000
        ).toISOString(), // 2 dias atrás
        data_inicio: new Date(
          Date.now() - 2 * 24 * 60 * 60 * 1000
        ).toISOString(),
        cliente_portal_id: cliente.id,
        created_at: new Date(
          Date.now() - 2 * 24 * 60 * 60 * 1000
        ).toISOString(),
      },
      {
        numero_os: 'OS-2025-003',
        cliente_id: clienteId, // Campo obrigatório
        titulo: 'Instalação Sistema Segurança', // Campo obrigatório
        descricao: 'Instalação de câmeras de segurança e sistema de alarme',
        status: 'concluida',
        prioridade: 'baixa',
        valor_servico: 2500.0,
        data_abertura: new Date(
          Date.now() - 7 * 24 * 60 * 60 * 1000
        ).toISOString(), // 7 dias atrás
        data_inicio: new Date(
          Date.now() - 7 * 24 * 60 * 60 * 1000
        ).toISOString(),
        data_conclusao: new Date(
          Date.now() - 1 * 24 * 60 * 60 * 1000
        ).toISOString(), // 1 dia atrás
        cliente_portal_id: cliente.id,
        created_at: new Date(
          Date.now() - 7 * 24 * 60 * 60 * 1000
        ).toISOString(),
      },
    ];

    // Verificar se ordens já existem
    const { data: ordensExistentes } = await supabase
      .from('ordens_servico')
      .select('*')
      .eq('cliente_portal_id', cliente.id);

    if (ordensExistentes && ordensExistentes.length > 0) {
      console.log(
        `✅ ${ordensExistentes.length} ordens de serviço já existem para este cliente`
      );
    } else {
      const { data: novasOrdens, error: errorOrdens } = await supabase
        .from('ordens_servico')
        .insert(ordensData)
        .select();

      if (errorOrdens) {
        console.error('❌ Erro ao criar ordens de serviço:', errorOrdens);
      } else {
        console.log(`✅ ${novasOrdens.length} ordens de serviço criadas!`);

        // 2. Criar aprovações de teste para a segunda ordem
        const ordemAprovacao = novasOrdens.find(
          o => o.status === 'aguardando_aprovacao'
        );
        if (ordemAprovacao) {
          console.log('📝 Criando aprovação de orçamento...');

          const { error: errorAprovacao } = await supabase
            .from('cliente_aprovacoes')
            .insert({
              ordem_servico_id: ordemAprovacao.id,
              tipo: 'orcamento',
              descricao: 'Orçamento para reparo do sistema elétrico',
              valor: 1200.0,
              status: 'pendente',
              expires_at: new Date(
                Date.now() + 7 * 24 * 60 * 60 * 1000
              ).toISOString(), // 7 dias
              created_at: new Date().toISOString(),
            });

          if (errorAprovacao) {
            console.error('❌ Erro ao criar aprovação:', errorAprovacao);
          } else {
            console.log('✅ Aprovação de orçamento criada!');
          }
        }

        // 3. Criar comunicações de teste
        console.log('💬 Criando comunicações...');

        const comunicacoesData = novasOrdens.map(ordem => ({
          ordem_servico_id: ordem.id,
          cliente_portal_id: cliente.id,
          tipo: 'email',
          canal: 'email',
          conteudo: `Ordem de serviço ${ordem.numero_os} foi criada e está ${ordem.status}`,
          status: 'enviado',
          enviado_em: ordem.created_at,
          created_at: ordem.created_at,
        }));

        const { error: errorComunicacoes } = await supabase
          .from('comunicacoes_cliente')
          .insert(comunicacoesData);

        if (errorComunicacoes) {
          console.error('❌ Erro ao criar comunicações:', errorComunicacoes);
        } else {
          console.log(`✅ ${comunicacoesData.length} comunicações criadas!`);
        }
      }
    }

    console.log('✅ Dados de teste criados com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao criar dados de teste:', error.message);
  }
}

// Executar o script
if (require.main === module) {
  createTestClientePortal()
    .then(() => {
      console.log('\n🎯 Script executado com sucesso!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Erro na execução do script:', error);
      process.exit(1);
    });
}

module.exports = { createTestClientePortal };
