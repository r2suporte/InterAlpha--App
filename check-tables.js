const { Pool } = require('pg');
require('dotenv').config();

async function checkTables() {
  const pool = new Pool({
    connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
  });

  try {
    console.log('🔍 Verificando tabelas existentes...');

    // Listar todas as tabelas no schema public
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    console.log('📋 Tabelas encontradas:');
    if (result.rows.length === 0) {
      console.log('❌ Nenhuma tabela encontrada no schema public');
    } else {
      result.rows.forEach(row => {
        console.log(`✅ ${row.table_name}`);
      });
    }

    // Verificar se as tabelas específicas existem
    const expectedTables = [
      'users',
      'clientes',
      'ordens_servico',
      'pagamentos',
    ];
    console.log('\n🎯 Verificando tabelas específicas:');

    for (const tableName of expectedTables) {
      const tableCheck = await pool.query(
        `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );
      `,
        [tableName]
      );

      const {exists} = tableCheck.rows[0];
      console.log(
        `${exists ? '✅' : '❌'} ${tableName}: ${exists ? 'existe' : 'não existe'}`
      );
    }
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
    console.log('🔌 Desconectado do banco.');
  }
}

checkTables();
