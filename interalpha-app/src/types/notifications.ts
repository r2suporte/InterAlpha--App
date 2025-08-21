export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  priority: NotificationPriority;
  category: NotificationCategory;
  createdAt: string;
  readAt?: string;
  expiresAt?: string;
  actionUrl?: string;
  actionLabel?: string;
}

export type NotificationType = 
  | 'order_assigned'
  | 'order_completed'
  | 'order_overdue'
  | 'payment_approved'
  | 'payment_rejected'
  | 'user_invited'
  | 'system_alert'
  | 'security_event'
  | 'integration_error'
  | 'backup_completed'
  | 'maintenance_scheduled'
  | 'custom'
  | 'ticket_assigned'
  | 'ticket_updated'
  | 'new_message'
  | 'department_message'
  | 'new_ticket'
  | 'product_created'
  | 'product_updated'
  | 'product_deleted'
  | 'low_profit_margin'
  | 'significant_price_change'
  | 'margin_change'
  | 'product_used_in_order'
  | 'top_selling_products';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export type NotificationCategory = 
  | 'orders'
  | 'payments'
  | 'users'
  | 'system'
  | 'security'
  | 'integrations'
  | 'general'
  | 'communication'
  | 'calendar'
  | 'products';

export interface NotificationPreferences {
  userId: string;
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  inAppEnabled: boolean;
  categories: {
    [key in NotificationCategory]: {
      email: boolean;
      sms: boolean;
      push: boolean;
      inApp: boolean;
    };
  };
  quietHours: {
    enabled: boolean;
    startTime: string; // HH:mm format
    endTime: string;   // HH:mm format
  };
  frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
}

export interface NotificationTemplate {
  id: string;
  type: NotificationType;
  name: string;
  subject: string;
  emailTemplate: string;
  smsTemplate: string;
  pushTemplate: string;
  inAppTemplate: string;
  variables: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  byCategory: Record<NotificationCategory, number>;
  byPriority: Record<NotificationPriority, number>;
  recentCount: number;
}

export interface NotificationChannel {
  type: 'email' | 'sms' | 'push' | 'in_app';
  enabled: boolean;
  config: Record<string, any>;
}

export interface NotificationQueue {
  id: string;
  userId: string;
  type: NotificationType;
  channel: 'email' | 'sms' | 'push' | 'in_app';
  status: 'pending' | 'processing' | 'sent' | 'failed' | 'cancelled';
  priority: NotificationPriority;
  scheduledAt: string;
  sentAt?: string;
  failedAt?: string;
  retryCount: number;
  maxRetries: number;
  data: Record<string, any>;
  error?: string;
}