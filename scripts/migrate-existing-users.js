require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas!');
  console.log(
    'Certifique-se de que NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão definidas no .env.local'
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Mapeamento de roles antigas para novas
const ROLE_MIGRATION_MAP = {
  // Roles antigas -> Novas roles
  admin: 'admin',
  user: 'user',
  technician: 'technician',
  tecnico: 'technician', // Normalizar variações
  atendente: 'atendente',
  manager: 'gerente_adm',
  gerente: 'gerente_adm',
  supervisor: 'supervisor_tecnico',
  diretor: 'diretor',
  gerente_adm: 'gerente_adm',
  gerente_financeiro: 'gerente_financeiro',
  supervisor_tecnico: 'supervisor_tecnico',
};

// Roles válidas no novo sistema
const VALID_ROLES = [
  'admin',
  'diretor',
  'gerente_adm',
  'gerente_financeiro',
  'supervisor_tecnico',
  'technician',
  'atendente',
  'user',
];

async function migrateExistingUsers() {
  try {
    console.log('🔄 Iniciando migração de usuários existentes...\n');

    // 1. Buscar todos os usuários existentes
    console.log('📋 Buscando usuários existentes...');
    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('id, email, name, role, phone, created_at, updated_at');

    if (fetchError) {
      throw new Error(`Erro ao buscar usuários: ${fetchError.message}`);
    }

    if (!users || users.length === 0) {
      console.log('ℹ️ Nenhum usuário encontrado para migrar.');
      return;
    }

    console.log(`✅ Encontrados ${users.length} usuários para migrar\n`);

    // 2. Analisar roles existentes
    const roleStats = {};
    users.forEach(user => {
      const currentRole = user.role || 'user';
      roleStats[currentRole] = (roleStats[currentRole] || 0) + 1;
    });

    console.log('📊 Estatísticas de roles atuais:');
    Object.entries(roleStats).forEach(([role, count]) => {
      const newRole = ROLE_MIGRATION_MAP[role] || 'atendente';
      console.log(`   ${role} (${count} usuários) → ${newRole}`);
    });
    console.log('');

    // 3. Confirmar migração
    console.log(
      '⚠️ Esta operação irá atualizar as roles de todos os usuários.'
    );
    console.log(
      '   Certifique-se de ter um backup do banco de dados antes de continuar.\n'
    );

    // Para ambiente de produção, adicionar confirmação interativa
    if (process.env.NODE_ENV === 'production') {
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      const answer = await new Promise(resolve => {
        rl.question('Deseja continuar com a migração? (sim/não): ', resolve);
      });
      rl.close();

      if (answer.toLowerCase() !== 'sim') {
        console.log('❌ Migração cancelada pelo usuário.');
        return;
      }
    }

    // 4. Executar migração
    console.log('🔄 Executando migração...\n');

    let successCount = 0;
    let errorCount = 0;
    const migrationResults = [];

    for (const user of users) {
      try {
        const currentRole = user.role || 'user';
        const newRole = ROLE_MIGRATION_MAP[currentRole] || 'atendente';

        // Verificar se a role precisa ser atualizada
        if (currentRole === newRole) {
          console.log(`⏭️ ${user.email}: Role já está correta (${newRole})`);
          migrationResults.push({
            email: user.email,
            oldRole: currentRole,
            newRole,
            status: 'unchanged',
          });
          continue;
        }

        // Atualizar role do usuário
        const { error: updateError } = await supabase
          .from('users')
          .update({
            role: newRole,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);

        if (updateError) {
          throw new Error(`Erro ao atualizar usuário: ${updateError.message}`);
        }

        console.log(`✅ ${user.email}: ${currentRole} → ${newRole}`);
        migrationResults.push({
          email: user.email,
          oldRole: currentRole,
          newRole,
          status: 'updated',
        });
        successCount++;
      } catch (error) {
        console.error(`❌ ${user.email}: Erro na migração - ${error.message}`);
        migrationResults.push({
          email: user.email,
          oldRole: user.role,
          newRole: 'error',
          status: 'error',
          error: error.message,
        });
        errorCount++;
      }
    }

    // 5. Relatório final
    console.log('\n📊 Relatório de Migração:');
    console.log(`   ✅ Sucessos: ${successCount}`);
    console.log(`   ❌ Erros: ${errorCount}`);
    console.log(
      `   ⏭️ Inalterados: ${users.length - successCount - errorCount}`
    );

    // 6. Verificar integridade após migração
    console.log('\n🔍 Verificando integridade após migração...');
    const { data: updatedUsers, error: verifyError } = await supabase
      .from('users')
      .select('role')
      .not('role', 'in', `(${VALID_ROLES.map(r => `"${r}"`).join(',')})`);

    if (verifyError) {
      console.error('❌ Erro na verificação:', verifyError.message);
    } else if (updatedUsers && updatedUsers.length > 0) {
      console.error(
        `❌ Encontradas ${updatedUsers.length} roles inválidas após migração!`
      );
      updatedUsers.forEach(user => {
        console.error(`   Role inválida: ${user.role}`);
      });
    } else {
      console.log('✅ Todas as roles estão válidas após migração');
    }

    // 7. Salvar log de migração
    const migrationLog = {
      timestamp: new Date().toISOString(),
      totalUsers: users.length,
      successCount,
      errorCount,
      results: migrationResults,
    };

    // Salvar log em arquivo (opcional)
    const fs = require('fs');
    const path = require('path');
    const logPath = path.join(__dirname, `migration-log-${Date.now()}.json`);
    fs.writeFileSync(logPath, JSON.stringify(migrationLog, null, 2));
    console.log(`\n📝 Log de migração salvo em: ${logPath}`);

    console.log('\n🎉 Migração concluída!');
  } catch (error) {
    console.error('❌ Erro durante a migração:', error.message);
    process.exit(1);
  }
}

// Função para reverter migração (rollback)
async function rollbackMigration(logFilePath) {
  try {
    console.log('🔄 Iniciando rollback da migração...\n');

    if (!logFilePath) {
      console.error('❌ Caminho do arquivo de log é obrigatório para rollback');
      return;
    }

    const fs = require('fs');
    if (!fs.existsSync(logFilePath)) {
      console.error('❌ Arquivo de log não encontrado:', logFilePath);
      return;
    }

    const migrationLog = JSON.parse(fs.readFileSync(logFilePath, 'utf8'));
    const updatedUsers = migrationLog.results.filter(
      r => r.status === 'updated'
    );

    console.log(`📋 Revertendo ${updatedUsers.length} usuários...`);

    for (const userLog of updatedUsers) {
      try {
        const { error } = await supabase
          .from('users')
          .update({ role: userLog.oldRole })
          .eq('email', userLog.email);

        if (error) {
          throw new Error(error.message);
        }

        console.log(
          `✅ ${userLog.email}: ${userLog.newRole} → ${userLog.oldRole}`
        );
      } catch (error) {
        console.error(
          `❌ ${userLog.email}: Erro no rollback - ${error.message}`
        );
      }
    }

    console.log('\n🎉 Rollback concluído!');
  } catch (error) {
    console.error('❌ Erro durante rollback:', error.message);
  }
}

// Função para criar usuários de teste com as novas roles
async function createTestUsersWithNewRoles() {
  try {
    console.log('🧪 Criando usuários de teste com novas roles...\n');

    const testUsers = [
      {
        email: 'admin@interalpha.com',
        password: 'admin123',
        name: 'Administrador Sistema',
        role: 'admin',
        phone: '(11) 99999-0001',
      },
      {
        email: 'gerente.adm@interalpha.com',
        password: 'gerente123',
        name: 'Gerente Administrativo',
        role: 'gerente_adm',
        phone: '(11) 99999-0002',
      },
      {
        email: 'gerente.financeiro@interalpha.com',
        password: 'financeiro123',
        name: 'Gerente Financeiro',
        role: 'gerente_financeiro',
        phone: '(11) 99999-0003',
      },
      {
        email: 'tecnico@interalpha.com',
        password: 'tecnico123',
        name: 'Técnico Especialista',
        role: 'technician',
        phone: '(11) 99999-0004',
      },
      {
        email: 'supervisor.tecnico@interalpha.com',
        password: 'supervisor123',
        name: 'Supervisor Técnico',
        role: 'supervisor_tecnico',
        phone: '(11) 99999-0007',
      },
      {
        email: 'diretor@interalpha.com',
        password: 'diretor123',
        name: 'Diretor Geral',
        role: 'diretor',
        phone: '(11) 99999-0006',
      },
      {
        email: 'atendente@interalpha.com',
        password: 'atendente123',
        name: 'Atendente Recepção',
        role: 'atendente',
        phone: '(11) 99999-0005',
      },
    ];

    for (const userData of testUsers) {
      try {
        // Criar usuário no Supabase Auth
        const { data: authUser, error: authError } =
          await supabase.auth.admin.createUser({
            email: userData.email,
            password: userData.password,
            email_confirm: true,
            user_metadata: {
              name: userData.name,
              phone: userData.phone,
            },
          });

        if (authError && !authError.message.includes('already registered')) {
          throw new Error(authError.message);
        }

        // Criar/atualizar usuário na tabela users
        const { error: upsertError } = await supabase.from('users').upsert(
          {
            email: userData.email,
            name: userData.name,
            role: userData.role,
            phone: userData.phone,
          },
          {
            onConflict: 'email',
          }
        );

        if (upsertError) {
          throw new Error(upsertError.message);
        }

        console.log(
          `✅ ${userData.email} (${userData.role}): Criado com sucesso`
        );
      } catch (error) {
        console.error(`❌ ${userData.email}: ${error.message}`);
      }
    }

    console.log('\n🎉 Usuários de teste criados!');
  } catch (error) {
    console.error('❌ Erro ao criar usuários de teste:', error.message);
  }
}

// Executar script baseado nos argumentos da linha de comando
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'migrate':
      migrateExistingUsers();
      break;
    case 'rollback':
      rollbackMigration(args[1]);
      break;
    case 'test-users':
      createTestUsersWithNewRoles();
      break;
    default:
      console.log('📖 Uso do script:');
      console.log(
        '   node scripts/migrate-existing-users.js migrate     # Migrar usuários existentes'
      );
      console.log(
        '   node scripts/migrate-existing-users.js rollback <log-file>  # Reverter migração'
      );
      console.log(
        '   node scripts/migrate-existing-users.js test-users  # Criar usuários de teste'
      );
      break;
  }
}

module.exports = {
  migrateExistingUsers,
  rollbackMigration,
  createTestUsersWithNewRoles,
  ROLE_MIGRATION_MAP,
  VALID_ROLES,
};
