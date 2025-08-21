export interface Message {
  id: string
  senderId: string
  senderName: string
  senderRole?: string
  recipientId?: string
  recipientName?: string
  departmentId?: string
  departmentName?: string
  subject?: string
  content: string
  messageType: MessageType
  priority: MessagePriority
  status: MessageStatus
  attachments?: MessageAttachment[]
  parentMessageId?: string
  threadId?: string
  createdAt: Date
  updatedAt: Date
  readAt?: Date
  metadata?: Record<string, any>
}

export enum MessageType {
  DIRECT = 'direct',
  DEPARTMENT = 'department',
  BROADCAST = 'broadcast',
  SUPPORT_TICKET = 'support_ticket',
  SYSTEM = 'system'
}

export enum MessagePriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum MessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  ARCHIVED = 'archived'
}

export interface MessageAttachment {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  url: string
  uploadedAt: Date
}

export interface ChatRoom {
  id: string
  name: string
  description?: string
  type: ChatRoomType
  departmentId?: string
  createdBy: string
  participants: ChatParticipant[]
  lastMessage?: Message
  lastActivity: Date
  isActive: boolean
  settings: ChatRoomSettings
  createdAt: Date
  updatedAt: Date
}

export enum ChatRoomType {
  DIRECT = 'direct',
  DEPARTMENT = 'department',
  PROJECT = 'project',
  SUPPORT = 'support',
  GENERAL = 'general'
}

export interface ChatParticipant {
  userId: string
  userName: string
  userRole: string
  joinedAt: Date
  lastSeen?: Date
  permissions: ChatPermissions
  isActive: boolean
}

export interface ChatPermissions {
  canSendMessages: boolean
  canSendFiles: boolean
  canDeleteOwnMessages: boolean
  canDeleteAnyMessage: boolean
  canManageParticipants: boolean
  canArchiveRoom: boolean
}

export interface ChatRoomSettings {
  allowFileUploads: boolean
  maxFileSize: number
  allowedFileTypes: string[]
  messageRetentionDays: number
  requireApproval: boolean
  moderatorIds: string[]
}

export interface SupportTicket {
  id: string
  ticketNumber: string
  clientId?: string
  clientName?: string
  employeeId?: string
  employeeName?: string
  subject: string
  description: string
  category: TicketCategory
  priority: MessagePriority
  status: TicketStatus
  assignedTo?: string
  assignedToName?: string
  departmentId?: string
  tags: string[]
  messages: Message[]
  attachments: MessageAttachment[]
  createdAt: Date
  updatedAt: Date
  resolvedAt?: Date
  closedAt?: Date
  metadata?: Record<string, any>
}

export enum TicketCategory {
  TECHNICAL = 'technical',
  BILLING = 'billing',
  GENERAL = 'general',
  COMPLAINT = 'complaint',
  FEATURE_REQUEST = 'feature_request',
  BUG_REPORT = 'bug_report'
}

export enum TicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  WAITING_CLIENT = 'waiting_client',
  WAITING_INTERNAL = 'waiting_internal',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
  CANCELLED = 'cancelled'
}

export interface Department {
  id: string
  name: string
  description?: string
  managerId?: string
  managerName?: string
  employeeIds: string[]
  chatRoomId?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface MessageFilters {
  senderId?: string
  recipientId?: string
  departmentId?: string
  messageType?: MessageType
  priority?: MessagePriority
  status?: MessageStatus
  dateFrom?: Date
  dateTo?: Date
  searchTerm?: string
  hasAttachments?: boolean
  isRead?: boolean
  limit?: number
  offset?: number
}

export interface ChatRoomFilters {
  type?: ChatRoomType
  departmentId?: string
  participantId?: string
  isActive?: boolean
  hasUnreadMessages?: boolean
  lastActivityFrom?: Date
  lastActivityTo?: Date
  limit?: number
  offset?: number
}

export interface TicketFilters {
  clientId?: string
  employeeId?: string
  assignedTo?: string
  departmentId?: string
  category?: TicketCategory
  priority?: MessagePriority
  status?: TicketStatus
  dateFrom?: Date
  dateTo?: Date
  searchTerm?: string
  tags?: string[]
  limit?: number
  offset?: number
}

export interface MessageStats {
  totalMessages: number
  unreadMessages: number
  messagesByType: Record<MessageType, number>
  messagesByPriority: Record<MessagePriority, number>
  averageResponseTime: number
  activeConversations: number
}

export interface TicketStats {
  totalTickets: number
  openTickets: number
  ticketsByStatus: Record<TicketStatus, number>
  ticketsByCategory: Record<TicketCategory, number>
  ticketsByPriority: Record<MessagePriority, number>
  averageResolutionTime: number
  customerSatisfactionScore?: number
}

export interface CommunicationPreferences {
  userId: string
  emailNotifications: boolean
  pushNotifications: boolean
  smsNotifications: boolean
  notificationTypes: {
    directMessages: boolean
    departmentMessages: boolean
    supportTickets: boolean
    systemMessages: boolean
  }
  quietHours: {
    enabled: boolean
    startTime: string
    endTime: string
  }
  autoReply: {
    enabled: boolean
    message: string
    startDate?: Date
    endDate?: Date
  }
}

export interface OnlineStatus {
  userId: string
  status: UserStatus
  lastSeen: Date
  currentActivity?: string
}

export enum UserStatus {
  ONLINE = 'online',
  AWAY = 'away',
  BUSY = 'busy',
  OFFLINE = 'offline'
}