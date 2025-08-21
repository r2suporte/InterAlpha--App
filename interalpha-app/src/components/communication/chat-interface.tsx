'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Send, 
  Paperclip, 
  MoreVertical, 
  Users, 
  Phone, 
  Video,
  Search,
  Filter
} from 'lucide-react'
import { 
  Message, 
  ChatRoom, 
  MessageType, 
  MessagePriority, 
  UserStatus,
  OnlineStatus 
} from '@/types/communication'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ChatInterfaceProps {
  currentUserId: string
  selectedRoom?: ChatRoom
  onRoomSelect: (room: ChatRoom) => void
  onSendMessage: (content: string, type: MessageType, priority?: MessagePriority) => void
}

export function ChatInterface({ 
  currentUserId, 
  selectedRoom, 
  onRoomSelect, 
  onSendMessage 
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([])
  const [onlineUsers, setOnlineUsers] = useState<OnlineStatus[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadChatRooms()
    loadOnlineUsers()
    
    // Atualizar usuários online a cada 30 segundos
    const interval = setInterval(loadOnlineUsers, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (selectedRoom) {
      loadMessages()
    }
  }, [selectedRoom])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadChatRooms = async () => {
    try {
      const response = await fetch('/api/communication/chat-rooms')
      const data = await response.json()
      
      if (data.success) {
        setChatRooms(data.data)
      }
    } catch (error) {
      console.error('Erro ao carregar salas de chat:', error)
    }
  }

  const loadMessages = async () => {
    if (!selectedRoom) return

    try {
      setLoading(true)
      const response = await fetch(
        `/api/communication/messages?messageType=${MessageType.DIRECT}&recipientId=${selectedRoom.id}`
      )
      const data = await response.json()
      
      if (data.success) {
        setMessages(data.data)
      }
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadOnlineUsers = async () => {
    try {
      const response = await fetch('/api/communication/online-status')
      const data = await response.json()
      
      if (data.success) {
        setOnlineUsers(data.data)
      }
    } catch (error) {
      console.error('Erro ao carregar usuários online:', error)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedRoom) return

    try {
      const response = await fetch('/api/communication/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: newMessage,
          messageType: MessageType.DIRECT,
          recipientId: selectedRoom.participants.find(p => p.userId !== currentUserId)?.userId,
          priority: MessagePriority.NORMAL
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setMessages(prev => [...prev, data.data])
        setNewMessage('')
        onSendMessage(newMessage, MessageType.DIRECT)
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const getMessageTime = (date: Date) => {
    return formatDistanceToNow(new Date(date), { 
      addSuffix: true, 
      locale: ptBR 
    })
  }

  const getUserStatus = (userId: string): UserStatus => {
    const user = onlineUsers.find(u => u.userId === userId)
    return user?.status || UserStatus.OFFLINE
  }

  const getStatusColor = (status: UserStatus) => {
    switch (status) {
      case UserStatus.ONLINE: return 'bg-green-500'
      case UserStatus.AWAY: return 'bg-yellow-500'
      case UserStatus.BUSY: return 'bg-red-500'
      default: return 'bg-gray-400'
    }
  }

  const filteredRooms = chatRooms.filter(room =>
    room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.participants.some(p => 
      p.userName.toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  return (
    <div className="flex h-full bg-white rounded-lg shadow-sm border">
      {/* Lista de Salas de Chat */}
      <div className="w-1/3 border-r">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Conversas</h2>
            <Button size="sm" variant="outline">
              <Users className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar conversas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <ScrollArea className="h-[calc(100%-120px)]">
          <div className="p-2">
            {filteredRooms.map((room) => {
              const otherParticipant = room.participants.find(p => p.userId !== currentUserId)
              const userStatus = otherParticipant ? getUserStatus(otherParticipant.userId) : UserStatus.OFFLINE
              
              return (
                <div
                  key={room.id}
                  onClick={() => onRoomSelect(room)}
                  className={`flex items-center p-3 rounded-lg cursor-pointer hover:bg-gray-50 ${
                    selectedRoom?.id === room.id ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                >
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {otherParticipant?.userName.charAt(0).toUpperCase() || 'G'}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(userStatus)}`} />
                  </div>
                  
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {room.name}
                      </p>
                      {room.lastMessage && (
                        <p className="text-xs text-gray-500">
                          {getMessageTime(room.lastMessage.createdAt)}
                        </p>
                      )}
                    </div>
                    
                    {room.lastMessage && (
                      <p className="text-sm text-gray-500 truncate">
                        {room.lastMessage.content}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Área de Chat */}
      <div className="flex-1 flex flex-col">
        {selectedRoom ? (
          <>
            {/* Header do Chat */}
            <div className="p-4 border-b bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {selectedRoom.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium">{selectedRoom.name}</h3>
                    <p className="text-xs text-gray-500">
                      {selectedRoom.participants.length} participantes
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button size="sm" variant="ghost">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Mensagens */}
            <ScrollArea className="flex-1 p-4">
              {loading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => {
                    const isOwn = message.senderId === currentUserId
                    
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          isOwn 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-100 text-gray-900'
                        }`}>
                          {!isOwn && (
                            <p className="text-xs font-medium mb-1">
                              {message.senderName}
                            </p>
                          )}
                          
                          <p className="text-sm">{message.content}</p>
                          
                          <div className="flex items-center justify-between mt-1">
                            <p className={`text-xs ${
                              isOwn ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              {getMessageTime(message.createdAt)}
                            </p>
                            
                            {message.priority !== MessagePriority.NORMAL && (
                              <Badge 
                                variant={message.priority === MessagePriority.URGENT ? 'destructive' : 'secondary'}
                                className="text-xs"
                              >
                                {message.priority}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Input de Mensagem */}
            <div className="p-4 border-t">
              <div className="flex items-center space-x-2">
                <Button size="sm" variant="ghost">
                  <Paperclip className="h-4 w-4" />
                </Button>
                
                <div className="flex-1">
                  <Input
                    placeholder="Digite sua mensagem..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                  />
                </div>
                
                <Button 
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Selecione uma conversa
              </h3>
              <p className="text-gray-500">
                Escolha uma conversa para começar a trocar mensagens
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}