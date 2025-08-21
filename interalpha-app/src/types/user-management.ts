import { EmployeeRole, Permission, NotificationPreferences } from './auth'

export interface CreateEmployeeData {
  name: string
  email: string
  phone: string
  role: EmployeeRole
  department?: string
  customPermissions?: Permission[]
  expirationDate?: Date
  notificationPreferences: NotificationPreferences
  metadata?: EmployeeMetadata
}

export interface UpdateEmployeeData {
  name?: string
  email?: string
  phone?: string
  role?: EmployeeRole
  department?: string
  customPermissions?: Permission[]
  expirationDate?: Date
  notificationPreferences?: NotificationPreferences
  metadata?: EmployeeMetadata
}

export interface EmployeeMetadata {
  department?: string
  position?: string
  hireDate?: Date
  supervisor?: string
  workSchedule?: WorkSchedule
  emergencyContact?: EmergencyContact
  preferences?: UserPreferences
}

export interface WorkSchedule {
  monday?: TimeSlot[]
  tuesday?: TimeSlot[]
  wednesday?: TimeSlot[]
  thursday?: TimeSlot[]
  friday?: TimeSlot[]
  saturday?: TimeSlot[]
  sunday?: TimeSlot[]
  timezone: string
}

export interface TimeSlot {
  start: string // HH:MM format
  end: string   // HH:MM format
}

export interface EmergencyContact {
  name: string
  relationship: string
  phone: string
  email?: string
}

export interface UserPreferences {
  language: string
  theme: 'light' | 'dark' | 'auto'
  dateFormat: string
  timeFormat: '12h' | '24h'
  notifications: {
    email: boolean
    sms: boolean
    push: boolean
    desktop: boolean
  }
}

export interface EmployeeInvitation {
  id: string
  email: string
  role: EmployeeRole
  invitedBy: string
  invitedAt: Date
  expiresAt: Date
  status: InvitationStatus
  token: string
  acceptedAt?: Date
  rejectedAt?: Date
  metadata?: any
}

export enum InvitationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled'
}

export interface UserTransfer {
  id: string
  fromUserId: string
  toUserId: string
  transferredBy: string
  transferredAt: Date
  reason: string
  transferredItems: TransferredItem[]
  status: TransferStatus
  completedAt?: Date
}

export interface TransferredItem {
  type: string // 'orders', 'clients', 'projects', etc.
  itemId: string
  itemName: string
  transferred: boolean
  error?: string
}

export enum TransferStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export interface UserActivity {
  id: string
  userId: string
  action: string
  resource: string
  resourceId?: string
  timestamp: Date
  ipAddress: string
  userAgent: string
  success: boolean
  details?: any
}

export interface UserStats {
  userId: string
  totalLogins: number
  lastLogin?: Date
  totalActions: number
  actionsToday: number
  averageSessionDuration: number
  mostUsedFeatures: string[]
  performanceMetrics?: any
}

export interface BulkUserOperation {
  id: string
  operationType: 'create' | 'update' | 'deactivate' | 'transfer'
  initiatedBy: string
  initiatedAt: Date
  totalItems: number
  processedItems: number
  successfulItems: number
  failedItems: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  errors: BulkOperationError[]
  completedAt?: Date
}

export interface BulkOperationError {
  itemIndex: number
  itemData: any
  error: string
  timestamp: Date
}