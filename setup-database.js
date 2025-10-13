const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function setupDatabase() {
  try {
    console.log('🚀 Iniciando configuração do banco de dados Supabase...');

    // Ler o arquivo SQL
    const sqlPath = path.join(__dirname, 'create-tables.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    // Dividir o SQL em comandos individuais
    const sqlCommands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    console.log(`📝 Executando ${sqlCommands.length} comandos SQL...`);

    // Executar cada comando
    for (let i = 0; i < sqlCommands.length; i++) {
      const command = sqlCommands[i];
      if (command.trim()) {
        try {
          console.log(
            `⚡ Executando comando ${i + 1}/${sqlCommands.length}...`
          );
          await prisma.$executeRawUnsafe(command);
        } catch (error) {
          console.log(
            `⚠️  Comando ${i + 1} falhou (pode ser normal se já existir):`,
            error.message.split('\n')[0]
          );
        }
      }
    }

    console.log('\n✅ Configuração do banco concluída!');

    // Testar as tabelas criadas
    console.log('\n🔍 Verificando tabelas criadas...');

    try {
      const userCount = await prisma.user.count();
      console.log(`✅ Tabela 'users': ${userCount} registros`);
    } catch (error) {
      console.log('❌ Erro na tabela users:', error.message.split('\n')[0]);
    }

    try {
      const clienteCount = await prisma.cliente.count();
      console.log(`✅ Tabela 'clientes': ${clienteCount} registros`);
    } catch (error) {
      console.log('❌ Erro na tabela clientes:', error.message.split('\n')[0]);
    }

    try {
      const osCount = await prisma.ordemServico.count();
      console.log(`✅ Tabela 'ordens_servico': ${osCount} registros`);
    } catch (error) {
      console.log(
        '❌ Erro na tabela ordens_servico:',
        error.message.split('\n')[0]
      );
    }

    try {
      const pagamentoCount = await prisma.pagamento.count();
      console.log(`✅ Tabela 'pagamentos': ${pagamentoCount} registros`);
    } catch (error) {
      console.log(
        '❌ Erro na tabela pagamentos:',
        error.message.split('\n')[0]
      );
    }
  } catch (error) {
    console.error('❌ Erro na configuração:', error.message);
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 Desconectado do banco.');
  }
}

setupDatabase();
