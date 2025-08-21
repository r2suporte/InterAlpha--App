import { PrismaClient } from '@prisma/client'
import { 
  Message, 
  ChatRoom, 
  SupportTicket, 
  MessageType, 
  MessagePriority, 
  MessageStatus,
  ChatRoomType,
  TicketStatus,
  TicketCategory,
  MessageFilters,
  ChatRoomFilters,
  TicketFilters,
  MessageStats,
  TicketStats,
  OnlineStatus,
  UserStatus
} from '@/types/communication'
import { NotificationService } from '@/services/notifications/notification-service'
import { AuditService } from '@/services/audit/audit-service'

// Singleton para evitar múltiplas instâncias
let prismaInstance: PrismaClient | null = null

function getPrismaInstance(): PrismaClient {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient()
  }
  return prismaInstance
}

export class CommunicationService {
  private prisma: PrismaClient
  private notificationService: NotificationService
  private auditService: AuditService
  private onlineUsers: Map<string, OnlineStatus> = new Map()
  private messageCache: Map<string, Message[]> = new Map()
  private cacheExpiry: Map<string, number> = new Map()
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

  constructor() {
    this.prisma = getPrismaInstance()
    this.notificationService = new NotificationService()
    this.auditService = new AuditService()
  }

  // Método para limpar cache expirado
  private cleanExpiredCache(): void {
    const now = Date.now()
    for (const [key, expiry] of this.cacheExpiry.entries()) {
      if (now > expiry) {
        this.messageCache.delete(key)
        this.cacheExpiry.delete(key)
      }
    }
  }

  // Método para obter mensagens com cache
  private getCachedMessages(cacheKey: string): Message[] | null {
    this.cleanExpiredCache()
    return this.messageCache.get(cacheKey) || null
  }

  // Método para definir cache de mensagens
  private setCachedMessages(cacheKey: string, messages: Message[]): void {
    this.messageCache.set(cacheKey, messages)
    this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_DURATION)
  }

  // ===== MENSAGENS =====

  async sendMessage(data: {
    senderId: string
    recipientId?: string
    departmentId?: string
    subject?: string
    content: string
    messageType: MessageType
    priority?: MessagePriority
    attachments?: any[]
    parentMessageId?: string
  }): Promise<Message> {
    try {
      // Validar permissões do remetente
      await this.validateSendPermissions(data.senderId, data.messageType, data.departmentId)

      // Criar mensagem
      const message = await this.prisma.message.create({
        data: {
          senderId: data.senderId,
          recipientId: data.recipientId,
          departmentId: data.departmentId,
          subject: data.subject,
          content: data.content,
          messageType: data.messageType as any,
          priority: data.priority as any,
          status: 'SENT' as any,
          parentMessageId: data.parentMessageId,
          threadId: data.parentMessageId ? await this.getThreadId(data.parentMessageId) : undefined,
          attachments: data.attachments ? {
            create: data.attachments.map(att => ({
              filename: att.filename,
              originalName: att.originalName,
              mimeType: att.mimeType,
              size: att.size,
              url: att.url
            }))
          } : undefined
        },
        include: {
          sender: { select: { name: true, role: true } },
          recipient: { select: { name: true } },
          department: { select: { name: true } },
          attachments: true
        }
      })

      // Enviar notificações
      await this.sendMessageNotifications(message)

      // Log de auditoria
      await this.auditService.logAction(
        data.senderId,
        'send_message',
        'messages',
        'success',
        message.id
      )

      return this.formatMessage(message)
    } catch (error) {
      await this.auditService.logAction(
        data.senderId,
        'send_message',
        'messages',
        'failure',
        undefined
      )
      throw error instanceof Error ? error : new Error('Erro desconhecido')
    }
  }

  async getMessages(userId: string, filters: MessageFilters): Promise<Message[]> {
    const where: any = {
      OR: [
        { senderId: userId },
        { recipientId: userId },
        { 
          messageType: MessageType.DEPARTMENT,
          department: {
            employees: {
              some: { id: userId }
            }
          }
        }
      ]
    }

    if (filters.messageType) where.messageType = filters.messageType
    if (filters.priority) where.priority = filters.priority
    if (filters.status) where.status = filters.status
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {}
      if (filters.dateFrom) where.createdAt.gte = filters.dateFrom
      if (filters.dateTo) where.createdAt.lte = filters.dateTo
    }
    if (filters.searchTerm) {
      where.OR = [
        { content: { contains: filters.searchTerm, mode: 'insensitive' } },
        { subject: { contains: filters.searchTerm, mode: 'insensitive' } }
      ]
    }

    const messages = await this.prisma.message.findMany({
      where,
      include: {
        sender: { select: { name: true, role: true } },
        recipient: { select: { name: true } },
        department: { select: { name: true } },
        attachments: true
      },
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 50,
      skip: filters.offset || 0
    })

    return messages.map(this.formatMessage)
  }

  async markMessageAsRead(messageId: string, userId: string): Promise<void> {
    await this.prisma.message.updateMany({
      where: {
        id: messageId,
        OR: [
          { recipientId: userId },
          { 
            messageType: 'DEPARTMENT' as any,
            department: {
              employees: {
                some: { id: userId }
              }
            }
          }
        ]
      },
      data: {
        status: 'READ' as any,
        readAt: new Date()
      }
    })
  }

  // ===== SALAS DE CHAT =====

  async createChatRoom(data: {
    name: string
    description?: string
    type: ChatRoomType
    departmentId?: string
    createdBy: string
    participantIds: string[]
  }): Promise<ChatRoom> {
    const chatRoom = await this.prisma.chatRoom.create({
      data: {
        name: data.name,
        description: data.description,
        type: data.type as any,
        departmentId: data.departmentId,
        createdBy: data.createdBy,
        participants: {
          create: data.participantIds.map(userId => ({
            userId,
            joinedAt: new Date(),
            permissions: this.getDefaultChatPermissions(data.type)
          }))
        },
        settings: {
          allowFileUploads: true,
          maxFileSize: 10 * 1024 * 1024, // 10MB
          allowedFileTypes: ['image/*', 'application/pdf', 'text/*'],
          messageRetentionDays: 90,
          requireApproval: false,
          moderatorIds: [data.createdBy]
        }
      },
      include: {
        participants: {
          include: {
            user: { select: { name: true, role: true } }
          }
        },
        department: { select: { name: true } }
      }
    })

    return this.formatChatRoom(chatRoom)
  }

  async getChatRooms(userId: string, filters: ChatRoomFilters): Promise<ChatRoom[]> {
    const where: any = {
      participants: {
        some: { userId, isActive: true }
      },
      isActive: true
    }

    if (filters.type) where.type = filters.type
    if (filters.departmentId) where.departmentId = filters.departmentId

    const chatRooms = await this.prisma.chatRoom.findMany({
      where,
      include: {
        participants: {
          include: {
            user: { select: { name: true, role: true } }
          }
        },
        department: { select: { name: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: { select: { name: true } }
          }
        }
      },
      orderBy: { lastActivity: 'desc' },
      take: filters.limit || 20,
      skip: filters.offset || 0
    })

    return chatRooms.map(this.formatChatRoom)
  }

  async addParticipantToChatRoom(chatRoomId: string, userId: string, addedBy: string): Promise<void> {
    // Verificar se o usuário que está adicionando tem permissão
    const canManage = await this.canManageChatRoom(chatRoomId, addedBy)
    if (!canManage) {
      throw new Error('Sem permissão para adicionar participantes')
    }

    await this.prisma.chatParticipant.create({
      data: {
        chatRoomId,
        userId,
        joinedAt: new Date(),
        permissions: this.getDefaultChatPermissions(ChatRoomType.GENERAL)
      }
    })

    // Atualizar última atividade da sala
    await this.prisma.chatRoom.update({
      where: { id: chatRoomId },
      data: { lastActivity: new Date() }
    })
  }

  // ===== TICKETS DE SUPORTE =====

  async createSupportTicket(data: {
    clientId?: string
    employeeId?: string
    subject: string
    description: string
    category: TicketCategory
    priority: MessagePriority
    departmentId?: string
    attachments?: any[]
  }): Promise<SupportTicket> {
    const ticketNumber = await this.generateTicketNumber()

    const ticket = await this.prisma.supportTicket.create({
      data: {
        ticketNumber,
        clientId: data.clientId,
        employeeId: data.employeeId,
        subject: data.subject,
        description: data.description,
        category: data.category as any,
        priority: data.priority as any,
        status: 'OPEN' as any,
        departmentId: data.departmentId,
        attachments: data.attachments ? {
          create: data.attachments.map(att => ({
            filename: att.filename,
            originalName: att.originalName,
            mimeType: att.mimeType,
            size: att.size,
            url: att.url
          }))
        } : undefined
      },
      include: {
        client: { select: { name: true } },
        employee: { select: { name: true } },
        assignedToUser: { select: { name: true } },
        department: { select: { name: true } },
        attachments: true,
        messages: {
          include: {
            sender: { select: { name: true } },
            attachments: true
          }
        }
      }
    })

    // Notificar departamento responsável
    await this.notifyDepartmentNewTicket(ticket)

    return this.formatSupportTicket(ticket)
  }

  async assignTicket(ticketId: string, assignedTo: string, assignedBy: string): Promise<void> {
    await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        assignedTo,
        status: 'IN_PROGRESS' as any,
        updatedAt: new Date()
      }
    })

    // Notificar o usuário atribuído
    try {
      await this.notificationService.createNotification({
        userId: assignedTo,
        title: 'Novo ticket atribuído',
        message: `Você foi atribuído ao ticket #${ticketId}`,
        type: 'ticket_assigned',
        priority: 'medium'
      })
    } catch (error) {
      console.error('Erro ao enviar notificação:', error)
    }
  }

  async updateTicketStatus(ticketId: string, status: TicketStatus, updatedBy: string): Promise<void> {
    const ticket = await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        status: status as any,
        updatedAt: new Date(),
        resolvedAt: status === TicketStatus.RESOLVED ? new Date() : undefined,
        closedAt: status === TicketStatus.CLOSED ? new Date() : undefined
      },
      include: {
        client: { select: { name: true } },
        employee: { select: { name: true } }
      }
    })

    // Notificar cliente se aplicável
    if (ticket.clientId && [TicketStatus.RESOLVED, TicketStatus.CLOSED].includes(status)) {
      try {
        await this.notificationService.createNotification({
          userId: ticket.clientId,
          title: 'Ticket atualizado',
          message: `Seu ticket #${ticket.ticketNumber} foi ${status === TicketStatus.RESOLVED ? 'resolvido' : 'fechado'}`,
          type: 'ticket_updated',
          priority: 'medium'
        })
      } catch (error) {
        console.error('Erro ao enviar notificação:', error)
      }
    }
  }

  async getTickets(userId: string, filters: TicketFilters): Promise<SupportTicket[]> {
    const userRole = await this.getUserRole(userId)
    
    const where: any = {}

    // Filtros baseados no role do usuário
    if (userRole === 'client') {
      where.clientId = userId
    } else {
      // Funcionários podem ver tickets do seu departamento ou atribuídos a eles
      where.OR = [
        { assignedTo: userId },
        { employeeId: userId },
        { 
          department: {
            employees: {
              some: { id: userId }
            }
          }
        }
      ]
    }

    if (filters.category) where.category = filters.category
    if (filters.priority) where.priority = filters.priority
    if (filters.status) where.status = filters.status
    if (filters.assignedTo) where.assignedTo = filters.assignedTo

    const tickets = await this.prisma.supportTicket.findMany({
      where,
      include: {
        client: { select: { name: true } },
        employee: { select: { name: true } },
        assignedToUser: { select: { name: true } },
        department: { select: { name: true } },
        attachments: true,
        messages: {
          include: {
            sender: { select: { name: true } },
            attachments: true
          },
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 20,
      skip: filters.offset || 0
    })

    return tickets.map(this.formatSupportTicket)
  }

  // ===== STATUS ONLINE =====

  setUserOnlineStatus(userId: string, status: UserStatus, activity?: string): void {
    this.onlineUsers.set(userId, {
      userId,
      status,
      lastSeen: new Date(),
      currentActivity: activity
    })
  }

  getUserOnlineStatus(userId: string): OnlineStatus | null {
    return this.onlineUsers.get(userId) || null
  }

  getOnlineUsers(departmentId?: string): OnlineStatus[] {
    const onlineUsers = Array.from(this.onlineUsers.values())
    
    if (departmentId) {
      // Filtrar por departamento se especificado
      return onlineUsers.filter(user => 
        user.status === UserStatus.ONLINE
      )
    }
    
    return onlineUsers.filter(user => user.status === UserStatus.ONLINE)
  }

  // ===== ESTATÍSTICAS =====

  async getMessageStats(userId: string, departmentId?: string): Promise<MessageStats> {
    const where: any = {
      OR: [
        { senderId: userId },
        { recipientId: userId }
      ]
    }

    if (departmentId) {
      where.OR.push({
        messageType: MessageType.DEPARTMENT,
        departmentId
      })
    }

    const [
      totalMessages,
      unreadMessages,
      messagesByType,
      messagesByPriority
    ] = await Promise.all([
      this.prisma.message.count({ where }),
      this.prisma.message.count({ 
        where: { ...where, status: MessageStatus.SENT, recipientId: userId }
      }),
      this.prisma.message.groupBy({
        by: ['messageType'],
        where,
        _count: true
      }),
      this.prisma.message.groupBy({
        by: ['priority'],
        where,
        _count: true
      })
    ])

    return {
      totalMessages,
      unreadMessages,
      messagesByType: messagesByType.reduce((acc: Record<MessageType, number>, item: any) => {
        acc[item.messageType] = item._count
        return acc
      }, {} as Record<MessageType, number>),
      messagesByPriority: messagesByPriority.reduce((acc: Record<MessagePriority, number>, item: any) => {
        acc[item.priority] = item._count
        return acc
      }, {} as Record<MessagePriority, number>),
      averageResponseTime: 0, // Calcular baseado em timestamps
      activeConversations: 0 // Calcular baseado em conversas ativas
    }
  }

  async getTicketStats(departmentId?: string): Promise<TicketStats> {
    const where: any = {}
    if (departmentId) where.departmentId = departmentId

    const [
      totalTickets,
      openTickets,
      ticketsByStatus,
      ticketsByCategory,
      ticketsByPriority
    ] = await Promise.all([
      this.prisma.supportTicket.count({ where }),
      this.prisma.supportTicket.count({ 
        where: { ...where, status: { in: [TicketStatus.OPEN, TicketStatus.IN_PROGRESS] } }
      }),
      this.prisma.supportTicket.groupBy({
        by: ['status'],
        where,
        _count: true
      }),
      this.prisma.supportTicket.groupBy({
        by: ['category'],
        where,
        _count: true
      }),
      this.prisma.supportTicket.groupBy({
        by: ['priority'],
        where,
        _count: true
      })
    ])

    return {
      totalTickets,
      openTickets,
      ticketsByStatus: ticketsByStatus.reduce((acc: Record<TicketStatus, number>, item: any) => {
        acc[item.status] = item._count
        return acc
      }, {} as Record<TicketStatus, number>),
      ticketsByCategory: ticketsByCategory.reduce((acc: Record<TicketCategory, number>, item: any) => {
        acc[item.category] = item._count
        return acc
      }, {} as Record<TicketCategory, number>),
      ticketsByPriority: ticketsByPriority.reduce((acc: Record<MessagePriority, number>, item: any) => {
        acc[item.priority] = item._count
        return acc
      }, {} as Record<MessagePriority, number>),
      averageResolutionTime: 0 // Calcular baseado em timestamps
    }
  }

  // ===== MÉTODOS PRIVADOS =====

  private async validateSendPermissions(senderId: string, messageType: MessageType, departmentId?: string): Promise<void> {
    // Implementar validação de permissões baseada no role do usuário
    const user = await this.prisma.employee.findUnique({
      where: { id: senderId },
      select: { role: true, isActive: true }
    })

    if (!user || !user.isActive) {
      throw new Error('Usuário não encontrado ou inativo')
    }

    // Validações específicas por tipo de mensagem
    if (messageType === MessageType.DEPARTMENT && departmentId) {
      const isInDepartment = await this.prisma.department.findFirst({
        where: {
          id: departmentId,
          employees: {
            some: { id: senderId }
          }
        }
      })

      if (!isInDepartment) {
        throw new Error('Usuário não pertence ao departamento especificado')
      }
    }
  }

  private async sendMessageNotifications(message: any): Promise<void> {
    try {
      if (message.recipientId) {
        await this.notificationService.createNotification({
          userId: message.recipientId,
          title: `Nova mensagem de ${message.sender.name}`,
          message: message.subject || message.content.substring(0, 100),
          type: 'new_message',
          priority: 'medium'
        })
      }

      if (message.messageType === MessageType.DEPARTMENT && message.departmentId) {
        const department = await this.prisma.department.findUnique({
          where: { id: message.departmentId },
          include: { employees: true }
        })

        if (department) {
          for (const employee of department.employees) {
            if (employee.id !== message.senderId) {
              await this.notificationService.createNotification({
                userId: employee.id,
                title: `Nova mensagem no departamento ${department.name}`,
                message: message.content.substring(0, 100),
                type: 'department_message',
                priority: 'medium'
              })
            }
          }
        }
      }
    } catch (error) {
      console.error('Erro ao enviar notificações de mensagem:', error)
    }
  }

  private async getThreadId(parentMessageId: string): Promise<string> {
    const parentMessage = await this.prisma.message.findUnique({
      where: { id: parentMessageId },
      select: { threadId: true, id: true }
    })

    return parentMessage?.threadId || parentMessage?.id || parentMessageId
  }

  private getDefaultChatPermissions(roomType: ChatRoomType): any {
    return {
      canSendMessages: true,
      canSendFiles: true,
      canDeleteOwnMessages: true,
      canDeleteAnyMessage: false,
      canManageParticipants: false,
      canArchiveRoom: false
    }
  }

  private async canManageChatRoom(chatRoomId: string, userId: string): Promise<boolean> {
    const participant = await this.prisma.chatParticipant.findFirst({
      where: {
        chatRoomId,
        userId,
        isActive: true
      },
      select: { permissions: true }
    })

    return participant?.permissions?.canManageParticipants || false
  }

  private async generateTicketNumber(): Promise<string> {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    
    const count = await this.prisma.supportTicket.count({
      where: {
        createdAt: {
          gte: new Date(year, today.getMonth(), today.getDate()),
          lt: new Date(year, today.getMonth(), today.getDate() + 1)
        }
      }
    })

    return `${year}${month}${day}-${String(count + 1).padStart(4, '0')}`
  }

  private async notifyDepartmentNewTicket(ticket: any): Promise<void> {
    try {
      if (ticket.departmentId) {
        const department = await this.prisma.department.findUnique({
          where: { id: ticket.departmentId },
          include: { employees: true }
        })

        if (department) {
          for (const employee of department.employees) {
            await this.notificationService.createNotification({
              userId: employee.id,
              title: 'Novo ticket de suporte',
              message: `Ticket #${ticket.ticketNumber}: ${ticket.subject}`,
              type: 'new_ticket',
              priority: 'medium'
            })
          }
        }
      }
    } catch (error) {
      console.error('Erro ao notificar departamento sobre novo ticket:', error)
    }
  }

  private async getUserRole(userId: string): Promise<string> {
    const user = await this.prisma.employee.findUnique({
      where: { id: userId },
      select: { role: true }
    })

    return user?.role || 'client'
  }

  private formatMessage(message: any): Message {
    return {
      id: message.id,
      senderId: message.senderId,
      senderName: message.sender?.name || '',
      senderRole: message.sender?.role,
      recipientId: message.recipientId,
      recipientName: message.recipient?.name,
      departmentId: message.departmentId,
      departmentName: message.department?.name,
      subject: message.subject,
      content: message.content,
      messageType: message.messageType,
      priority: message.priority,
      status: message.status,
      attachments: message.attachments || [],
      parentMessageId: message.parentMessageId,
      threadId: message.threadId,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
      readAt: message.readAt,
      metadata: message.metadata
    }
  }

  private formatChatRoom(chatRoom: any): ChatRoom {
    return {
      id: chatRoom.id,
      name: chatRoom.name,
      description: chatRoom.description,
      type: chatRoom.type,
      departmentId: chatRoom.departmentId,
      createdBy: chatRoom.createdBy,
      participants: chatRoom.participants?.map((p: any) => ({
        userId: p.userId,
        userName: p.user?.name || '',
        userRole: p.user?.role || '',
        joinedAt: p.joinedAt,
        lastSeen: p.lastSeen,
        permissions: p.permissions,
        isActive: p.isActive
      })) || [],
      lastMessage: chatRoom.messages?.[0] ? this.formatMessage(chatRoom.messages[0]) : undefined,
      lastActivity: chatRoom.lastActivity,
      isActive: chatRoom.isActive,
      settings: chatRoom.settings,
      createdAt: chatRoom.createdAt,
      updatedAt: chatRoom.updatedAt
    }
  }

  private formatSupportTicket(ticket: any): SupportTicket {
    return {
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      clientId: ticket.clientId,
      clientName: ticket.client?.name,
      employeeId: ticket.employeeId,
      employeeName: ticket.employee?.name,
      subject: ticket.subject,
      description: ticket.description,
      category: ticket.category,
      priority: ticket.priority,
      status: ticket.status,
      assignedTo: ticket.assignedTo,
      assignedToName: ticket.assignedToUser?.name,
      departmentId: ticket.departmentId,
      tags: ticket.tags || [],
      messages: ticket.messages?.map(this.formatMessage) || [],
      attachments: ticket.attachments || [],
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      resolvedAt: ticket.resolvedAt,
      closedAt: ticket.closedAt,
      metadata: ticket.metadata
    }
  }
}