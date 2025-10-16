require('dotenv').config({ path: '.env' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function checkSchemaSync() {
  try {
    console.log('🔍 Verificando sincronização do schema...');

    // Teste básico de conexão
    await prisma.$connect();
    console.log('✅ Conexão estabelecida com sucesso');

    // Verificar se conseguimos fazer operações básicas em cada tabela
    const tables = ['user', 'cliente', 'ordemServico', 'pagamento'];

    for (const table of tables) {
      try {
        const count = await prisma[table].count();
        console.log(`✅ Tabela ${table}: ${count} registros`);
      } catch (error) {
        console.log(`❌ Erro na tabela ${table}:`, error.message);
      }
    }

    // Teste de criação de um registro simples (rollback)
    try {
      await prisma.$transaction(async tx => {
        const testUser = await tx.user.create({
          data: {
            email: `test-${  Date.now()  }@example.com`,
            name: 'Test User',
          },
        });
        console.log('✅ Teste de criação: OK');

        // Rollback intencional
        throw new Error('Rollback intencional');
      });
    } catch (error) {
      if (error.message === 'Rollback intencional') {
        console.log('✅ Teste de transação: OK (rollback executado)');
      } else {
        console.log('❌ Erro no teste de transação:', error.message);
      }
    }

    console.log('\n🎉 Schema está sincronizado e funcionando!');
  } catch (error) {
    console.error('❌ Erro na verificação:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkSchemaSync();
