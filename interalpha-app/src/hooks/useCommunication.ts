'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  Message, 
  ChatRoom, 
  SupportTicket, 
  OnlineStatus,
  MessageStats,
  TicketStats,
  MessageType,
  MessagePriority,
  TicketStatus,
  UserStatus
} from '@/types/communication'

interface UseCommunicationProps {
  userId: string
  userRole: string
}

export function useCommunication({ userId, userRole }: UseCommunicationProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([])
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [onlineUsers, setOnlineUsers] = useState<OnlineStatus[]>([])
  const [messageStats, setMessageStats] = useState<MessageStats | null>(null)
  const [ticketStats, setTicketStats] = useState<TicketStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Carregar dados iniciais
  useEffect(() => {
    loadInitialData()
    
    // Configurar atualizações periódicas
    const interval = setInterval(() => {
      loadStats()
      loadOnlineUsers()
    }, 30000)

    return () => clearInterval(interval)
  }, [userId])

  const loadInitialData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        loadMessages(),
        loadChatRooms(),
        loadTickets(),
        loadStats(),
        loadOnlineUsers()
      ])
    } catch (err) {
      setError('Erro ao carregar dados de comunicação')
      console.error('Erro ao carregar dados:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = useCallback(async (filters?: any) => {
    try {
      const params = new URLSearchParams(filters || {})
      const response = await fetch(`/api/communication/messages?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setMessages(data.data)
      }
    } catch (err) {
      console.error('Erro ao carregar mensagens:', err)
    }
  }, [])

  const loadChatRooms = useCallback(async (filters?: any) => {
    try {
      const params = new URLSearchParams(filters || {})
      const response = await fetch(`/api/communication/chat-rooms?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setChatRooms(data.data)
      }
    } catch (err) {
      console.error('Erro ao carregar salas de chat:', err)
    }
  }, [])

  const loadTickets = useCallback(async (filters?: any) => {
    try {
      const params = new URLSearchParams(filters || {})
      const response = await fetch(`/api/communication/support-tickets?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setTickets(data.data)
      }
    } catch (err) {
      console.error('Erro ao carregar tickets:', err)
    }
  }, [])

  const loadStats = useCallback(async () => {
    try {
      const [messageResponse, ticketResponse] = await Promise.all([
        fetch('/api/communication/stats?type=messages'),
        fetch('/api/communication/stats?type=tickets')
      ])

      const [messageData, ticketData] = await Promise.all([
        messageResponse.json(),
        ticketResponse.json()
      ])

      if (messageData.success) {
        setMessageStats(messageData.data)
      }

      if (ticketData.success) {
        setTicketStats(ticketData.data)
      }
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err)
    }
  }, [])

  const loadOnlineUsers = useCallback(async (departmentId?: string) => {
    try {
      const params = departmentId ? `?departmentId=${departmentId}` : ''
      const response = await fetch(`/api/communication/online-status${params}`)
      const data = await response.json()
      
      if (data.success) {
        setOnlineUsers(data.data)
      }
    } catch (err) {
      console.error('Erro ao carregar usuários online:', err)
    }
  }, [])

  const sendMessage = useCallback(async (messageData: {
    content: string
    messageType: MessageType
    recipientId?: string
    departmentId?: string
    priority?: MessagePriority
    parentMessageId?: string
  }) => {
    try {
      const response = await fetch('/api/communication/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(messageData)
      })

      const data = await response.json()
      
      if (data.success) {
        setMessages(prev => [...prev, data.data])
        return data.data
      } else {
        throw new Error(data.error)
      }
    } catch (err) {
      setError('Erro ao enviar mensagem')
      throw err
    }
  }, [])

  const createChatRoom = useCallback(async (roomData: {
    name: string
    description?: string
    type: string
    departmentId?: string
    participantIds: string[]
  }) => {
    try {
      const response = await fetch('/api/communication/chat-rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(roomData)
      })

      const data = await response.json()
      
      if (data.success) {
        setChatRooms(prev => [data.data, ...prev])
        return data.data
      } else {
        throw new Error(data.error)
      }
    } catch (err) {
      setError('Erro ao criar sala de chat')
      throw err
    }
  }, [])

  const createTicket = useCallback(async (ticketData: {
    subject: string
    description: string
    category: string
    priority: MessagePriority
    clientId?: string
    departmentId?: string
  }) => {
    try {
      const response = await fetch('/api/communication/support-tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(ticketData)
      })

      const data = await response.json()
      
      if (data.success) {
        setTickets(prev => [data.data, ...prev])
        return data.data
      } else {
        throw new Error(data.error)
      }
    } catch (err) {
      setError('Erro ao criar ticket')
      throw err
    }
  }, [])

  const assignTicket = useCallback(async (ticketId: string, assignedTo: string) => {
    try {
      const response = await fetch(`/api/communication/support-tickets/${ticketId}/assign`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ assignedTo })
      })

      if (response.ok) {
        setTickets(prev => prev.map(ticket => 
          ticket.id === ticketId 
            ? { ...ticket, assignedTo, status: TicketStatus.IN_PROGRESS }
            : ticket
        ))
      } else {
        throw new Error('Erro ao atribuir ticket')
      }
    } catch (err) {
      setError('Erro ao atribuir ticket')
      throw err
    }
  }, [])

  const updateTicketStatus = useCallback(async (ticketId: string, status: TicketStatus) => {
    try {
      const response = await fetch(`/api/communication/support-tickets/${ticketId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      })

      if (response.ok) {
        setTickets(prev => prev.map(ticket => 
          ticket.id === ticketId 
            ? { ...ticket, status }
            : ticket
        ))
      } else {
        throw new Error('Erro ao atualizar status do ticket')
      }
    } catch (err) {
      setError('Erro ao atualizar status do ticket')
      throw err
    }
  }, [])

  const markMessageAsRead = useCallback(async (messageId: string) => {
    try {
      const response = await fetch(`/api/communication/messages/${messageId}/read`, {
        method: 'PATCH'
      })

      if (response.ok) {
        setMessages(prev => prev.map(message => 
          message.id === messageId 
            ? { ...message, status: 'read' as any, readAt: new Date() }
            : message
        ))
      }
    } catch (err) {
      console.error('Erro ao marcar mensagem como lida:', err)
    }
  }, [])

  const setUserStatus = useCallback(async (status: UserStatus, activity?: string) => {
    try {
      const response = await fetch('/api/communication/online-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status, activity })
      })

      if (response.ok) {
        setOnlineUsers(prev => prev.map(user => 
          user.userId === userId 
            ? { ...user, status, currentActivity: activity, lastSeen: new Date() }
            : user
        ))
      }
    } catch (err) {
      console.error('Erro ao atualizar status:', err)
    }
  }, [userId])

  const addParticipantToRoom = useCallback(async (roomId: string, participantId: string) => {
    try {
      const response = await fetch(`/api/communication/chat-rooms/${roomId}/participants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: participantId })
      })

      if (response.ok) {
        // Recarregar salas de chat para atualizar participantes
        await loadChatRooms()
      } else {
        throw new Error('Erro ao adicionar participante')
      }
    } catch (err) {
      setError('Erro ao adicionar participante')
      throw err
    }
  }, [loadChatRooms])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    // Estado
    messages,
    chatRooms,
    tickets,
    onlineUsers,
    messageStats,
    ticketStats,
    loading,
    error,

    // Ações
    sendMessage,
    createChatRoom,
    createTicket,
    assignTicket,
    updateTicketStatus,
    markMessageAsRead,
    setUserStatus,
    addParticipantToRoom,

    // Carregamento
    loadMessages,
    loadChatRooms,
    loadTickets,
    loadStats,
    loadOnlineUsers,
    
    // Utilitários
    clearError
  }
}