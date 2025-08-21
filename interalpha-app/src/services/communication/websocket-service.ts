'use client'

import { Message, SupportTicket, OnlineStatus, UserStatus } from '@/types/communication'

export interface WebSocketMessage {
  type: 'message' | 'ticket_update' | 'user_status' | 'typing' | 'notification' | 'auth' | 'ping' | 'join_room' | 'leave_room'
  data: any
  timestamp: number
  userId?: string
  roomId?: string
}

export class WebSocketService {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private heartbeatInterval: NodeJS.Timeout | null = null
  private listeners: Map<string, Set<(data: any) => void>> = new Map()
  private isConnected = false
  private userId: string | null = null

  constructor() {
    if (typeof window !== 'undefined') {
      this.connect()
    }
  }

  connect(userId?: string) {
    if (userId) {
      this.userId = userId
    }

    if (this.ws?.readyState === WebSocket.OPEN) {
      return
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const wsUrl = `${protocol}//${window.location.host}/api/ws`
      
      this.ws = new WebSocket(wsUrl)

      this.ws.onopen = () => {
        console.log('WebSocket conectado')
        this.isConnected = true
        this.reconnectAttempts = 0
        this.startHeartbeat()

        // Autenticar usuário se disponível
        if (this.userId) {
          this.send({
            type: 'auth',
            data: { userId: this.userId },
            timestamp: Date.now()
          })
        }

        this.emit('connected', null)
      }

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          this.handleMessage(message)
        } catch (error) {
          console.error('Erro ao processar mensagem WebSocket:', error)
        }
      }

      this.ws.onclose = (event) => {
        console.log('WebSocket desconectado:', event.code, event.reason)
        this.isConnected = false
        this.stopHeartbeat()
        this.emit('disconnected', { code: event.code, reason: event.reason })

        // Tentar reconectar se não foi fechamento intencional
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect()
        }
      }

      this.ws.onerror = (error) => {
        console.error('Erro WebSocket:', error)
        this.emit('error', error)
      }

    } catch (error) {
      console.error('Erro ao conectar WebSocket:', error)
      this.scheduleReconnect()
    }
  }

  private scheduleReconnect() {
    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
    
    console.log(`Tentando reconectar em ${delay}ms (tentativa ${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
    
    setTimeout(() => {
      this.connect()
    }, delay)
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({
          type: 'ping',
          data: {},
          timestamp: Date.now()
        })
      }
    }, 30000) // Ping a cada 30 segundos
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  private handleMessage(message: WebSocketMessage) {
    switch (message.type) {
      case 'message':
        this.emit('new_message', message.data as Message)
        break
      
      case 'ticket_update':
        this.emit('ticket_updated', message.data as SupportTicket)
        break
      
      case 'user_status':
        this.emit('user_status_changed', message.data as OnlineStatus)
        break
      
      case 'typing':
        this.emit('user_typing', message.data)
        break
      
      case 'notification':
        this.emit('notification', message.data)
        break
      
      default:
        console.log('Tipo de mensagem WebSocket desconhecido:', message.type)
    }
  }

  send(message: WebSocketMessage) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    } else {
      console.warn('WebSocket não está conectado. Mensagem não enviada:', message)
    }
  }

  // Métodos específicos para diferentes tipos de mensagem
  sendMessage(message: Message) {
    this.send({
      type: 'message',
      data: message,
      timestamp: Date.now(),
      userId: this.userId || undefined,
      roomId: message.departmentId || message.recipientId
    })
  }

  updateUserStatus(status: UserStatus, activity?: string) {
    this.send({
      type: 'user_status',
      data: {
        userId: this.userId,
        status,
        activity,
        lastSeen: new Date()
      },
      timestamp: Date.now()
    })
  }

  sendTypingIndicator(roomId: string, isTyping: boolean) {
    this.send({
      type: 'typing',
      data: {
        userId: this.userId,
        roomId,
        isTyping
      },
      timestamp: Date.now(),
      roomId
    })
  }

  joinRoom(roomId: string) {
    this.send({
      type: 'join_room',
      data: { roomId },
      timestamp: Date.now(),
      roomId
    })
  }

  leaveRoom(roomId: string) {
    this.send({
      type: 'leave_room',
      data: { roomId },
      timestamp: Date.now(),
      roomId
    })
  }

  // Sistema de eventos
  on(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)
  }

  off(event: string, callback: (data: any) => void) {
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      eventListeners.delete(callback)
    }
  }

  private emit(event: string, data: any) {
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`Erro ao executar callback para evento ${event}:`, error)
        }
      })
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close(1000, 'Desconexão intencional')
      this.ws = null
    }
    this.stopHeartbeat()
    this.listeners.clear()
  }

  get connected() {
    return this.isConnected
  }

  get readyState() {
    return this.ws?.readyState || WebSocket.CLOSED
  }
}

// Singleton para uso global
let wsInstance: WebSocketService | null = null

export function getWebSocketService(): WebSocketService {
  if (!wsInstance) {
    wsInstance = new WebSocketService()
  }
  return wsInstance
}

// Hook React para usar WebSocket
import React from 'react'

export function useWebSocket(userId?: string) {
  const [ws] = React.useState(() => getWebSocketService())
  const [connected, setConnected] = React.useState(ws.connected)

  React.useEffect(() => {
    if (userId) {
      ws.connect(userId)
    }

    const handleConnect = () => setConnected(true)
    const handleDisconnect = () => setConnected(false)

    ws.on('connected', handleConnect)
    ws.on('disconnected', handleDisconnect)

    return () => {
      ws.off('connected', handleConnect)
      ws.off('disconnected', handleDisconnect)
    }
  }, [ws, userId])

  return { ws, connected }
}