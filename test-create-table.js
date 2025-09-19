const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testCreateTable() {
  try {
    console.log('🔍 Testando criação de tabela simples...');
    
    // Tentar criar uma tabela de teste simples
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS test_table (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    await prisma.$executeRawUnsafe(createTableSQL);
    console.log('✅ Tabela de teste criada com sucesso!');
    
    // Verificar se a tabela foi criada
    const result = await prisma.$queryRawUnsafe(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'test_table';
    `);
    
    console.log('📊 Resultado da consulta:', result);
    
    // Listar todas as tabelas
    const allTables = await prisma.$queryRawUnsafe(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('📋 Todas as tabelas no schema public:');
    allTables.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 Desconectado do banco.');
  }
}

testCreateTable();