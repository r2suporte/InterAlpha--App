require('dotenv').config({ path: '.env' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function testCrudOperations() {
  try {
    console.log('🧪 Testando operações CRUD em todas as tabelas...\n');
    
    await prisma.$connect();
    console.log('✅ Conexão estabelecida com sucesso\n');
    
    // Teste 1: Criar e gerenciar usuário
    console.log('👤 Testando modelo User...');
    const testUser = await prisma.user.create({
      data: {
        email: `test-user-${Date.now()}@example.com`,
        name: 'Usuário de Teste',
        role: 'admin',
        phone: '(11) 99999-9999'
      }
    });
    console.log('✅ User criado:', testUser.id);
    
    // Teste 2: Criar e gerenciar cliente
    console.log('\n🏢 Testando modelo Cliente...');
    const testCliente = await prisma.cliente.create({
      data: {
        nome: 'Empresa Teste Ltda',
        email: `cliente-${Date.now()}@empresa.com`,
        telefone: '(11) 3333-4444',
        endereco: 'Rua Teste, 123',
        cidade: 'São Paulo',
        estado: 'SP',
        cep: '01234-567',
        createdBy: testUser.id
      }
    });
    console.log('✅ Cliente criado:', testCliente.id);
    
    // Teste 3: Criar ordem de serviço
    console.log('\n📋 Testando modelo OrdemServico...');
    const testOrdem = await prisma.ordemServico.create({
      data: {
        clienteId: testCliente.id,
        titulo: 'Serviço de Teste',
        descricao: 'Descrição detalhada do serviço de teste',
        status: 'pendente',
        prioridade: 'media',
        createdBy: testUser.id
      }
    });
    console.log('✅ OrdemServico criada:', testOrdem.id);
    
    // Teste 4: Criar pagamento
    console.log('\n💰 Testando modelo Pagamento...');
    const testPagamento = await prisma.pagamento.create({
      data: {
        ordemServicoId: testOrdem.id,
        valor: 1500.00,
        metodoPagamento: 'cartao_credito',
        status: 'pendente',
        createdBy: testUser.id
      }
    });
    console.log('✅ Pagamento criado:', testPagamento.id);
    
    // Teste 5: Operações de leitura
    console.log('\n📖 Testando operações de leitura...');
    
    const userCount = await prisma.user.count();
    const clienteCount = await prisma.cliente.count();
    const ordemCount = await prisma.ordemServico.count();
    const pagamentoCount = await prisma.pagamento.count();
    
    console.log(`✅ Contadores: Users(${userCount}), Clientes(${clienteCount}), Ordens(${ordemCount}), Pagamentos(${pagamentoCount})`);
    
    // Teste 6: Operações de atualização
    console.log('\n✏️ Testando operações de atualização...');
    
    await prisma.ordemServico.update({
      where: { id: testOrdem.id },
      data: { status: 'em_andamento' }
    });
    console.log('✅ OrdemServico atualizada');
    
    await prisma.pagamento.update({
      where: { id: testPagamento.id },
      data: { status: 'processando' }
    });
    console.log('✅ Pagamento atualizado');
    
    // Teste 7: Limpeza (deletar registros de teste)
    console.log('\n🧹 Limpando registros de teste...');
    
    await prisma.pagamento.delete({ where: { id: testPagamento.id } });
    console.log('✅ Pagamento deletado');
    
    await prisma.ordemServico.delete({ where: { id: testOrdem.id } });
    console.log('✅ OrdemServico deletada');
    
    await prisma.cliente.delete({ where: { id: testCliente.id } });
    console.log('✅ Cliente deletado');
    
    await prisma.user.delete({ where: { id: testUser.id } });
    console.log('✅ User deletado');
    
    console.log('\n🎉 Todos os testes CRUD passaram com sucesso!');
    console.log('✅ Schema está totalmente funcional e sincronizado!');
    
  } catch (error) {
    console.error('❌ Erro durante os testes:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testCrudOperations();