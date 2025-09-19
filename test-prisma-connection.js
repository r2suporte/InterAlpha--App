const { PrismaClient } = require('@prisma/client');

// Carregar variáveis de ambiente
require('dotenv').config();

const prisma = new PrismaClient();

async function testConnection() {
  console.log('🔍 Testando conexão do Prisma...\n');

  try {
    // Teste 1: Verificar conexão básica
    console.log('📡 Testando conexão básica...');
    await prisma.$connect();
    console.log('✅ Conexão estabelecida com sucesso!');

    // Teste 2: Contar registros em cada tabela
    console.log('\n📊 Verificando tabelas...');
    
    const usersCount = await prisma.user.count();
    console.log(`👥 Users: ${usersCount} registros`);

    const clientesCount = await prisma.cliente.count();
    console.log(`🏢 Clientes: ${clientesCount} registros`);

    const ordensCount = await prisma.ordemServico.count();
    console.log(`📋 Ordens de Serviço: ${ordensCount} registros`);

    const pagamentosCount = await prisma.pagamento.count();
    console.log(`💰 Pagamentos: ${pagamentosCount} registros`);

    console.log('\n🎉 Todos os testes passaram! O Prisma está funcionando corretamente.');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
    
    if (error.message.includes('prepared statement')) {
      console.log('\n💡 Dica: O erro de "prepared statement" pode ser resolvido reiniciando a aplicação.');
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 Conexão encerrada.');
  }
}

testConnection();