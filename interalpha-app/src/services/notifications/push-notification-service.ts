import { prisma } from '@/lib/prisma';

interface PushNotificationPayload {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  actionUrl?: string;
  icon?: string;
  badge?: string;
  tag?: string;
}

interface PushSubscription {
  userId: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userAgent?: string;
  isActive: boolean;
}

export class PushNotificationService {
  private vapidKeys = {
    publicKey: process.env.VAPID_PUBLIC_KEY || '',
    privateKey: process.env.VAPID_PRIVATE_KEY || '',
    subject: process.env.VAPID_SUBJECT || 'mailto:admin@interalpha.com'
  };

  /**
   * Registrar subscription de push notification
   */
  async registerSubscription(
    userId: string,
    subscription: {
      endpoint: string;
      keys: { p256dh: string; auth: string };
      userAgent?: string;
    }
  ): Promise<void> {
    try {
      await prisma.pushSubscription.upsert({
        where: {
          userId_endpoint: {
            userId,
            endpoint: subscription.endpoint
          }
        },
        update: {
          keys: subscription.keys,
          userAgent: subscription.userAgent,
          isActive: true,
          updatedAt: new Date()
        },
        create: {
          userId,
          endpoint: subscription.endpoint,
          keys: subscription.keys,
          userAgent: subscription.userAgent,
          isActive: true
        }
      });
    } catch (error) {
      console.error('Erro ao registrar push subscription:', error);
      throw error;
    }
  }

  /**
   * Remover subscription
   */
  async unregisterSubscription(userId: string, endpoint: string): Promise<void> {
    try {
      await prisma.pushSubscription.updateMany({
        where: {
          userId,
          endpoint
        },
        data: {
          isActive: false
        }
      });
    } catch (error) {
      console.error('Erro ao remover push subscription:', error);
      throw error;
    }
  }

  /**
   * Enviar push notification
   */
  async sendPushNotification(payload: PushNotificationPayload): Promise<void> {
    try {
      // Buscar subscriptions ativas do usuário
      const subscriptions = await prisma.pushSubscription.findMany({
        where: {
          userId: payload.userId,
          isActive: true
        }
      });

      if (subscriptions.length === 0) {
        console.log(`Nenhuma subscription ativa encontrada para usuário ${payload.userId}`);
        return;
      }

      // Preparar payload da notificação
      const notificationPayload = {
        title: payload.title,
        body: payload.body,
        icon: payload.icon || '/icons/notification-icon.png',
        badge: payload.badge || '/icons/badge-icon.png',
        tag: payload.tag || 'default',
        data: {
          ...payload.data,
          actionUrl: payload.actionUrl,
          timestamp: Date.now()
        },
        actions: payload.actionUrl ? [
          {
            action: 'open',
            title: 'Abrir',
            icon: '/icons/open-icon.png'
          },
          {
            action: 'dismiss',
            title: 'Dispensar',
            icon: '/icons/close-icon.png'
          }
        ] : [],
        requireInteraction: payload.data?.priority === 'urgent',
        silent: false
      };

      // Enviar para todas as subscriptions
      const sendPromises = subscriptions.map(async (subscription) => {
        try {
          await this.sendToSubscription(subscription, notificationPayload);
        } catch (error) {
          console.error(`Erro ao enviar push para subscription ${subscription.endpoint}:`, error);
          
          // Se a subscription é inválida, desativar
          if (this.isSubscriptionInvalid(error)) {
            await this.unregisterSubscription(payload.userId, subscription.endpoint);
          }
        }
      });

      await Promise.allSettled(sendPromises);

      // Log da notificação enviada
      await this.logPushNotification(payload, subscriptions.length);

    } catch (error) {
      console.error('Erro ao enviar push notification:', error);
      throw error;
    }
  }

  /**
   * Enviar push notification para múltiplos usuários
   */
  async sendBulkPushNotification(
    userIds: string[],
    payload: Omit<PushNotificationPayload, 'userId'>
  ): Promise<void> {
    const sendPromises = userIds.map(userId =>
      this.sendPushNotification({ ...payload, userId })
    );

    await Promise.allSettled(sendPromises);
  }

  /**
   * Buscar subscriptions do usuário
   */
  async getUserSubscriptions(userId: string): Promise<PushSubscription[]> {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: {
        userId,
        isActive: true
      }
    });

    return subscriptions.map(sub => ({
      userId: sub.userId,
      endpoint: sub.endpoint,
      keys: sub.keys as { p256dh: string; auth: string },
      userAgent: sub.userAgent || undefined,
      isActive: sub.isActive
    }));
  }

  /**
   * Testar push notification
   */
  async testPushNotification(userId: string): Promise<void> {
    await this.sendPushNotification({
      userId,
      title: 'Teste de Notificação',
      body: 'Esta é uma notificação de teste do sistema InterAlpha.',
      data: {
        type: 'test',
        timestamp: Date.now()
      }
    });
  }

  /**
   * Enviar para uma subscription específica
   */
  private async sendToSubscription(
    subscription: any,
    payload: any
  ): Promise<void> {
    // Em produção, usar uma biblioteca como web-push
    // Por enquanto, simular o envio
    
    if (!this.vapidKeys.publicKey || !this.vapidKeys.privateKey) {
      console.warn('VAPID keys não configuradas. Push notifications não serão enviadas.');
      return;
    }

    // Simular envio (em produção, usar web-push)
    console.log(`Push notification enviada para ${subscription.endpoint}:`, {
      title: payload.title,
      body: payload.body,
      data: payload.data
    });

    // Em produção, seria algo como:
    /*
    const webpush = require('web-push');
    
    webpush.setVapidDetails(
      this.vapidKeys.subject,
      this.vapidKeys.publicKey,
      this.vapidKeys.privateKey
    );

    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: subscription.keys
      },
      JSON.stringify(payload)
    );
    */
  }

  /**
   * Verificar se erro indica subscription inválida
   */
  private isSubscriptionInvalid(error: any): boolean {
    // Códigos de erro que indicam subscription inválida
    const invalidCodes = [410, 413, 400];
    return invalidCodes.includes(error.statusCode) || 
           error.message?.includes('invalid') ||
           error.message?.includes('expired');
  }

  /**
   * Log da notificação push
   */
  private async logPushNotification(
    payload: PushNotificationPayload,
    subscriptionCount: number
  ): Promise<void> {
    try {
      await prisma.pushNotificationLog.create({
        data: {
          userId: payload.userId,
          title: payload.title,
          body: payload.body,
          data: payload.data || {},
          subscriptionCount,
          sentAt: new Date()
        }
      });
    } catch (error) {
      console.error('Erro ao fazer log da push notification:', error);
    }
  }

  /**
   * Limpar subscriptions inativas
   */
  async cleanupInactiveSubscriptions(): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await prisma.pushSubscription.deleteMany({
      where: {
        isActive: false,
        updatedAt: {
          lt: thirtyDaysAgo
        }
      }
    });

    return result.count;
  }

  /**
   * Estatísticas de push notifications
   */
  async getPushStats(userId?: string): Promise<{
    totalSubscriptions: number;
    activeSubscriptions: number;
    totalSent: number;
    sentToday: number;
  }> {
    const where = userId ? { userId } : {};
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalSubscriptions, activeSubscriptions, totalSent, sentToday] = await Promise.all([
      prisma.pushSubscription.count({ where }),
      
      prisma.pushSubscription.count({
        where: { ...where, isActive: true }
      }),
      
      prisma.pushNotificationLog.count({ where }),
      
      prisma.pushNotificationLog.count({
        where: {
          ...where,
          sentAt: { gte: today }
        }
      })
    ]);

    return {
      totalSubscriptions,
      activeSubscriptions,
      totalSent,
      sentToday
    };
  }
}