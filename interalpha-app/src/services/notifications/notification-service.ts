import { prisma } from '@/lib/prisma';
import { 
  Notification, 
  NotificationType, 
  NotificationPriority, 
  NotificationCategory,
  NotificationPreferences,
  NotificationTemplate
} from '@/types/notifications';
import { EmailService } from './email-service';
import { SMSService } from './sms-service';
import { PushNotificationService } from './push-notification-service';

export class NotificationService {
  private emailService: EmailService;
  private smsService: SMSService;
  private pushService: PushNotificationService;

  constructor() {
    this.emailService = new EmailService();
    this.smsService = new SMSService();
    this.pushService = new PushNotificationService();
  }

  /**
   * Enviar notificação (alias para createNotification)
   */
  async send(params: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    priority?: NotificationPriority;
    category?: NotificationCategory;
    data?: Record<string, any>;
    actionUrl?: string;
    actionLabel?: string;
    expiresAt?: Date;
    channels?: ('email' | 'sms' | 'push' | 'in_app')[];
  }): Promise<Notification> {
    return this.createNotification(params);
  }

  /**
   * Criar e enviar notificação
   */
  async createNotification(params: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    priority?: NotificationPriority;
    category?: NotificationCategory;
    data?: Record<string, any>;
    actionUrl?: string;
    actionLabel?: string;
    expiresAt?: Date;
    channels?: ('email' | 'sms' | 'push' | 'in_app')[];
  }): Promise<Notification> {
    const {
      userId,
      type,
      title,
      message,
      priority = 'medium',
      category = 'general',
      data = {},
      actionUrl,
      actionLabel,
      expiresAt,
      channels = ['in_app']
    } = params;

    // Criar notificação no banco
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        priority,
        category,
        data,
        actionUrl,
        actionLabel,
        expiresAt,
        read: false
      }
    });

    // Buscar preferências do usuário
    const preferences = await this.getUserPreferences(userId);

    // Enviar através dos canais especificados
    await this.sendThroughChannels(notification, channels, preferences);

    return this.formatNotification(notification);
  }

  /**
   * Buscar notificações do usuário
   */
  async getUserNotifications(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      unreadOnly?: boolean;
      category?: NotificationCategory;
      priority?: NotificationPriority;
    } = {}
  ): Promise<{
    notifications: Notification[];
    total: number;
    unreadCount: number;
  }> {
    const {
      limit = 20,
      offset = 0,
      unreadOnly = false,
      category,
      priority
    } = options;

    const where: any = {
      userId,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } }
      ]
    };

    if (unreadOnly) {
      where.read = false;
    }

    if (category) {
      where.category = category;
    }

    if (priority) {
      where.priority = priority;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' }
        ],
        take: limit,
        skip: offset
      }),

      prisma.notification.count({ where }),

      prisma.notification.count({
        where: {
          userId,
          read: false,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        }
      })
    ]);

    return {
      notifications: notifications.map(this.formatNotification),
      total,
      unreadCount
    };
  }

  /**
   * Marcar notificação como lida
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId
      },
      data: {
        read: true,
        readAt: new Date()
      }
    });
  }

  /**
   * Marcar todas as notificações como lidas
   */
  async markAllAsRead(userId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: {
        userId,
        read: false
      },
      data: {
        read: true,
        readAt: new Date()
      }
    });
  }

  /**
   * Deletar notificação
   */
  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    await prisma.notification.deleteMany({
      where: {
        id: notificationId,
        userId
      }
    });
  }

  /**
   * Buscar estatísticas de notificações
   */
  async getNotificationStats(userId: string): Promise<any> {
    const [total, unread, byCategory, byPriority] = await Promise.all([
      prisma.notification.count({
        where: {
          userId,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        }
      }),

      prisma.notification.count({
        where: {
          userId,
          read: false,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        }
      }),

      prisma.notification.groupBy({
        by: ['category'],
        where: {
          userId,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        },
        _count: true
      }),

      prisma.notification.groupBy({
        by: ['priority'],
        where: {
          userId,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        },
        _count: true
      })
    ]);

    const recentCount = await prisma.notification.count({
      where: {
        userId,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // últimas 24 horas
        }
      }
    });

    return {
      total,
      unread,
      byCategory: byCategory.reduce((acc, item) => {
        acc[item.category] = item._count;
        return acc;
      }, {} as Record<string, number>),
      byPriority: byPriority.reduce((acc, item) => {
        acc[item.priority] = item._count;
        return acc;
      }, {} as Record<string, number>),
      recentCount
    };
  }

  /**
   * Buscar preferências do usuário
   */
  async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    const preferences = await prisma.notificationPreferences.findUnique({
      where: { userId }
    });

    if (!preferences) {
      // Criar preferências padrão
      return await this.createDefaultPreferences(userId);
    }

    return preferences as any;
  }

  /**
   * Atualizar preferências do usuário
   */
  async updateUserPreferences(
    userId: string, 
    preferences: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    const updated = await prisma.notificationPreferences.upsert({
      where: { userId },
      update: preferences,
      create: {
        userId,
        ...preferences
      }
    });

    return updated as any;
  }

  /**
   * Enviar notificação através dos canais especificados
   */
  private async sendThroughChannels(
    notification: any,
    channels: ('email' | 'sms' | 'push' | 'in_app')[],
    preferences: NotificationPreferences
  ): Promise<void> {
    const promises = [];

    for (const channel of channels) {
      if (!this.shouldSendThroughChannel(channel, notification.category, preferences)) {
        continue;
      }

      switch (channel) {
        case 'email':
          if (preferences.emailEnabled) {
            promises.push(this.sendEmailNotification(notification));
          }
          break;

        case 'sms':
          if (preferences.smsEnabled) {
            promises.push(this.sendSMSNotification(notification));
          }
          break;

        case 'push':
          if (preferences.pushEnabled) {
            promises.push(this.sendPushNotification(notification));
          }
          break;

        case 'in_app':
          // In-app já foi criada no banco
          break;
      }
    }

    await Promise.allSettled(promises);
  }

  /**
   * Verificar se deve enviar através do canal
   */
  private shouldSendThroughChannel(
    channel: 'email' | 'sms' | 'push' | 'in_app',
    category: NotificationCategory,
    preferences: NotificationPreferences
  ): boolean {
    if (!preferences.categories[category]) {
      return false;
    }

    return preferences.categories[category][channel];
  }

  /**
   * Enviar notificação por email
   */
  private async sendEmailNotification(notification: any): Promise<void> {
    try {
      const user = await prisma.employee.findUnique({
        where: { id: notification.userId },
        select: { email: true, name: true }
      });

      if (!user?.email) return;

      await this.emailService.sendNotificationEmail({
        to: user.email,
        subject: notification.title,
        template: 'notification',
        data: {
          userName: user.name,
          title: notification.title,
          message: notification.message,
          actionUrl: notification.actionUrl,
          actionLabel: notification.actionLabel
        }
      });
    } catch (error) {
      console.error('Erro ao enviar email de notificação:', error);
    }
  }

  /**
   * Enviar notificação por SMS
   */
  private async sendSMSNotification(notification: any): Promise<void> {
    try {
      const user = await prisma.employee.findUnique({
        where: { id: notification.userId },
        select: { phone: true }
      });

      if (!user?.phone) return;

      await this.smsService.sendSMS({
        to: user.phone,
        message: `${notification.title}: ${notification.message}`
      });
    } catch (error) {
      console.error('Erro ao enviar SMS de notificação:', error);
    }
  }

  /**
   * Enviar push notification
   */
  private async sendPushNotification(notification: any): Promise<void> {
    try {
      await this.pushService.sendPushNotification({
        userId: notification.userId,
        title: notification.title,
        body: notification.message,
        data: notification.data,
        actionUrl: notification.actionUrl
      });
    } catch (error) {
      console.error('Erro ao enviar push notification:', error);
    }
  }

  /**
   * Criar preferências padrão
   */
  private async createDefaultPreferences(userId: string): Promise<NotificationPreferences> {
    const defaultPreferences = {
      userId,
      emailEnabled: true,
      smsEnabled: false,
      pushEnabled: true,
      inAppEnabled: true,
      categories: {
        orders: { email: true, sms: false, push: true, inApp: true },
        payments: { email: true, sms: false, push: true, inApp: true },
        users: { email: true, sms: false, push: false, inApp: true },
        system: { email: true, sms: false, push: false, inApp: true },
        security: { email: true, sms: true, push: true, inApp: true },
        integrations: { email: true, sms: false, push: false, inApp: true },
        general: { email: false, sms: false, push: false, inApp: true },
        communication: { email: true, sms: false, push: true, inApp: true },
        calendar: { email: true, sms: false, push: false, inApp: true },
        products: { email: true, sms: false, push: true, inApp: true }
      },
      quietHours: {
        enabled: false,
        startTime: '22:00',
        endTime: '08:00'
      },
      frequency: 'immediate' as const
    };

    const created = await prisma.notificationPreferences.create({
      data: defaultPreferences
    });

    return created as any;
  }

  /**
   * Formatar notificação para o frontend
   */
  private formatNotification(notification: any): Notification {
    return {
      id: notification.id,
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data || {},
      read: notification.read,
      priority: notification.priority,
      category: notification.category,
      createdAt: notification.createdAt.toISOString(),
      readAt: notification.readAt?.toISOString(),
      expiresAt: notification.expiresAt?.toISOString(),
      actionUrl: notification.actionUrl,
      actionLabel: notification.actionLabel
    };
  }

  /**
   * Limpar notificações expiradas
   */
  async cleanupExpiredNotifications(): Promise<number> {
    const result = await prisma.notification.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    });

    return result.count;
  }
}