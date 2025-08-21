'use client'

import { useState, useCallback, useEffect } from 'react'
import { toast } from 'sonner'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  status: 'pending' | 'sent' | 'failed' | 'read'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  productId?: string
  product?: {
    partNumber: string
    description: string
  }
  channels: string[]
  readAt?: string
  createdAt: string
  sentAt?: string
  data?: any
}

interface NotificationFilters {
  type?: string
  status?: 'pending' | 'sent' | 'failed' | 'read'
  dateFrom?: string
  dateTo?: string
  recipientId?: string
  limit?: number
  offset?: number
}

interface NotificationConfig {
  type: string
  enabled: boolean
  channels: ('email' | 'sms' | 'push' | 'webhook')[]
  conditions?: {
    threshold?: number
    period?: number
    products?: string[]
    categories?: string[]
  }
  recipients: Array<{
    type: 'user' | 'email' | 'role'
    value: string
  }>
  schedule?: {
    frequency: 'immediate' | 'daily' | 'weekly' | 'monthly'
    time?: string
    days?: number[]
  }
}

export function useNotifications() {
  const [isLoading, setIsLoading] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [totalCount, setTotalCount] = useState(0)

  const fetchNotifications = useCallback(async (filters: NotificationFilters = {}) => {
    setIsLoading(true)
    try {
      const searchParams = new URLSearchParams()
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value))
        }
      })

      const response = await fetch(`/api/produtos/notificacoes?${searchParams.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao buscar notificações')
      }

      setNotifications(result.data)
      setUnreadCount(result.meta.unreadCount)
      setTotalCount(result.meta.total)

      return {
        success: true,
        data: result.data,
        meta: result.meta
      }

    } catch (error) {
      console.error('Erro ao buscar notificações:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao buscar notificações')
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const createNotification = useCallback(async (notification: {
    type: string
    title: string
    message: string
    productId?: string
    recipients?: any[]
    channels?: string[]
    priority?: string
    data?: any
  }) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/produtos/notificacoes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(notification)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao criar notificação')
      }

      toast.success('Notificação criada e enviada!')

      // Atualizar lista local
      await fetchNotifications()

      return {
        success: true,
        data: result.data
      }

    } catch (error) {
      console.error('Erro ao criar notificação:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao criar notificação')
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    } finally {
      setIsLoading(false)
    }
  }, [fetchNotifications])

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/produtos/notificacoes/${notificationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'mark_read' })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao marcar como lida')
      }

      // Atualizar estado local
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, status: 'read' as const, readAt: new Date().toISOString() }
            : notif
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))

      return { success: true }

    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao marcar como lida')
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  }, [])

  const markAsUnread = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/produtos/notificacoes/${notificationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'mark_unread' })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao marcar como não lida')
      }

      // Atualizar estado local
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, status: 'sent' as const, readAt: undefined }
            : notif
        )
      )
      setUnreadCount(prev => prev + 1)

      return { success: true }

    } catch (error) {
      console.error('Erro ao marcar notificação como não lida:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao marcar como não lida')
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  }, [])

  const archiveNotification = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/produtos/notificacoes/${notificationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'archive' })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao arquivar notificação')
      }

      // Remover da lista local
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId))
      setTotalCount(prev => prev - 1)

      toast.success('Notificação arquivada!')

      return { success: true }

    } catch (error) {
      console.error('Erro ao arquivar notificação:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao arquivar')
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  }, [])

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/produtos/notificacoes/${notificationId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao excluir notificação')
      }

      // Remover da lista local
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId))
      setTotalCount(prev => prev - 1)

      toast.success('Notificação excluída!')

      return { success: true }

    } catch (error) {
      console.error('Erro ao excluir notificação:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir')
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  }, [])

  const updateConfigurations = useCallback(async (configurations: NotificationConfig[]) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/produtos/notificacoes', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ configurations })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao atualizar configurações')
      }

      toast.success('Configurações de notificação atualizadas!')

      return {
        success: true,
        data: result.data
      }

    } catch (error) {
      console.error('Erro ao atualizar configurações:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar configurações')
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    try {
      // Marcar todas as não lidas como lidas
      const unreadNotifications = notifications.filter(n => n.status !== 'read')
      
      await Promise.all(
        unreadNotifications.map(notif => markAsRead(notif.id))
      )

      toast.success(`${unreadNotifications.length} notificações marcadas como lidas!`)

      return { success: true }

    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error)
      toast.error('Erro ao marcar todas como lidas')
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  }, [notifications, markAsRead])

  // Auto-refresh notifications periodically
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNotifications({ limit: 50 })
    }, 30000) // Refresh every 30 seconds

    return () => clearInterval(interval)
  }, [fetchNotifications])

  return {
    // State
    isLoading,
    notifications,
    unreadCount,
    totalCount,
    
    // Actions
    fetchNotifications,
    createNotification,
    markAsRead,
    markAsUnread,
    archiveNotification,
    deleteNotification,
    updateConfigurations,
    markAllAsRead
  }
}