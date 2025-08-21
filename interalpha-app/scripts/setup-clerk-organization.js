#!/usr/bin/env node

/**
 * Script para configurar a organização do Clerk e criar usuários de teste
 * Integra a organização "IT Alpha" ao sistema InterAlpha
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Cores para output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Dados da organização do Clerk
const ORGANIZATION_DATA = {
  "object": "organization",
  "id": "org_31I3ehfUoT7DDA8wLFk0BsmE6X4",
  "name": "IT Alpha",
  "slug": "it-alpha-1755197856",
  "image_url": "https://img.clerk.com/eyJ0eXBlIjoiZGVmYXVsdCIsImlpZCI6Imluc18zMHBRa3lqeUowdVNCWkxlN3d4VzZuQ2Nta0oiLCJyaWQiOiJvcmdfMzFJM2VoZlVvVDdEREE4d0xGazBCc21FNlg0IiwiaW5pdGlhbHMiOiJJIn0",
  "has_image": false,
  "members_count": 0,
  "max_allowed_memberships": 5,
  "admin_delete_enabled": true,
  "public_metadata": {},
  "private_metadata": {},
  "created_by": "",
  "created_at": 1755197856907,
  "updated_at": 1755197856907
};

// Usuários de teste para criar
const TEST_USERS = [
  {
    email: 'admin@italpha.com',
    password: 'Admin123!@#',
    firstName: 'Admin',
    lastName: 'Sistema',
    role: 'GERENTE_ADM'
  },
  {
    email: 'gerente@italpha.com',
    password: 'Gerente123!@#',
    firstName: 'Gerente',
    lastName: 'Financeiro',
    role: 'GERENTE_FINANCEIRO'
  },
  {
    email: 'supervisor@italpha.com',
    password: 'Supervisor123!@#',
    firstName: 'Supervisor',
    lastName: 'Técnico',
    role: 'SUPERVISOR_TECNICO'
  },
  {
    email: 'tecnico@italpha.com',
    password: 'Tecnico123!@#',
    firstName: 'Técnico',
    lastName: 'Sistema',
    role: 'TECNICO'
  },
  {
    email: 'atendente@italpha.com',
    password: 'Atendente123!@#',
    firstName: 'Atendente',
    lastName: 'Sistema',
    role: 'ATENDENTE'
  }
];

async function setupOrganization() {
  log(`${colors.bold}🏢 Configurando Organização IT Alpha${colors.reset}`, 'blue');
  
  // 1. Salvar dados da organização
  log('\n1. Salvando dados da organização...', 'yellow');
  
  const orgDataPath = path.join(__dirname, '..', 'clerk-organization.json');
  fs.writeFileSync(orgDataPath, JSON.stringify(ORGANIZATION_DATA, null, 2));
  log('✅ Dados da organização salvos em clerk-organization.json', 'green');
  
  // 2. Atualizar variáveis de ambiente com ID da organização
  log('\n2. Atualizando variáveis de ambiente...', 'yellow');
  
  const envPath = path.join(__dirname, '..', '.env');
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // Adicionar ID da organização se não existir
  if (!envContent.includes('NEXT_PUBLIC_CLERK_ORGANIZATION_ID')) {
    envContent += `\n# Clerk Organization\nNEXT_PUBLIC_CLERK_ORGANIZATION_ID=${ORGANIZATION_DATA.id}\n`;
    fs.writeFileSync(envPath, envContent);
    log('✅ ID da organização adicionado ao .env', 'green');
  } else {
    log('✅ ID da organização já existe no .env', 'green');
  }
  
  return true;
}

async function createTestUsers() {
  log('\n3. Criando usuários de teste...', 'yellow');
  
  // Criar script para adicionar usuários via Clerk API
  const createUserScript = `
const { clerkClient } = require('@clerk/nextjs/server');

async function createUsers() {
  const users = ${JSON.stringify(TEST_USERS, null, 2)};
  const orgId = '${ORGANIZATION_DATA.id}';
  
  for (const userData of users) {
    try {
      console.log(\`Criando usuário: \${userData.email}\`);
      
      // Criar usuário
      const user = await clerkClient().users.createUser({
        emailAddress: [userData.email],
        password: userData.password,
        firstName: userData.firstName,
        lastName: userData.lastName,
        publicMetadata: {
          role: userData.role,
          department: 'IT Alpha'
        }
      });
      
      console.log(\`✅ Usuário criado: \${user.id}\`);
      
      // Adicionar à organização
      try {
        await clerkClient().organizations.createOrganizationMembership({
          organizationId: orgId,
          userId: user.id,
          role: 'org:admin'
        });
        console.log(\`✅ Usuário adicionado à organização\`);
      } catch (orgError) {
        console.log(\`⚠️  Erro ao adicionar à organização: \${orgError.message}\`);
      }
      
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log(\`⚠️  Usuário \${userData.email} já existe\`);
      } else {
        console.log(\`❌ Erro ao criar \${userData.email}: \${error.message}\`);
      }
    }
  }
}

createUsers().catch(console.error);
`;
  
  const tempScriptPath = path.join(__dirname, 'temp-create-users.js');
  fs.writeFileSync(tempScriptPath, createUserScript);
  
  try {
    execSync(`cd ${path.dirname(tempScriptPath)} && node temp-create-users.js`, { 
      stdio: 'inherit',
      env: { ...process.env }
    });
    log('✅ Usuários de teste criados', 'green');
  } catch (error) {
    log('❌ Erro ao criar usuários de teste', 'red');
    log(`Detalhes: ${error.message}`, 'red');
  } finally {
    // Limpar arquivo temporário
    if (fs.existsSync(tempScriptPath)) {
      fs.unlinkSync(tempScriptPath);
    }
  }
}

async function syncWithDatabase() {
  log('\n4. Sincronizando com banco de dados local...', 'yellow');
  
  // Criar script para sincronizar usuários com o banco local
  const syncScript = `
const { PrismaClient } = require('@prisma/client');
const { clerkClient } = require('@clerk/nextjs/server');

async function syncUsers() {
  const prisma = new PrismaClient();
  
  try {
    // Buscar usuários do Clerk
    const clerkUsers = await clerkClient().users.getUserList({
      limit: 100
    });
    
    console.log(\`Encontrados \${clerkUsers.data.length} usuários no Clerk\`);
    
    for (const clerkUser of clerkUsers.data) {
      const email = clerkUser.emailAddresses[0]?.emailAddress;
      const role = clerkUser.publicMetadata?.role || 'TECNICO';
      
      if (email) {
        try {
          // Verificar se usuário já existe no banco local
          const existingEmployee = await prisma.employee.findUnique({
            where: { email }
          });
          
          if (!existingEmployee) {
            // Criar funcionário no banco local
            await prisma.employee.create({
              data: {
                clerkId: clerkUser.id,
                email: email,
                name: \`\${clerkUser.firstName || ''} \${clerkUser.lastName || ''}\`.trim(),
                role: role,
                isActive: true,
                permissions: JSON.stringify([]),
                metadata: JSON.stringify({
                  clerkData: {
                    createdAt: clerkUser.createdAt,
                    lastSignInAt: clerkUser.lastSignInAt
                  }
                })
              }
            });
            console.log(\`✅ Funcionário sincronizado: \${email}\`);
          } else {
            console.log(\`⚠️  Funcionário já existe: \${email}\`);
          }
        } catch (dbError) {
          console.log(\`❌ Erro ao sincronizar \${email}: \${dbError.message}\`);
        }
      }
    }
    
  } catch (error) {
    console.log(\`❌ Erro na sincronização: \${error.message}\`);
  } finally {
    await prisma.$disconnect();
  }
}

syncUsers().catch(console.error);
`;
  
  const tempSyncPath = path.join(__dirname, 'temp-sync-users.js');
  fs.writeFileSync(tempSyncPath, syncScript);
  
  try {
    execSync(`cd ${path.dirname(tempSyncPath)} && node temp-sync-users.js`, { 
      stdio: 'inherit',
      env: { ...process.env }
    });
    log('✅ Sincronização com banco de dados concluída', 'green');
  } catch (error) {
    log('❌ Erro na sincronização com banco', 'red');
    log(`Detalhes: ${error.message}`, 'red');
  } finally {
    // Limpar arquivo temporário
    if (fs.existsSync(tempSyncPath)) {
      fs.unlinkSync(tempSyncPath);
    }
  }
}

async function updateClerkProvider() {
  log('\n5. Atualizando ClerkProvider com organização...', 'yellow');
  
  const layoutPath = path.join(__dirname, '..', 'src', 'app', 'layout.tsx');
  let layoutContent = fs.readFileSync(layoutPath, 'utf8');
  
  // Verificar se já tem configuração de organização
  if (!layoutContent.includes('organizationId')) {
    // Adicionar configuração de organização ao ClerkProvider
    layoutContent = layoutContent.replace(
      '<ClerkProvider>',
      `<ClerkProvider
        publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
        organizationId="${ORGANIZATION_DATA.id}"
      >`
    );
    
    fs.writeFileSync(layoutPath, layoutContent);
    log('✅ ClerkProvider atualizado com organização', 'green');
  } else {
    log('✅ ClerkProvider já configurado com organização', 'green');
  }
}

async function main() {
  log(`${colors.bold}🚀 FASE 2: INTEGRAÇÃO DA ORGANIZAÇÃO CLERK${colors.reset}`, 'blue');
  
  try {
    await setupOrganization();
    await createTestUsers();
    await syncWithDatabase();
    await updateClerkProvider();
    
    log(`\n${colors.bold}📋 RESUMO DA FASE 2${colors.reset}`, 'blue');
    log('✅ Organização IT Alpha configurada', 'green');
    log('✅ Usuários de teste criados', 'green');
    log('✅ Sincronização com banco local', 'green');
    log('✅ ClerkProvider atualizado', 'green');
    
    log(`\n${colors.bold}👥 USUÁRIOS CRIADOS:${colors.reset}`, 'blue');
    TEST_USERS.forEach(user => {
      log(`📧 ${user.email} | 🔑 ${user.password} | 👤 ${user.role}`, 'yellow');
    });
    
    log('\n🔄 Próxima fase: Testar login com usuários criados', 'yellow');
    
  } catch (error) {
    log(`❌ Erro na Fase 2: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { setupOrganization, createTestUsers, syncWithDatabase };