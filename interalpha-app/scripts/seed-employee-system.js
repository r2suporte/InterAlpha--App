const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function seedEmployeeSystem() {
  try {
    console.log('🌱 Iniciando seed do sistema de funcionários...')

    // Criar primeiro administrador (dados de exemplo)
    const adminEmployee = await prisma.employee.upsert({
      where: { email: 'admin@interalpha.com' },
      update: {},
      create: {
        clerkId: 'clerk_admin_demo', // Em produção, usar ID real do Clerk
        email: 'admin@interalpha.com',
        name: 'Administrador Sistema',
        role: 'ADMIN',
        department: 'TI',
        phone: '(11) 99999-0000',
        isActive: true,
        permissions: ['all'],
        metadata: {
          isSystemAdmin: true,
          createdByScript: true
        }
      }
    })

    console.log('✅ Administrador criado:', adminEmployee.name)

    // Criar funcionários de exemplo
    const employees = [
      {
        clerkId: 'clerk_gerente_adm_demo',
        email: 'gerente.adm@interalpha.com',
        name: 'Maria Silva',
        role: 'GERENTE_ADM',
        department: 'Administrativo',
        phone: '(11) 98888-1111',
        permissions: ['clientes', 'relatorios', 'ordens', 'funcionarios']
      },
      {
        clerkId: 'clerk_gerente_fin_demo',
        email: 'gerente.financeiro@interalpha.com',
        name: 'João Santos',
        role: 'GERENTE_FINANCEIRO',
        department: 'Financeiro',
        phone: '(11) 97777-2222',
        permissions: ['pagamentos', 'relatorios', 'clientes']
      },
      {
        clerkId: 'clerk_supervisor_demo',
        email: 'supervisor@interalpha.com',
        name: 'Carlos Oliveira',
        role: 'SUPERVISOR_TECNICO',
        department: 'Técnico',
        phone: '(11) 96666-3333',
        permissions: ['ordens', 'produtos', 'relatorios']
      },
      {
        clerkId: 'clerk_tecnico_demo',
        email: 'tecnico@interalpha.com',
        name: 'Ana Costa',
        role: 'TECNICO',
        department: 'Técnico',
        phone: '(11) 95555-4444',
        permissions: ['ordens', 'produtos']
      },
      {
        clerkId: 'clerk_atendente_demo',
        email: 'atendente@interalpha.com',
        name: 'Pedro Lima',
        role: 'ATENDENTE',
        department: 'Atendimento',
        phone: '(11) 94444-5555',
        permissions: ['clientes', 'ordens']
      }
    ]

    for (const employeeData of employees) {
      const employee = await prisma.employee.upsert({
        where: { email: employeeData.email },
        update: {},
        create: {
          ...employeeData,
          isActive: true,
          metadata: {
            createdByScript: true
          },
          createdBy: adminEmployee.id
        }
      })
      console.log(`✅ Funcionário criado: ${employee.name} (${employee.role})`)
    }

    console.log('🎉 Seed do sistema de funcionários concluído!')
    console.log('')
    console.log('📋 Funcionários criados:')
    console.log('👑 admin@interalpha.com - Administrador Sistema (ADMIN)')
    console.log('🏢 gerente.adm@interalpha.com - Maria Silva (GERENTE_ADM)')
    console.log('💰 gerente.financeiro@interalpha.com - João Santos (GERENTE_FINANCEIRO)')
    console.log('🔧 supervisor@interalpha.com - Carlos Oliveira (SUPERVISOR_TECNICO)')
    console.log('⚙️ tecnico@interalpha.com - Ana Costa (TECNICO)')
    console.log('📞 atendente@interalpha.com - Pedro Lima (ATENDENTE)')
    console.log('')
    console.log('⚠️  IMPORTANTE: Estes são dados de demonstração!')
    console.log('   Em produção, você deve:')
    console.log('   1. Criar usuários reais no Clerk Dashboard')
    console.log('   2. Usar IDs reais do Clerk')
    console.log('   3. Configurar senhas seguras')
    console.log('   4. Remover dados de demonstração')

  } catch (error) {
    console.error('❌ Erro no seed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Executar seed se chamado diretamente
if (require.main === module) {
  seedEmployeeSystem()
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

module.exports = { seedEmployeeSystem }