const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testCommunicationSystem() {
  console.log('🧪 Testando Sistema de Comunicação Interna...\n')

  try {
    // 1. Criar departamentos de teste
    console.log('1. Criando departamentos de teste...')
    
    const techDepartment = await prisma.department.upsert({
      where: { name: 'Técnico' },
      update: {},
      create: {
        name: 'Técnico',
        description: 'Departamento técnico responsável pelos serviços',
        isActive: true
      }
    })

    const supportDepartment = await prisma.department.upsert({
      where: { name: 'Suporte' },
      update: {},
      create: {
        name: 'Suporte',
        description: 'Departamento de atendimento ao cliente',
        isActive: true
      }
    })

    console.log(`✅ Departamentos criados: ${techDepartment.name}, ${supportDepartment.name}`)

    // 2. Criar funcionários de teste
    console.log('\n2. Criando funcionários de teste...')
    
    const employee1 = await prisma.employee.upsert({
      where: { email: 'joao.tecnico@interalpha.com' },
      update: {},
      create: {
        email: 'joao.tecnico@interalpha.com',
        name: 'João Silva',
        role: 'TECNICO',
        department: 'Técnico',
        phone: '(11) 99999-1111',
        passwordHash: 'hashed_password_123',
        isActive: true
      }
    })

    const employee2 = await prisma.employee.upsert({
      where: { email: 'maria.atendente@interalpha.com' },
      update: {},
      create: {
        email: 'maria.atendente@interalpha.com',
        name: 'Maria Santos',
        role: 'ATENDENTE',
        department: 'Suporte',
        phone: '(11) 99999-2222',
        passwordHash: 'hashed_password_456',
        isActive: true
      }
    })

    console.log(`✅ Funcionários criados: ${employee1.name}, ${employee2.name}`)

    // 3. Criar cliente de teste
    console.log('\n3. Criando cliente de teste...')
    
    // Primeiro criar um usuário
    const user = await prisma.user.upsert({
      where: { email: 'cliente.teste@email.com' },
      update: {},
      create: {
        clerkId: 'test_clerk_id_123',
        email: 'cliente.teste@email.com',
        name: 'Cliente Teste'
      }
    })

    const client = await prisma.cliente.upsert({
      where: { documento: '12345678901' },
      update: {},
      create: {
        nome: 'Cliente Teste',
        email: 'cliente.teste@email.com',
        telefone: '(11) 99999-0000',
        documento: '12345678901',
        tipoDocumento: 'CPF',
        userId: user.id
      }
    })

    console.log(`✅ Cliente criado: ${client.nome}`)

    // 4. Testar mensagens diretas
    console.log('\n4. Testando mensagens diretas...')
    
    const directMessage = await prisma.message.create({
      data: {
        senderId: employee1.id,
        senderName: employee1.name,
        senderRole: employee1.role,
        recipientId: employee2.id,
        recipientName: employee2.name,
        subject: 'Teste de mensagem direta',
        content: 'Esta é uma mensagem de teste entre funcionários.',
        messageType: 'DIRECT',
        priority: 'NORMAL',
        status: 'SENT'
      }
    })

    console.log(`✅ Mensagem direta criada: ${directMessage.subject}`)

    // 5. Testar mensagens de departamento
    console.log('\n5. Testando mensagens de departamento...')
    
    const departmentMessage = await prisma.message.create({
      data: {
        senderId: employee1.id,
        senderName: employee1.name,
        senderRole: employee1.role,
        departmentId: techDepartment.id,
        departmentName: techDepartment.name,
        subject: 'Reunião de equipe',
        content: 'Pessoal, temos reunião de equipe amanhã às 14h.',
        messageType: 'DEPARTMENT',
        priority: 'HIGH',
        status: 'SENT'
      }
    })

    console.log(`✅ Mensagem de departamento criada: ${departmentMessage.subject}`)

    // 6. Testar sala de chat
    console.log('\n6. Testando sala de chat...')
    
    const chatRoom = await prisma.chatRoom.create({
      data: {
        name: 'Equipe Técnica',
        description: 'Chat da equipe técnica',
        type: 'DEPARTMENT',
        departmentId: techDepartment.id,
        createdBy: employee1.id,
        settings: {
          allowFileUploads: true,
          maxFileSize: 10485760, // 10MB
          allowedFileTypes: ['image/*', 'application/pdf'],
          messageRetentionDays: 90,
          requireApproval: false,
          moderatorIds: [employee1.id]
        },
        participants: {
          create: [
            {
              userId: employee1.id,
              userName: employee1.name,
              userRole: employee1.role,
              permissions: {
                canSendMessages: true,
                canSendFiles: true,
                canDeleteOwnMessages: true,
                canDeleteAnyMessage: false,
                canManageParticipants: true,
                canArchiveRoom: false
              }
            }
          ]
        }
      }
    })

    console.log(`✅ Sala de chat criada: ${chatRoom.name}`)

    // 7. Testar ticket de suporte
    console.log('\n7. Testando ticket de suporte...')
    
    const supportTicket = await prisma.supportTicket.create({
      data: {
        ticketNumber: '20250108-0001',
        clientId: client.id,
        clientName: client.nome,
        subject: 'Problema com serviço',
        description: 'Estou com dificuldades para acessar o sistema.',
        category: 'TECHNICAL',
        priority: 'HIGH',
        status: 'OPEN',
        departmentId: supportDepartment.id,
        tags: ['acesso', 'sistema']
      }
    })

    console.log(`✅ Ticket de suporte criado: #${supportTicket.ticketNumber}`)

    // 8. Atribuir ticket
    console.log('\n8. Atribuindo ticket...')
    
    const assignedTicket = await prisma.supportTicket.update({
      where: { id: supportTicket.id },
      data: {
        assignedTo: employee2.id,
        assignedToName: employee2.name,
        status: 'IN_PROGRESS'
      }
    })

    console.log(`✅ Ticket atribuído para: ${assignedTicket.assignedToName}`)

    // 9. Adicionar mensagem ao ticket
    console.log('\n9. Adicionando mensagem ao ticket...')
    
    const ticketMessage = await prisma.ticketMessage.create({
      data: {
        ticketId: supportTicket.id,
        senderId: employee2.id,
        senderName: employee2.name,
        content: 'Olá! Recebi seu ticket e vou ajudá-lo com o problema de acesso.',
        isInternal: false
      }
    })

    console.log(`✅ Mensagem adicionada ao ticket`)

    // 10. Testar preferências de comunicação
    console.log('\n10. Testando preferências de comunicação...')
    
    const commPrefs = await prisma.communicationPreferences.create({
      data: {
        userId: employee1.id,
        emailNotifications: true,
        pushNotifications: true,
        smsNotifications: false,
        notificationTypes: {
          directMessages: true,
          departmentMessages: true,
          supportTickets: true,
          systemMessages: false
        },
        quietHours: {
          enabled: true,
          startTime: '22:00',
          endTime: '08:00'
        }
      }
    })

    console.log(`✅ Preferências de comunicação criadas`)

    // 11. Buscar estatísticas
    console.log('\n11. Buscando estatísticas...')
    
    const messageCount = await prisma.message.count()
    const ticketCount = await prisma.supportTicket.count()
    const chatRoomCount = await prisma.chatRoom.count()
    
    console.log(`📊 Estatísticas:`)
    console.log(`   - Mensagens: ${messageCount}`)
    console.log(`   - Tickets: ${ticketCount}`)
    console.log(`   - Salas de chat: ${chatRoomCount}`)

    // 12. Testar busca de mensagens
    console.log('\n12. Testando busca de mensagens...')
    
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: employee1.id },
          { recipientId: employee1.id }
        ]
      },
      include: {
        sender: { select: { name: true, role: true } },
        recipient: { select: { name: true } },
        department: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    console.log(`✅ Encontradas ${messages.length} mensagens para ${employee1.name}`)

    // 13. Testar busca de tickets
    console.log('\n13. Testando busca de tickets...')
    
    const tickets = await prisma.supportTicket.findMany({
      where: {
        OR: [
          { assignedTo: employee2.id },
          { departmentId: supportDepartment.id }
        ]
      },
      include: {
        client: { select: { nome: true } },
        assignedToUser: { select: { name: true } },
        department: { select: { name: true } },
        messages: {
          include: {
            sender: { select: { name: true } }
          }
        }
      }
    })

    console.log(`✅ Encontrados ${tickets.length} tickets para o departamento de suporte`)

    console.log('\n🎉 Teste do Sistema de Comunicação Interna concluído com sucesso!')
    console.log('\n📋 Resumo dos testes:')
    console.log('   ✅ Departamentos criados')
    console.log('   ✅ Funcionários criados')
    console.log('   ✅ Cliente criado')
    console.log('   ✅ Mensagens diretas funcionando')
    console.log('   ✅ Mensagens de departamento funcionando')
    console.log('   ✅ Salas de chat funcionando')
    console.log('   ✅ Tickets de suporte funcionando')
    console.log('   ✅ Atribuição de tickets funcionando')
    console.log('   ✅ Mensagens em tickets funcionando')
    console.log('   ✅ Preferências de comunicação funcionando')
    console.log('   ✅ Estatísticas funcionando')
    console.log('   ✅ Buscas funcionando')

  } catch (error) {
    console.error('❌ Erro durante o teste:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Executar o teste
testCommunicationSystem()
  .catch((error) => {
    console.error('❌ Falha no teste:', error)
    process.exit(1)
  })