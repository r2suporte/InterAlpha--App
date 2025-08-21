'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Label } from '@/components/ui/label'
import { 
  Bell, 
  BellOff, 
  Mail, 
  MessageSquare, 
  Smartphone,
  Webhook,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Archive,
  Trash2,
  Filter
} from 'lucide-react'
import { useNotifications } from '@/hooks/use-notifications'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface NotificationCenterProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const NOTIFICATION_TYPES = {
  low_stock: { label: 'Estoque Baixo', icon: AlertTriangle, color: 'text-yellow-500' },
  out_of_stock: { label: 'Sem Estoque', icon: XCircle, color: 'text-red-500' },
  price_change: { label: 'Alteração de Preço', icon: Info, color: 'text-blue-500' },
  product_created: { label: 'Produto Criado', icon: CheckCircle, color: 'text-green-500' },
  product_updated: { label: 'Produto Atualizado', icon: Info, color: 'text-blue-500' },
  product_deleted: { label: 'Produto Excluído', icon: XCircle, color: 'text-red-500' },
  high_usage: { label: 'Uso Alto', icon: AlertTriangle, color: 'text-orange-500' },
  no_usage: { label: 'Sem Uso', icon: Info, color: 'text-gray-500' }
}

const PRIORITY_COLORS = {
  low: 'bg-gray-100 text-gray-800',
  normal: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800'
}

const CHANNEL_ICONS = {
  email: Mail,
  sms: MessageSquare,
  push: Smartphone,
  webhook: Webhook
}

export function NotificationCenter({ open, onOpenChange }: NotificationCenterProps) {
  const {
    notifications,
    unreadCount,
    totalCount,
    fetchNotifications,
    markAsRead,
    markAsUnread,
    archiveNotification,
    deleteNotification,
    markAllAsRead
  } = useNotifications()

  const [activeTab, setActiveTab] = useState('all')
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    priority: ''
  })
  const [showFilters, setShowFilters] = useState(false)

  // Carregar notificações quando abrir
  useEffect(() => {
    if (open) {
      fetchNotifications({ limit: 50 })
    }
  }, [open, fetchNotifications])

  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === 'unread' && notification.status === 'read') return false
    if (activeTab === 'read' && notification.status !== 'read') return false
    
    if (filters.type && notification.type !== filters.type) return false
    if (filters.status && notification.status !== filters.status) return false
    if (filters.priority && notification.priority !== filters.priority) return false
    
    return true
  })

  const getNotificationIcon = (type: string) => {
    const config = NOTIFICATION_TYPES[type as keyof typeof NOTIFICATION_TYPES]
    if (!config) return Info
    return config.icon
  }

  const getNotificationColor = (type: string) => {
    const config = NOTIFICATION_TYPES[type as keyof typeof NOTIFICATION_TYPES]
    return config?.color || 'text-gray-500'
  }

  const getPriorityBadge = (priority: string) => {
    const colorClass = PRIORITY_COLORS[priority as keyof typeof PRIORITY_COLORS] || PRIORITY_COLORS.normal
    return (
      <Badge className={colorClass}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </Badge>
    )
  }

  const handleNotificationClick = async (notification: any) => {
    if (notification.status !== 'read') {
      await markAsRead(notification.id)
    }
  }

  const handleMarkAllRead = async () => {
    await markAllAsRead()
  }

  const clearFilters = () => {
    setFilters({ type: '', status: '', priority: '' })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Central de Notificações
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4" />
              </Button>
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAllRead}
                >
                  Marcar Todas como Lidas
                </Button>
              )}
            </div>
          </DialogTitle>
          <DialogDescription>
            Gerencie suas notificações de produtos e configurações.
          </DialogDescription>
        </DialogHeader>

        {/* Filtros */}
        {showFilters && (
          <Card className="mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Filtros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={filters.type}
                    onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                  >
                    <option value="">Todos os tipos</option>
                    {Object.entries(NOTIFICATION_TYPES).map(([key, config]) => (
                      <option key={key} value={key}>{config.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="">Todos os status</option>
                    <option value="sent">Enviada</option>
                    <option value="read">Lida</option>
                    <option value="failed">Falhou</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Prioridade</Label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={filters.priority}
                    onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                  >
                    <option value="">Todas as prioridades</option>
                    <option value="low">Baixa</option>
                    <option value="normal">Normal</option>
                    <option value="high">Alta</option>
                    <option value="urgent">Urgente</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Limpar Filtros
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">
              Todas ({totalCount})
            </TabsTrigger>
            <TabsTrigger value="unread">
              Não Lidas ({unreadCount})
            </TabsTrigger>
            <TabsTrigger value="read">
              Lidas ({totalCount - unreadCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            <ScrollArea className="h-96">
              {filteredNotifications.length > 0 ? (
                <div className="space-y-3">
                  {filteredNotifications.map((notification) => {
                    const Icon = getNotificationIcon(notification.type)
                    const iconColor = getNotificationColor(notification.type)
                    
                    return (
                      <Card 
                        key={notification.id}
                        className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                          notification.status !== 'read' ? 'border-l-4 border-l-blue-500' : ''
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1">
                              <Icon className={`h-5 w-5 mt-0.5 ${iconColor}`} />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-medium">{notification.title}</h4>
                                  {getPriorityBadge(notification.priority)}
                                  {notification.status !== 'read' && (
                                    <Badge variant="secondary" className="text-xs">
                                      Nova
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {notification.message}
                                </p>
                                
                                {notification.product && (
                                  <div className="text-xs text-muted-foreground mb-2">
                                    Produto: {notification.product.partNumber} - {notification.product.description}
                                  </div>
                                )}
                                
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  <span>
                                    {formatDistanceToNow(new Date(notification.createdAt), {
                                      addSuffix: true,
                                      locale: ptBR
                                    })}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    {notification.channels.map((channel) => {
                                      const ChannelIcon = CHANNEL_ICONS[channel as keyof typeof CHANNEL_ICONS]
                                      return ChannelIcon ? (
                                        <ChannelIcon key={channel} className="h-3 w-3" />
                                      ) : null
                                    })}
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-1 ml-2">
                              {notification.status !== 'read' ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    markAsRead(notification.id)
                                  }}
                                  title="Marcar como lida"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    markAsUnread(notification.id)
                                  }}
                                  title="Marcar como não lida"
                                >
                                  <BellOff className="h-4 w-4" />
                                </Button>
                              )}
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  archiveNotification(notification.id)
                                }}
                                title="Arquivar"
                              >
                                <Archive className="h-4 w-4" />
                              </Button>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  deleteNotification(notification.id)
                                }}
                                title="Excluir"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>
                    {activeTab === 'unread' 
                      ? 'Nenhuma notificação não lida' 
                      : activeTab === 'read'
                      ? 'Nenhuma notificação lida'
                      : 'Nenhuma notificação encontrada'
                    }
                  </p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {filteredNotifications.length} de {totalCount} notificações
          </div>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}