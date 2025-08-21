'use client';

import { useState, useEffect, useCallback } from 'react';
import { Notification, NotificationStats } from '@/types/notifications';

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats>({
    total: 0,
    unread: 0,
    byCategory: {
      system: 0,
      security: 0,
      orders: 0,
      payments: 0,
      communication: 0,
      calendar: 0,
      general: 0
    },
    byPriority: {
      low: 0,
      medium: 0,
      high: 0,
      urgent: 0
    },
    recentCount: 0
  });
  const [loading, setLoading] = useState(true);

  // Buscar notificações
  const fetchNotifications = useCallback(async (options: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
    category?: string;
    priority?: string;
  } = {}) => {
    try {
      const params = new URLSearchParams();
      if (options.limit) params.append('limit', options.limit.toString());
      if (options.offset) params.append('offset', options.offset.toString());
      if (options.unreadOnly) params.append('unreadOnly', 'true');
      if (options.category) params.append('category', options.category);
      if (options.priority) params.append('priority', options.priority);

      const response = await fetch(`/api/notifications?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
        return data;
      }
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Buscar estatísticas
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/stats');
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
        return data;
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    }
  }, []);

  // Marcar como lida
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH'
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId 
              ? { ...n, read: true, readAt: new Date().toISOString() }
              : n
          )
        );
        
        setStats(prev => ({
          ...prev,
          unread: Math.max(0, prev.unread - 1)
        }));
        
        return true;
      }
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
    }
    return false;
  }, []);

  // Marcar todas como lidas
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PATCH'
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => ({ 
            ...n, 
            read: true, 
            readAt: new Date().toISOString() 
          }))
        );
        
        setStats(prev => ({
          ...prev,
          unread: 0
        }));
        
        return true;
      }
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
    return false;
  }, []);

  // Deletar notificação
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        const notification = notifications.find(n => n.id === notificationId);
        
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        
        setStats(prev => ({
          ...prev,
          total: Math.max(0, prev.total - 1),
          unread: notification && !notification.read 
            ? Math.max(0, prev.unread - 1) 
            : prev.unread
        }));
        
        return true;
      }
    } catch (error) {
      console.error('Erro ao deletar notificação:', error);
    }
    return false;
  }, [notifications]);

  // Criar notificação
  const createNotification = useCallback(async (notification: {
    userId: string;
    type: string;
    title: string;
    message: string;
    priority?: string;
    category?: string;
    data?: Record<string, any>;
    actionUrl?: string;
    actionLabel?: string;
    expiresAt?: string;
    channels?: string[];
  }) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notification),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Atualizar lista local se a notificação for para o usuário atual
        if (data.notification) {
          setNotifications(prev => [data.notification, ...prev]);
          setStats(prev => ({
            ...prev,
            total: prev.total + 1,
            unread: prev.unread + 1
          }));
        }
        
        return data.notification;
      }
    } catch (error) {
      console.error('Erro ao criar notificação:', error);
    }
    return null;
  }, []);

  // Registrar push notification
  const registerPushNotification = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications não são suportadas neste navegador');
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      });

      const response = await fetch('/api/notifications/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription,
          userAgent: navigator.userAgent
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Erro ao registrar push notification:', error);
      return false;
    }
  }, []);

  // Inicializar
  useEffect(() => {
    fetchNotifications();
    fetchStats();
  }, [fetchNotifications, fetchStats]);

  // Polling para atualizações
  useEffect(() => {
    const interval = setInterval(() => {
      fetchStats();
    }, 30000); // A cada 30 segundos

    return () => clearInterval(interval);
  }, [fetchStats]);

  return {
    notifications,
    stats,
    loading,
    fetchNotifications,
    fetchStats,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification,
    registerPushNotification
  };
}