const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testTechnicalFixes() {
  console.log('🔧 Testando Correções Técnicas...\n')

  try {
    // 1. Testar conexão com banco
    console.log('1. Testando conexão com banco de dados...')
    await prisma.$connect()
    console.log('✅ Conexão com banco estabelecida')

    // 2. Verificar se as tabelas de comunicação existem
    console.log('\n2. Verificando tabelas de comunicação...')
    
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('messages', 'chat_rooms', 'support_tickets', 'departments')
    `
    
    console.log(`✅ Tabelas encontradas: ${tables.map(t => t.table_name).join(', ')}`)

    // 3. Testar criação de departamento
    console.log('\n3. Testando criação de departamento...')
    
    const testDepartment = await prisma.department.upsert({
      where: { name: 'Teste Técnico' },
      update: {},
      create: {
        name: 'Teste Técnico',
        description: 'Departamento para testes técnicos',
        isActive: true
      }
    })
    
    console.log(`✅ Departamento criado/atualizado: ${testDepartment.name}`)

    // 4. Testar funcionário de teste
    console.log('\n4. Testando funcionário de teste...')
    
    const testEmployee = await prisma.employee.upsert({
      where: { email: 'teste.tecnico@interalpha.com' },
      update: {},
      create: {
        email: 'teste.tecnico@interalpha.com',
        name: 'Teste Técnico',
        role: 'TECNICO',
        department: 'Teste Técnico',
        passwordHash: 'test_hash',
        isActive: true
      }
    })
    
    console.log(`✅ Funcionário criado/atualizado: ${testEmployee.name}`)

    // 5. Testar criação de mensagem
    console.log('\n5. Testando criação de mensagem...')
    
    const testMessage = await prisma.message.create({
      data: {
        senderId: testEmployee.id,
        senderName: testEmployee.name,
        senderRole: testEmployee.role,
        departmentId: testDepartment.id,
        departmentName: testDepartment.name,
        content: 'Mensagem de teste para verificar correções técnicas',
        messageType: 'DEPARTMENT',
        priority: 'NORMAL',
        status: 'SENT'
      }
    })
    
    console.log(`✅ Mensagem criada: ${testMessage.id}`)

    // 6. Testar criação de ticket
    console.log('\n6. Testando criação de ticket...')
    
    const testTicket = await prisma.supportTicket.create({
      data: {
        ticketNumber: 'TEST-001',
        employeeId: testEmployee.id,
        employeeName: testEmployee.name,
        subject: 'Ticket de teste técnico',
        description: 'Ticket para verificar correções técnicas',
        category: 'TECHNICAL',
        priority: 'NORMAL',
        status: 'OPEN',
        departmentId: testDepartment.id
      }
    })
    
    console.log(`✅ Ticket criado: ${testTicket.ticketNumber}`)

    // 7. Testar sala de chat
    console.log('\n7. Testando criação de sala de chat...')
    
    const testChatRoom = await prisma.chatRoom.create({
      data: {
        name: 'Sala de Teste Técnico',
        description: 'Sala para testes técnicos',
        type: 'DEPARTMENT',
        departmentId: testDepartment.id,
        createdBy: testEmployee.id,
        settings: {
          allowFileUploads: true,
          maxFileSize: 10485760,
          allowedFileTypes: ['image/*', 'text/*'],
          messageRetentionDays: 30,
          requireApproval: false,
          moderatorIds: [testEmployee.id]
        },
        participants: {
          create: [{
            userId: testEmployee.id,
            userName: testEmployee.name,
            userRole: testEmployee.role,
            permissions: {
              canSendMessages: true,
              canSendFiles: true,
              canDeleteOwnMessages: true,
              canDeleteAnyMessage: false,
              canManageParticipants: false,
              canArchiveRoom: false
            }
          }]
        }
      }
    })
    
    console.log(`✅ Sala de chat criada: ${testChatRoom.name}`)

    // 8. Verificar estatísticas
    console.log('\n8. Verificando estatísticas...')
    
    const messageCount = await prisma.message.count()
    const ticketCount = await prisma.supportTicket.count()
    const chatRoomCount = await prisma.chatRoom.count()
    const departmentCount = await prisma.department.count()
    
    console.log(`📊 Estatísticas atuais:`)
    console.log(`   - Mensagens: ${messageCount}`)
    console.log(`   - Tickets: ${ticketCount}`)
    console.log(`   - Salas de chat: ${chatRoomCount}`)
    console.log(`   - Departamentos: ${departmentCount}`)

    console.log('\n🎉 Todas as correções técnicas foram testadas com sucesso!')
    console.log('\n📋 Resumo dos testes:')
    console.log('   ✅ Conexão com banco de dados')
    console.log('   ✅ Tabelas de comunicação existem')
    console.log('   ✅ Criação de departamentos')
    console.log('   ✅ Criação de funcionários')
    console.log('   ✅ Criação de mensagens')
    console.log('   ✅ Criação de tickets')
    console.log('   ✅ Criação de salas de chat')
    console.log('   ✅ Estatísticas funcionando')

  } catch (error) {
    console.error('❌ Erro durante os testes técnicos:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Executar os testes
testTechnicalFixes()
  .catch((error) => {
    console.error('❌ Falha nos testes técnicos:', error)
    process.exit(1)
  })