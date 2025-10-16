const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugInsert() {
  try {
    console.log('🔍 Debug da inserção...\n');

    // Primeiro, vamos verificar se existe um cliente portal
    let { data: clientePortal, error: clienteError } = await supabase
      .from('clientes_portal')
      .select('*')
      .limit(1)
      .single();

    if (clienteError && clienteError.code === 'PGRST116') {
      // Não há clientes portal, vamos criar um
      console.log('📝 Criando cliente portal para teste...');

      const { data: novoCliente, error: erroNovoCliente } = await supabase
        .from('clientes_portal')
        .insert({
          nome: 'Cliente Teste Debug',
          email: 'teste.debug@example.com',
          telefone: '11999999999',
          login: 'teste.debug',
          senha_hash: 'hash_teste_123',
        })
        .select()
        .single();

      if (erroNovoCliente) {
        console.error('❌ Erro ao criar cliente portal:', erroNovoCliente);
        return;
      }

      clientePortal = novoCliente;
      console.log('✅ Cliente portal criado:', clientePortal.nome);
    } else if (clienteError) {
      console.error('❌ Erro ao buscar cliente portal:', clienteError);
      return;
    } else {
      console.log('✅ Cliente portal encontrado:', clientePortal.nome);
    }

    // Agora vamos tentar inserir com dados mínimos
    console.log('\n🧪 Tentando inserção com dados mínimos...');

    const dadosMinimos = {
      cliente_portal_id: clientePortal.id,
      titulo: 'Teste Debug',
      descricao: 'Teste de debug',
      status: 'aberta',
    };

    console.log('📋 Dados para inserção:', dadosMinimos);

    const { data: resultado, error: erroInsercao } = await supabase
      .from('ordens_servico')
      .insert(dadosMinimos)
      .select();

    if (erroInsercao) {
      console.error('❌ Erro na inserção:', erroInsercao);

      // Vamos tentar com cliente_id nulo explícito
      console.log('\n🔄 Tentando com cliente_id explicitamente nulo...');

      const dadosComClienteIdNulo = {
        ...dadosMinimos,
        cliente_id: null,
      };

      const { data: resultado2, error: erroInsercao2 } = await supabase
        .from('ordens_servico')
        .insert(dadosComClienteIdNulo)
        .select();

      if (erroInsercao2) {
        console.error('❌ Erro na segunda tentativa:', erroInsercao2);
      } else {
        console.log('✅ Segunda tentativa bem-sucedida:', resultado2);
      }
    } else {
      console.log('✅ Inserção bem-sucedida:', resultado);
    }
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

debugInsert();
