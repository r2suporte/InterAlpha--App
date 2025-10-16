require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function verifyTableStructure() {
  try {
    console.log('🔍 Verificando estrutura das tabelas...\n');

    // Verificar tabela Users
    console.log('👤 Tabela Users:');
    const users = await prisma.user.findMany({ take: 1 });
    if (users.length > 0) {
      console.log('✅ Estrutura:', Object.keys(users[0]));
    } else {
      console.log('⚠️ Tabela vazia, mas existe');
    }

    // Verificar tabela Clientes
    console.log('\n🏢 Tabela Clientes:');
    const clientes = await prisma.cliente.findMany({ take: 1 });
    if (clientes.length > 0) {
      console.log('✅ Estrutura:', Object.keys(clientes[0]));
    } else {
      console.log('⚠️ Tabela vazia, mas existe');
    }

    // Verificar tabela OrdemServico
    console.log('\n📋 Tabela OrdemServico:');
    const ordens = await prisma.ordemServico.findMany({ take: 1 });
    if (ordens.length > 0) {
      console.log('✅ Estrutura:', Object.keys(ordens[0]));
    } else {
      console.log('⚠️ Tabela vazia, mas existe');
    }

    // Verificar tabela Pagamentos
    console.log('\n💰 Tabela Pagamentos:');
    const pagamentos = await prisma.pagamento.findMany({ take: 1 });
    if (pagamentos.length > 0) {
      console.log('✅ Estrutura:', Object.keys(pagamentos[0]));
    } else {
      console.log('⚠️ Tabela vazia, mas existe');
    }

    // Contar registros
    console.log('\n📊 Contadores de registros:');
    const userCount = await prisma.user.count();
    const clienteCount = await prisma.cliente.count();
    const ordemCount = await prisma.ordemServico.count();
    const pagamentoCount = await prisma.pagamento.count();

    console.log(`👤 Users: ${userCount}`);
    console.log(`🏢 Clientes: ${clienteCount}`);
    console.log(`📋 Ordens de Serviço: ${ordemCount}`);
    console.log(`💰 Pagamentos: ${pagamentoCount}`);

    console.log('\n✅ Verificação da estrutura concluída!');

  } catch (error) {
    console.error('❌ Erro ao verificar estrutura:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifyTableStructure();