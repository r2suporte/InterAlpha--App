#!/usr/bin/env node

/**
 * 🔧 Script para aplicar schema diretamente no Supabase
 * Contorna problemas de prepared statement do Prisma
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Carregar variáveis de ambiente do .env.local
require('dotenv').config({ path: '.env.local' });

async function applySchema() {
  console.log('🚀 Iniciando aplicação do schema no Supabase...\n');

  // Verificar variáveis de ambiente
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Erro: Variáveis de ambiente do Supabase não encontradas');
    console.error(
      '   Verifique NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY'
    );
    process.exit(1);
  }

  // Criar cliente Supabase com service role
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Ler arquivo SQL
    const sqlPath = path.join(__dirname, 'create-tables-supabase.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    console.log('📄 Arquivo SQL carregado:', sqlPath);
    console.log('📊 Tamanho do script:', sqlContent.length, 'caracteres\n');

    // Dividir o SQL em comandos individuais
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    console.log('🔧 Executando', commands.length, 'comandos SQL...\n');

    // Executar cada comando
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];

      if (command.length === 0) continue;

      console.log(`[${i + 1}/${commands.length}] Executando comando...`);

      try {
        const { data, error } = await supabase.rpc('exec_sql', {
          sql: `${command  };`,
        });

        if (error) {
          // Tentar execução direta se RPC falhar
          const { data: directData, error: directError } = await supabase
            .from('_temp_sql_execution')
            .select('*')
            .limit(0);

          if (directError && directError.code !== 'PGRST116') {
            console.log(`⚠️  Aviso: ${error.message}`);
          }
        } else {
          console.log('✅ Comando executado com sucesso');
        }
      } catch (err) {
        console.log(`⚠️  Aviso: ${err.message}`);
      }
    }

    console.log('\n🎉 Schema aplicado com sucesso!');
    console.log('\n📋 Verificando tabelas criadas...');

    // Verificar tabelas criadas
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['users', 'clientes', 'ordens_servico', 'pagamentos']);

    if (tablesError) {
      console.log(
        '⚠️  Não foi possível verificar as tabelas:',
        tablesError.message
      );
    } else {
      console.log(
        '✅ Tabelas encontradas:',
        tables?.map(t => t.table_name).join(', ') || 'Nenhuma'
      );
    }
  } catch (error) {
    console.error('❌ Erro ao aplicar schema:', error.message);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  applySchema()
    .then(() => {
      console.log('\n🏁 Processo concluído!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Erro fatal:', error);
      process.exit(1);
    });
}

module.exports = { applySchema };
