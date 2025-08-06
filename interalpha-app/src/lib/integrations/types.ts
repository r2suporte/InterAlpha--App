// Tipos para o sistema de integrações

export enum NotificationType {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  WHATSAPP = 'WHATSAPP',
  PUSH = 'PUSH',
}

export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
}

export enum ConversationStatus {
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
  ARCHIVED = 'ARCHIVED',
}

export enum MessageDirection {
  INBOUND = 'INBOUND',
  OUTBOUND = 'OUTBOUND',
}

export enum MessageType {
  TEXT = 'TEXT',
  MEDIA = 'MEDIA',
  TEMPLATE = 'TEMPLATE',
}

export enum SyncStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  CONFLICT = 'CONFLICT',
}

export enum ExecutionStatus {
  RUNNING = 'RUNNING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum BackupStatus {
  CREATING = 'CREATING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  VALIDATED = 'VALIDATED',
}

// Interfaces para serviços
export interface NotificationTemplate {
  id: string;
  type: NotificationType;
  subject?: string;
  body: string;
  variables: string[];
}

export interface NotificationService {
  sendEmail(to: string, template: string, data: any): Promise<void>;
  sendSMS(to: string, message: string): Promise<void>;
  scheduleNotification(notification: any, delay: number): Promise<void>;
}

export interface WhatsAppService {
  sendMessage(to: string, message: string): Promise<void>;
  sendTemplate(to: string, templateName: string, params: any[]): Promise<void>;
  handleIncomingMessage(webhook: any): Promise<void>;
}

export interface AccountingAdapter {
  syncPayment(payment: any): Promise<SyncResult>;
  syncInvoice(invoice: any): Promise<SyncResult>;
  handleConflict(conflict: DataConflict): Promise<Resolution>;
}

export interface AnalyticsEngine {
  calculateKPIs(period: DateRange): Promise<KPIData>;
  generateTrends(metric: string, period: DateRange): Promise<TrendData>;
  exportReport(format: 'pdf' | 'excel', data: ReportData): Promise<Buffer>;
}

export interface WorkflowEngine {
  executeWorkflow(trigger: WorkflowTrigger): Promise<void>;
  scheduleWorkflow(workflow: Workflow, schedule: Schedule): Promise<void>;
  evaluateRules(context: WorkflowContext): Promise<Action[]>;
}

export interface CalendarService {
  createEvent(event: CalendarEvent): Promise<string>;
  updateEvent(eventId: string, updates: Partial<CalendarEvent>): Promise<void>;
  checkAvailability(timeSlot: TimeSlot): Promise<boolean>;
  syncWithExternalCalendar(calendarId: string): Promise<void>;
}

export interface BackupService {
  createBackup(): Promise<BackupResult>;
  scheduleBackup(schedule: BackupSchedule): Promise<void>;
  validateBackup(backupId: string): Promise<ValidationResult>;
  restoreFromBackup(backupId: string): Promise<RestoreResult>;
}

export interface APIGateway {
  authenticate(token: string): Promise<any>;
  rateLimit(clientId: string): Promise<boolean>;
  logRequest(request: APIRequest): Promise<void>;
  handleRequest(endpoint: string, data: any): Promise<APIResponse>;
}

// Tipos auxiliares
export interface DateRange {
  start: Date;
  end: Date;
}

export interface SyncResult {
  success: boolean;
  externalId?: string;
  error?: string;
}

export interface DataConflict {
  entityId: string;
  localData: any;
  externalData: any;
  conflictFields: string[];
}

export interface Resolution {
  action: 'use_local' | 'use_external' | 'merge';
  mergedData?: any;
}

export interface KPIData {
  revenue: number;
  activeOrders: number;
  conversionRate: number;
  customerSatisfaction: number;
}

export interface TrendData {
  labels: string[];
  values: number[];
  trend: 'up' | 'down' | 'stable';
}

export interface ReportData {
  title: string;
  period: DateRange;
  data: any[];
  charts?: any[];
}

export interface WorkflowTrigger {
  type: string;
  entityId: string;
  data: any;
}

export interface Workflow {
  id: string;
  name: string;
  trigger: any;
  actions: Action[];
}

export interface Schedule {
  cron: string;
  timezone?: string;
}

export interface WorkflowContext {
  trigger: WorkflowTrigger;
  entities: any;
}

export interface Action {
  type: string;
  config: any;
}

export interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: { dateTime: string; timeZone?: string };
  end: { dateTime: string; timeZone?: string };
  attendees?: { email: string }[];
}

export interface TimeSlot {
  start: Date;
  end: Date;
  calendarId?: string;
}

export interface BackupResult {
  id: string;
  filename: string;
  size: number;
  checksum: string;
}

export interface BackupSchedule {
  cron: string;
  type: 'full' | 'incremental';
  retention: number;
}

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
}

export interface RestoreResult {
  success: boolean;
  restoredTables: string[];
  errors?: string[];
}

export interface APIRequest {
  method: string;
  endpoint: string;
  clientId?: string;
  data?: any;
  timestamp: Date;
}

export interface APIResponse {
  statusCode: number;
  data?: any;
  error?: string;
}

// Tipos para jobs de fila
export interface EmailJob {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
}

export interface SMSJob {
  to: string;
  message: string;
}

export interface WhatsAppJob {
  to: string;
  message: string;
  template?: string;
  templateParams?: Record<string, any>;
}