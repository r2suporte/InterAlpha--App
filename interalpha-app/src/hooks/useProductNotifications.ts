/**
 * Hook para gerenciar notificações de produtos
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Notification } from '@/types/notifications'

export interface UseProductNotificationsReturn {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  error: string | null
  markAsRead: (notificationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (notificationId: string) => Promise<void>
  refreshNotifications: () => Promise<void>
}

export function useProductNotifications(): UseProductNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Buscar notificações
  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/notifications?category=products&limit=50')
      const result = await response.json()

      if (result.success) {
        setNotifications(result.data.notifications)
        setUnreadCount(result.data.unreadCount)
      } else {
        setError(result.error || 'Erro ao carregar notificações')
      }
    } catch (err) {
      setError('Erro de conexão')
      console.error('Erro ao buscar notificações:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Marcar como lida
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST'
      })

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId 
              ? { ...n, read: true, readAt: new Date().toISOString() }
              : n
          )
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (err) {
      console.error('Erro ao marcar notificação como lida:', err)
    }
  }, [])

  // Marcar todas como lidas
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST'
      })

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => ({ 
            ...n, 
            read: true, 
            readAt: new Date().toISOString() 
          }))
        )
        setUnreadCount(0)
      }
    } catch (err) {
      console.error('Erro ao marcar todas como lidas:', err)
    }
  }, [])

  // Excluir notificação
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        const wasUnread = notifications.find(n => n.id === notificationId)?.read === false
        
        setNotifications(prev => prev.filter(n => n.id !== notificationId))
        
        if (wasUnread) {
          setUnreadCount(prev => Math.max(0, prev - 1))
        }
      }
    } catch (err) {
      console.error('Erro ao excluir notificação:', err)
    }
  }, [notifications])

  // Atualizar notificações
  const refreshNotifications = useCallback(async () => {
    await fetchNotifications()
  }, [fetchNotifications])

  // Carregar notificações na inicialização
  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Polling para atualizações (opcional)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNotifications()
    }, 30000) // Atualizar a cada 30 segundos

    return () => clearInterval(interval)
  }, [fetchNotifications])

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications
  }
}

/**
 * Hook para notificações específicas de um produto
 */
export function useProductSpecificNotifications(productId: string) {
  const { notifications, ...rest } = useProductNotifications()

  const productNotifications = notifications.filter(notification => 
    notification.data?.productId === productId
  )

  return {
    notifications: productNotifications,
    ...rest
  }
}

/**
 * Hook para notificações de margem baixa
 */
export function useLowMarginNotifications() {
  const { notifications, ...rest } = useProductNotifications()

  const lowMarginNotifications = notifications.filter(notification => 
    notification.type === 'low_profit_margin'
  )

  return {
    notifications: lowMarginNotifications,
    ...rest
  }
}