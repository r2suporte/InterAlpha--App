require('dotenv').config({ path: '.env' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function checkSchemaDifferences() {
  try {
    console.log('🔍 Verificando diferenças no schema...');

    await prisma.$connect();
    console.log('✅ Conexão estabelecida');

    // Verificar estrutura das tabelas existentes
    const tablesInfo = await prisma.$queryRaw`
      SELECT 
        table_name,
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'clientes', 'ordens_servico', 'pagamentos')
      ORDER BY table_name, ordinal_position;
    `;

    console.log('\n📋 Estrutura atual das tabelas no banco:');

    const tablesByName = {};
    tablesInfo.forEach(col => {
      if (!tablesByName[col.table_name]) {
        tablesByName[col.table_name] = [];
      }
      tablesByName[col.table_name].push({
        name: col.column_name,
        type: col.data_type,
        nullable: col.is_nullable === 'YES',
        default: col.column_default,
      });
    });

    Object.keys(tablesByName).forEach(tableName => {
      console.log(`\n🗂️  Tabela: ${tableName}`);
      tablesByName[tableName].forEach(col => {
        console.log(
          `   - ${col.name}: ${col.type} ${col.nullable ? '(nullable)' : '(not null)'} ${col.default ? `default: ${col.default}` : ''}`
        );
      });
    });

    // Verificar colunas esperadas pelo Prisma
    console.log('\n🎯 Colunas esperadas pelo schema Prisma:');
    console.log('\n🗂️  Tabela: users');
    console.log('   - id: String (cuid)');
    console.log('   - supabaseId: String (unique)');
    console.log('   - email: String (unique)');
    console.log('   - name: String (nullable)');
    console.log('   - phone: String (nullable)');
    console.log('   - createdAt: DateTime');
    console.log('   - updatedAt: DateTime');

    console.log('\n🗂️  Tabela: clientes');
    console.log('   - id: String (cuid)');
    console.log('   - nome: String');
    console.log('   - email: String');
    console.log('   - telefone: String (nullable)');
    console.log('   - documento: String (unique)');
    console.log('   - tipoDocumento: String');
    console.log('   - cep: String (nullable)');
    console.log('   - endereco: String (nullable)');
    console.log('   - cidade: String (nullable)');
    console.log('   - estado: String (nullable)');
    console.log('   - observacoes: String (nullable)');
    console.log('   - userId: String');
    console.log('   - createdAt: DateTime');
    console.log('   - updatedAt: DateTime');
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkSchemaDifferences();
