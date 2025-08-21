'use client'

import React, { useState, useEffect, memo, useCallback, useMemo } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  MessageSquare, 
  Users, 
  Headphones, 
  Hash,
  Bell,
  Settings
} from 'lucide-react'
import { ChatInterface } from './chat-interface'
import { SupportTicketManager } from './support-ticket-manager'
import { DepartmentChat } from './department-chat'
import { 
  ChatRoom, 
  MessageType, 
  MessagePriority, 
  Department,
  MessageStats,
  TicketStats
} from '@/types/communication'

interface CommunicationHubProps {
  currentUserId: string
  userRole: string
  userName: string
}

export function CommunicationHub({ currentUserId, userRole, userName }: CommunicationHubProps) {
  const [selectedChatRoom, setSelectedChatRoom] = useState<ChatRoom | null>(null)
  const [departments, setDepartments] = useState<Department[]>([])
  const [messageStats, setMessageStats] = useState<MessageStats | null>(null)
  const [ticketStats, setTicketStats] = useState<TicketStats | null>(null)
  const [activeTab, setActiveTab] = useState('direct-messages')
  const [unreadCounts, setUnreadCounts] = useState({
    directMessages: 0,
    departmentMessages: 0,
    supportTickets: 0
  })

  useEffect(() => {
    loadDepartments()
    loadStats()
    loadUnreadCounts()
    
    // Atualizar estatísticas a cada 30 segundos
    const interval = setInterval(() => {
      loadStats()
      loadUnreadCounts()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const loadDepartments = async () => {
    try {
      // Assumindo que existe uma API para buscar departamentos
      const response = await fetch('/api/departments')
      const data = await response.json()
      
      if (data.success) {
        setDepartments(data.data)
      }
    } catch (error) {
      console.error('Erro ao carregar departamentos:', error)
    }
  }

  const loadStats = async () => {
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
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    }
  }

  const loadUnreadCounts = async () => {
    try {
      // Simular contagem de mensagens não lidas
      // Em uma implementação real, isso viria de APIs específicas
      setUnreadCounts({
        directMessages: messageStats?.unreadMessages || 0,
        departmentMessages: 2, // Exemplo
        supportTickets: ticketStats?.openTickets || 0
      })
    } catch (error) {
      console.error('Erro ao carregar contadores:', error)
    }
  }

  const handleSendMessage = useCallback((content: string, type: MessageType, priority?: MessagePriority) => {
    // Callback para quando uma mensagem é enviada
    // Atualizar estatísticas localmente
    if (messageStats) {
      setMessageStats(prev => prev ? {
        ...prev,
        totalMessages: prev.totalMessages + 1
      } : null)
    }
  }, [messageStats])

  const handleRoomSelect = useCallback((room: ChatRoom) => {
    setSelectedChatRoom(room)
  }, [])

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case 'direct-messages':
        return <MessageSquare className="h-4 w-4" />
      case 'department-chat':
        return <Hash className="h-4 w-4" />
      case 'support-tickets':
        return <Headphones className="h-4 w-4" />
      default:
        return <MessageSquare className="h-4 w-4" />
    }
  }

  const getTabLabel = useMemo(() => (tab: string, count: number) => {
    const labels = {
      'direct-messages': 'Mensagens Diretas',
      'department-chat': 'Chat Departamental',
      'support-tickets': 'Suporte'
    }

    return (
      <div className="flex items-center space-x-2">
        {getTabIcon(tab)}
        <span>{labels[tab as keyof typeof labels]}</span>
        {count > 0 && (
          <Badge variant="destructive" className="ml-1 px-1.5 py-0.5 text-xs">
            {count > 99 ? '99+' : count}
          </Badge>
        )}
      </div>
    )
  }, [])

  return (
    <div className="h-full bg-gray-50">
      <div className="p-6 bg-white border-b">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Central de Comunicação</h1>
            <p className="text-gray-600">
              Gerencie mensagens, chat departamental e tickets de suporte
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Resumo de Estatísticas */}
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              {messageStats && (
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4" />
                  <span>{messageStats.totalMessages} mensagens</span>
                </div>
              )}
              
              {ticketStats && (
                <div className="flex items-center space-x-2">
                  <Headphones className="h-4 w-4" />
                  <span>{ticketStats.openTickets} tickets abertos</span>
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>{departments.length} departamentos</span>
              </div>
            </div>
            
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Configurações
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 h-[calc(100%-120px)]">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="direct-messages" className="flex items-center">
              {getTabLabel('direct-messages', unreadCounts.directMessages)}
            </TabsTrigger>
            <TabsTrigger value="department-chat" className="flex items-center">
              {getTabLabel('department-chat', unreadCounts.departmentMessages)}
            </TabsTrigger>
            <TabsTrigger value="support-tickets" className="flex items-center">
              {getTabLabel('support-tickets', unreadCounts.supportTickets)}
            </TabsTrigger>
          </TabsList>

          <div className="h-[calc(100%-60px)]">
            <TabsContent value="direct-messages" className="h-full mt-0">
              <ChatInterface
                currentUserId={currentUserId}
                selectedRoom={selectedChatRoom}
                onRoomSelect={handleRoomSelect}
                onSendMessage={handleSendMessage}
              />
            </TabsContent>

            <TabsContent value="department-chat" className="h-full mt-0">
              <DepartmentChat
                currentUserId={currentUserId}
                userRole={userRole}
                departments={departments}
              />
            </TabsContent>

            <TabsContent value="support-tickets" className="h-full mt-0">
              <SupportTicketManager
                currentUserId={currentUserId}
                userRole={userRole}
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}

// Memoizar o componente para evitar re-renders desnecessários
export default memo(CommunicationHub)