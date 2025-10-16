const { Pool } = require('pg');
require('dotenv').config();

async function createTables() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔍 Criando tabelas...');

    // Criar tabela users
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabela users criada');

    // Criar tabela clientes
    await pool.query(`
      CREATE TABLE IF NOT EXISTS clientes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nome VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        telefone VARCHAR(20),
        endereco TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabela clientes criada');

    // Criar tabela ordens_servico
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ordens_servico (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
        descricao TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'pendente',
        valor DECIMAL(10,2),
        data_inicio DATE,
        data_fim DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabela ordens_servico criada');

    // Criar tabela pagamentos
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pagamentos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ordem_servico_id UUID REFERENCES ordens_servico(id) ON DELETE CASCADE,
        valor DECIMAL(10,2) NOT NULL,
        status VARCHAR(50) DEFAULT 'pendente',
        metodo_pagamento VARCHAR(50),
        data_pagamento TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabela pagamentos criada');

    // Verificar se as tabelas foram criadas
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    console.log('\n📋 Tabelas criadas com sucesso:');
    result.rows.forEach(row => {
      console.log(`✅ ${row.table_name}`);
    });
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
    console.log('🔌 Desconectado do banco.');
  }
}

createTables();
