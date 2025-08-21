'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Send, 
  Users, 
  Hash, 
  Settings,
  UserPlus,
  Search,
  AlertTriangle,
  Info
} from 'lucide-react'
import { 
  Message, 
  ChatRoom, 
  MessageType, 
  MessagePriority, 
  ChatRoomType,
  OnlineStatus,
  UserStatus,
  Department 
} from '@/types/communication'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface DepartmentChatProps {
  currentUserId: string
  userRole: string
  departments: Department[]
}

export function DepartmentChat({ currentUserId, userRole, departments }: DepartmentChatProps) {
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [messagePriority, setMessagePriority] = useState<MessagePriority>(MessagePriority.NORMAL)
  const [onlineUsers, setOnlineUsers] = useState<OnlineStatus[]>([])
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (departments.length > 0 && !selectedDepartment) {
      // Selecionar o primeiro departamento do usuário
      const userDepartment = departments.find(dept => 
        dept.employeeIds.includes(currentUserId)
      )
      if (userDepartment) {
        setSelectedDepartment(userDepartment)
      }
    }
  }, [departments, currentUserId])

  useEffect(() => {
    if (selectedDepartment) {
      loadDepartmentMessages()
      loadOnlineUsers()
    }
  }, [selectedDepartment])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadDepartmentMessages = async () => {
    if (!selectedDepartment) return

    try {
      setLoading(true)
      const response = await fetch(
        `/api/communication/messages?messageType=${MessageType.DEPARTMENT}&departmentId=${selectedDepartment.id}`
      )
      const data = await response.json()
      
      if (data.success) {
        setMessages(data.data)
      }
    } catch (error) {
      console.error('Erro ao carregar mensagens do departamento:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadOnlineUsers = async () => {
    if (!selectedDepartment) return

    try {
      const response = await fetch(
        `/api/communication/online-status?departmentId=${selectedDepartment.id}`
      )
      const data = await response.json()
      
      if (data.success) {
        setOnlineUsers(data.data)
      }
    } catch (error) {
      console.error('Erro ao carregar usuários online:', error)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedDepartment) return

    try {
      const response = await fetch('/api/communication/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: newMessage,
          messageType: MessageType.DEPARTMENT,
          departmentId: selectedDepartment.id,
          priority: messagePriority
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setMessages(prev => [...prev, data.data])
        setNewMessage('')
        setMessagePriority(MessagePriority.NORMAL)
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

  const getPriorityIcon = (priority: MessagePriority) => {
    switch (priority) {
      case MessagePriority.URGENT:
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case MessagePriority.HIGH:
        return <AlertTriangle className="h-4 w-4 text-orange-500" />
      case MessagePriority.LOW:
        return <Info className="h-4 w-4 text-gray-400" />
      default:
        return null
    }
  }

  const getPriorityColor = (priority: MessagePriority) => {
    switch (priority) {
      case MessagePriority.URGENT: return 'bg-red-100 text-red-800 border-red-200'
      case MessagePriority.HIGH: return 'bg-orange-100 text-orange-800 border-orange-200'
      case MessagePriority.LOW: return 'bg-gray-100 text-gray-600 border-gray-200'
      default: return ''
    }
  }

  return (
    <div className="flex h-full bg-white rounded-lg shadow-sm border">
      {/* Sidebar - Departamentos */}
      <div className="w-80 border-r bg-gray-50">
        <div className="p-4 border-b bg-white">
          <h2 className="text-lg font-semibold mb-3">Departamentos</h2>
          
          <div className="space-y-2">
            {departments.map((department) => (
              <div
                key={department.id}
                onClick={() => setSelectedDepartment(department)}
                className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedDepartment?.id === department.id 
                    ? 'bg-blue-100 border-blue-200 text-blue-900' 
                    : 'hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center justify-center w-8 h-8 bg-blue-500 text-white rounded-lg mr-3">
                  <Hash className="h-4 w-4" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{department.name}</p>
                  <p className="text-sm text-gray-500">
                    {department.employeeIds.length} membros
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Membros Online */}
        {selectedDepartment && (
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Membros Online ({onlineUsers.length})
            </h3>
            
            <div className="space-y-2">
              {onlineUsers.map((user) => (
                <div key={user.userId} className="flex items-center">
                  <div className="relative">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {user.userId.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(user.status)}`} />
                  </div>
                  
                  <div className="ml-2 flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">Usuário</p>
                    {user.currentActivity && (
                      <p className="text-xs text-gray-500 truncate">
                        {user.currentActivity}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Área Principal do Chat */}
      <div className="flex-1 flex flex-col">
        {selectedDepartment ? (
          <>
            {/* Header */}
            <div className="p-4 border-b bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex items-center justify-center w-10 h-10 bg-blue-500 text-white rounded-lg mr-3">
                    <Hash className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{selectedDepartment.name}</h3>
                    <p className="text-sm text-gray-500">
                      {selectedDepartment.description || 'Chat do departamento'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button size="sm" variant="ghost">
                    <UserPlus className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Settings className="h-4 w-4" />
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
                      <div key={message.id} className="flex items-start space-x-3">
                        {!isOwn && (
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {message.senderName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        
                        <div className={`flex-1 ${isOwn ? 'ml-12' : ''}`}>
                          <div className="flex items-center space-x-2 mb-1">
                            <span className={`text-sm font-medium ${
                              isOwn ? 'text-blue-600' : 'text-gray-900'
                            }`}>
                              {isOwn ? 'Você' : message.senderName}
                            </span>
                            
                            {message.senderRole && (
                              <Badge variant="secondary" className="text-xs">
                                {message.senderRole}
                              </Badge>
                            )}
                            
                            <span className="text-xs text-gray-500">
                              {getMessageTime(message.createdAt)}
                            </span>
                            
                            {message.priority !== MessagePriority.NORMAL && (
                              <div className="flex items-center">
                                {getPriorityIcon(message.priority)}
                              </div>
                            )}
                          </div>
                          
                          <div className={`p-3 rounded-lg ${
                            isOwn 
                              ? 'bg-blue-100 text-blue-900' 
                              : 'bg-gray-100 text-gray-900'
                          } ${message.priority !== MessagePriority.NORMAL ? getPriorityColor(message.priority) : ''}`}>
                            <p className="text-sm">{message.content}</p>
                          </div>
                        </div>
                        
                        {isOwn && (
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {message.senderName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Input de Mensagem */}
            <div className="p-4 border-t bg-white">
              <div className="flex items-center space-x-2 mb-2">
                <Select
                  value={messagePriority}
                  onValueChange={(value) => setMessagePriority(value as MessagePriority)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={MessagePriority.LOW}>Baixa</SelectItem>
                    <SelectItem value={MessagePriority.NORMAL}>Normal</SelectItem>
                    <SelectItem value={MessagePriority.HIGH}>Alta</SelectItem>
                    <SelectItem value={MessagePriority.URGENT}>Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="flex-1">
                  <Input
                    placeholder={`Mensagem para #${selectedDepartment.name}...`}
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
              <Hash className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Selecione um departamento
              </h3>
              <p className="text-gray-500">
                Escolha um departamento para participar do chat
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}