// 🧪 Script para Inserir Dados de Teste
// Adiciona dados fictícios para demonstrar funcionalidade do dashboard

const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase local
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

// 📊 Dados de Teste
const clientesTest = [
  {
    nome: 'João Silva',
    email: 'joao.silva@email.com',
    telefone: '(11) 99999-1111',
    cpf_cnpj: '12.345.678/0001-90',
    endereco: 'Rua das Flores, 123',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01234-567',
    tipo_pessoa: 'juridica',
    tipo_documento: 'CNPJ',
  },
  {
    nome: 'Maria Santos',
    email: 'maria.santos@email.com',
    telefone: '(11) 99999-2222',
    cpf_cnpj: '123.456.789-01',
    endereco: 'Av. Paulista, 456',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01310-100',
    tipo_pessoa: 'fisica',
    tipo_documento: 'CPF',
  },
  {
    nome: 'Empresa ABC Ltda',
    email: 'contato@empresaabc.com',
    telefone: '(11) 99999-3333',
    cpf_cnpj: '98.765.432/0001-10',
    endereco: 'Rua do Comércio, 789',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '04567-890',
    tipo_pessoa: 'juridica',
    tipo_documento: 'CNPJ',
  },
];

const equipamentosTest = [
  {
    tipo: 'macbook_pro',
    modelo: 'MacBook Pro 13" M2',
    serial_number: 'MBP2023001',
    ano_fabricacao: 2023,
    cor: 'Space Gray',
    configuracao: 'M2, 8GB RAM, 256GB SSD',
    status_garantia: 'garantia_apple',
    data_compra: '2023-06-15',
    condicao_geral: 'bom',
    versao_sistema: 'macOS Ventura 13.4',
  },
  {
    tipo: 'ipad_air',
    modelo: 'iPad Air 5ª geração',
    serial_number: 'IPA2023002',
    ano_fabricacao: 2023,
    cor: 'Blue',
    configuracao: 'M1, 64GB WiFi',
    status_garantia: 'garantia_loja',
    data_compra: '2023-08-20',
    condicao_geral: 'excelente',
    versao_sistema: 'iPadOS 16.5',
  },
  {
    tipo: 'imac',
    modelo: 'iMac 24" M1',
    serial_number: 'IMC2022003',
    ano_fabricacao: 2022,
    cor: 'Silver',
    configuracao: 'M1, 16GB RAM, 512GB SSD',
    status_garantia: 'fora_garantia',
    data_compra: '2022-03-10',
    condicao_geral: 'regular',
    versao_sistema: 'macOS Monterey 12.6',
  },
];

async function insertTestData() {
  try {
    console.log('🚀 Iniciando inserção de dados de teste...');

    // ✅ Verificar quantos dados já existem
    const { data: existingClientes } = await supabase
      .from('clientes')
      .select('id');

    console.log(`📊 Clientes existentes: ${existingClientes?.length || 0}`);

    if (existingClientes && existingClientes.length >= 5) {
      console.log('ℹ️  Já existem dados suficientes. Pulando inserção.');
      return;
    }

    // 1. Inserir clientes
    console.log('👥 Inserindo clientes...');
    const { data: clientes, error: clientesError } = await supabase
      .from('clientes')
      .insert(clientesTest)
      .select();

    if (clientesError) {
      console.error('❌ Erro ao inserir clientes:', clientesError);
      return;
    }

    console.log(`✅ ${clientes.length} clientes inseridos`);

    // 2. Inserir equipamentos
    console.log('💻 Inserindo equipamentos...');

    const { data: equipamentos, error: equipamentosError } = await supabase
      .from('equipamentos')
      .insert(equipamentosTest)
      .select();

    if (equipamentosError) {
      console.error('❌ Erro ao inserir equipamentos:', equipamentosError);
      return;
    }

    console.log(`✅ ${equipamentos.length} equipamentos inseridos`);

    // 3. Inserir ordens de serviço
    console.log('📋 Inserindo ordens de serviço...');

    const ordensData = [
      {
        numero_os: 'OS-2024-001',
        cliente_id: clientes[0].id,
        equipamento_id: equipamentos[0].id,
        titulo: 'Reparo MacBook Pro - Teclado com defeito',
        descricao:
          'Cliente reporta que algumas teclas não funcionam corretamente',
        status: 'aberta',
        prioridade: 'media',
        tipo_servico: 'reparo',
        problema_reportado: 'Teclas H, J e K não respondem ao toque',
        valor_servico: 250.0,
      },
      {
        numero_os: 'OS-2024-002',
        cliente_id: clientes[1].id,
        equipamento_id: equipamentos[1].id,
        titulo: 'iPad Air - Tela trincada',
        descricao: 'Substituição de tela do iPad Air após queda',
        status: 'em_andamento',
        prioridade: 'alta',
        tipo_servico: 'reparo',
        problema_reportado: 'Tela com rachaduras no canto superior direito',
        valor_servico: 450.0,
      },
      {
        numero_os: 'OS-2024-003',
        cliente_id: clientes[2].id,
        equipamento_id: equipamentos[2].id,
        titulo: 'iMac - Limpeza e manutenção',
        descricao: 'Limpeza interna e atualização do sistema',
        status: 'concluida',
        prioridade: 'baixa',
        tipo_servico: 'manutencao',
        problema_reportado: 'Equipamento lento e com ruído excessivo do cooler',
        valor_servico: 180.0,
      },
    ];

    const { data: ordens, error: ordensError } = await supabase
      .from('ordens_servico')
      .insert(ordensData)
      .select();

    if (ordensError) {
      console.error('❌ Erro ao inserir ordens:', ordensError);
      return;
    }

    console.log(`✅ ${ordens.length} ordens de serviço inseridas`);

    // 4. Resumo final
    console.log('\n📊 RESUMO DOS DADOS INSERIDOS:');
    console.log(`👥 Clientes: ${clientes.length}`);
    console.log(`💻 Equipamentos: ${equipamentos.length}`);
    console.log(`📋 Ordens de Serviço: ${ordens.length}`);
    console.log('\n🎉 Dados de teste inseridos com sucesso!');
  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  insertTestData();
}

module.exports = { insertTestData };
