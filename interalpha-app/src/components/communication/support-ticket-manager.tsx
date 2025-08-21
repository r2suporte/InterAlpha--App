'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  Plus, 
  Search, 
  Filter, 
  Clock, 
  User, 
  AlertCircle,
  CheckCircle,
  XCircle,
  MessageSquare,
  Paperclip
} from 'lucide-react'
import { 
  SupportTicket, 
  TicketCategory, 
  TicketStatus, 
  MessagePriority,
  TicketStats 
} from '@/types/communication'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface SupportTicketManagerProps {
  currentUserId: string
  userRole: string
}

export function SupportTicketManager({ currentUserId, userRole }: SupportTicketManagerProps) {
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [stats, setStats] = useState<TicketStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all')
  const [categoryFilter, setCategoryFilter] = useState<TicketCategory | 'all'>('all')
  const [priorityFilter, setPriorityFilter] = useState<MessagePriority | 'all'>('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  // Form para novo ticket
  const [newTicket, setNewTicket] = useState({
    subject: '',
    description: '',
    category: TicketCategory.GENERAL,
    priority: MessagePriority.NORMAL,
    clientId: ''
  })

  useEffect(() => {
    loadTickets()
    loadStats()
  }, [statusFilter, categoryFilter, priorityFilter])

  const loadTickets = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (categoryFilter !== 'all') params.append('category', categoryFilter)
      if (priorityFilter !== 'all') params.append('priority', priorityFilter)
      if (searchTerm) params.append('searchTerm', searchTerm)

      const response = await fetch(`/api/communication/support-tickets?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setTickets(data.data)
      }
    } catch (error) {
      console.error('Erro ao carregar tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const response = await fetch('/api/communication/stats?type=tickets')
      const data = await response.json()
      
      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    }
  }

  const handleCreateTicket = async () => {
    try {
      const response = await fetch('/api/communication/support-tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newTicket)
      })

      const data = await response.json()
      
      if (data.success) {
        setTickets(prev => [data.data, ...prev])
        setShowCreateDialog(false)
        setNewTicket({
          subject: '',
          description: '',
          category: TicketCategory.GENERAL,
          priority: MessagePriority.NORMAL,
          clientId: ''
        })
      }
    } catch (error) {
      console.error('Erro ao criar ticket:', error)
    }
  }

  const handleAssignTicket = async (ticketId: string, assignedTo: string) => {
    try {
      const response = await fetch(`/api/communication/support-tickets/${ticketId}/assign`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ assignedTo })
      })

      if (response.ok) {
        loadTickets()
        if (selectedTicket?.id === ticketId) {
          setSelectedTicket(prev => prev ? { ...prev, assignedTo, assignedToName: 'Usuário' } : null)
        }
      }
    } catch (error) {
      console.error('Erro ao atribuir ticket:', error)
    }
  }

  const handleUpdateStatus = async (ticketId: string, status: TicketStatus) => {
    try {
      const response = await fetch(`/api/communication/support-tickets/${ticketId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      })

      if (response.ok) {
        loadTickets()
        if (selectedTicket?.id === ticketId) {
          setSelectedTicket(prev => prev ? { ...prev, status } : null)
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
    }
  }

  const getStatusIcon = (status: TicketStatus) => {
    switch (status) {
      case TicketStatus.OPEN:
        return <AlertCircle className="h-4 w-4 text-blue-500" />
      case TicketStatus.IN_PROGRESS:
        return <Clock className="h-4 w-4 text-yellow-500" />
      case TicketStatus.RESOLVED:
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case TicketStatus.CLOSED:
        return <XCircle className="h-4 w-4 text-gray-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case TicketStatus.OPEN: return 'bg-blue-100 text-blue-800'
      case TicketStatus.IN_PROGRESS: return 'bg-yellow-100 text-yellow-800'
      case TicketStatus.RESOLVED: return 'bg-green-100 text-green-800'
      case TicketStatus.CLOSED: return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: MessagePriority) => {
    switch (priority) {
      case MessagePriority.URGENT: return 'bg-red-100 text-red-800'
      case MessagePriority.HIGH: return 'bg-orange-100 text-orange-800'
      case MessagePriority.NORMAL: return 'bg-blue-100 text-blue-800'
      case MessagePriority.LOW: return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredTickets = tickets.filter(ticket =>
    ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.ticketNumber.includes(searchTerm)
  )

  return (
    <div className="h-full bg-white rounded-lg shadow-sm border">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Tickets de Suporte</h2>
          
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Ticket
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Criar Novo Ticket</DialogTitle>
                <DialogDescription>
                  Preencha as informações do ticket de suporte
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Assunto</label>
                  <Input
                    value={newTicket.subject}
                    onChange={(e) => setNewTicket(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Descreva brevemente o problema"
                  />
                </div>
                
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Descrição</label>
                  <Textarea
                    value={newTicket.description}
                    onChange={(e) => setNewTicket(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descreva detalhadamente o problema"
                    rows={4}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Categoria</label>
                    <Select
                      value={newTicket.category}
                      onValueChange={(value) => setNewTicket(prev => ({ ...prev, category: value as TicketCategory }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={TicketCategory.TECHNICAL}>Técnico</SelectItem>
                        <SelectItem value={TicketCategory.BILLING}>Financeiro</SelectItem>
                        <SelectItem value={TicketCategory.GENERAL}>Geral</SelectItem>
                        <SelectItem value={TicketCategory.COMPLAINT}>Reclamação</SelectItem>
                        <SelectItem value={TicketCategory.FEATURE_REQUEST}>Solicitação</SelectItem>
                        <SelectItem value={TicketCategory.BUG_REPORT}>Bug</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Prioridade</label>
                    <Select
                      value={newTicket.priority}
                      onValueChange={(value) => setNewTicket(prev => ({ ...prev, priority: value as MessagePriority }))}
                    >
                      <SelectTrigger>
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
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateTicket}>
                  Criar Ticket
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Estatísticas */}
        {stats && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total</p>
                    <p className="text-2xl font-bold">{stats.totalTickets}</p>
                  </div>
                  <MessageSquare className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Abertos</p>
                    <p className="text-2xl font-bold">{stats.openTickets}</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Resolvidos</p>
                    <p className="text-2xl font-bold">{stats.ticketsByStatus[TicketStatus.RESOLVED] || 0}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Tempo Médio</p>
                    <p className="text-2xl font-bold">{Math.round(stats.averageResolutionTime)}h</p>
                  </div>
                  <Clock className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filtros */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar tickets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as TicketStatus | 'all')}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value={TicketStatus.OPEN}>Aberto</SelectItem>
              <SelectItem value={TicketStatus.IN_PROGRESS}>Em Progresso</SelectItem>
              <SelectItem value={TicketStatus.RESOLVED}>Resolvido</SelectItem>
              <SelectItem value={TicketStatus.CLOSED}>Fechado</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value as TicketCategory | 'all')}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value={TicketCategory.TECHNICAL}>Técnico</SelectItem>
              <SelectItem value={TicketCategory.BILLING}>Financeiro</SelectItem>
              <SelectItem value={TicketCategory.GENERAL}>Geral</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex h-[calc(100%-200px)]">
        {/* Lista de Tickets */}
        <div className="w-1/2 border-r">
          <ScrollArea className="h-full">
            <div className="p-4">
              {loading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTickets.map((ticket) => (
                    <Card
                      key={ticket.id}
                      className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                        selectedTicket?.id === ticket.id ? 'ring-2 ring-blue-500' : ''
                      }`}
                      onClick={() => setSelectedTicket(ticket)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(ticket.status)}
                            <span className="font-medium text-sm">#{ticket.ticketNumber}</span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Badge className={getPriorityColor(ticket.priority)}>
                              {ticket.priority}
                            </Badge>
                            <Badge className={getStatusColor(ticket.status)}>
                              {ticket.status}
                            </Badge>
                          </div>
                        </div>
                        
                        <h3 className="font-medium text-gray-900 mb-1 line-clamp-1">
                          {ticket.subject}
                        </h3>
                        
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {ticket.description}
                        </p>
                        
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center space-x-4">
                            {ticket.clientName && (
                              <span className="flex items-center">
                                <User className="h-3 w-3 mr-1" />
                                {ticket.clientName}
                              </span>
                            )}
                            
                            {ticket.assignedToName && (
                              <span>Atribuído: {ticket.assignedToName}</span>
                            )}
                          </div>
                          
                          <span>
                            {formatDistanceToNow(new Date(ticket.createdAt), { 
                              addSuffix: true, 
                              locale: ptBR 
                            })}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Detalhes do Ticket */}
        <div className="flex-1">
          {selectedTicket ? (
            <div className="h-full flex flex-col">
              <div className="p-6 border-b">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{selectedTicket.subject}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>#{selectedTicket.ticketNumber}</span>
                      <span>•</span>
                      <span>{selectedTicket.category}</span>
                      <span>•</span>
                      <span>
                        {formatDistanceToNow(new Date(selectedTicket.createdAt), { 
                          addSuffix: true, 
                          locale: ptBR 
                        })}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Select
                      value={selectedTicket.status}
                      onValueChange={(value) => handleUpdateStatus(selectedTicket.id, value as TicketStatus)}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={TicketStatus.OPEN}>Aberto</SelectItem>
                        <SelectItem value={TicketStatus.IN_PROGRESS}>Em Progresso</SelectItem>
                        <SelectItem value={TicketStatus.RESOLVED}>Resolvido</SelectItem>
                        <SelectItem value={TicketStatus.CLOSED}>Fechado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <p className="text-gray-700 mb-4">{selectedTicket.description}</p>
                
                {selectedTicket.attachments && selectedTicket.attachments.length > 0 && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Paperclip className="h-4 w-4" />
                    <span>{selectedTicket.attachments.length} anexo(s)</span>
                  </div>
                )}
              </div>
              
              <ScrollArea className="flex-1 p-6">
                <div className="space-y-4">
                  {selectedTicket.messages.map((message) => (
                    <div key={message.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{message.senderName}</span>
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(message.createdAt), { 
                            addSuffix: true, 
                            locale: ptBR 
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{message.content}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Selecione um ticket
                </h3>
                <p className="text-gray-500">
                  Escolha um ticket para ver os detalhes
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}