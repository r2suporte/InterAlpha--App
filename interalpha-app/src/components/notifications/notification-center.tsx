'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bell, 
  BellRing, 
  Check, 
  CheckCheck, 
  Trash2, 
  Settings,
  AlertTriangle,
  Info,
  CheckCircle,
  Clock,
  X
} from 'lucide-react';
import { Notification, NotificationStats } from '@/types/notifications';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats>({
    total: 0,
    unread: 0,
    byCategory: {},
    byPriority: {},
    recentCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
      fetchStats();
    }
  }, [isOpen, activeTab]);

  const fetchNotifications = async () => {
    try {
      const unreadOnly = activeTab === 'unread';
      const response = await fetch(`/api/notifications?unreadOnly=${unreadOnly}&limit=50`);
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/notifications/stats');
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
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
        await fetchStats();
      }
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
    }
  };

  const markAllAsRead = async () => {
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
        await fetchStats();
      }
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        await fetchStats();
      }
    } catch (error) {
      console.error('Erro ao deletar notificação:', error);
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'high': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'medium': return <Info className="h-4 w-4 text-blue-500" />;
      case 'low': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-blue-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Agora';
    if (diffInMinutes < 60) return `${diffInMinutes}m atrás`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h atrás`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d atrás`;
    
    return date.toLocaleDateString('pt-BR');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-end p-4">
      <Card className="w-96 max-h-[80vh] bg-white shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <CardTitle className="text-lg">Notificações</CardTitle>
            {stats.unread > 0 && (
              <Badge variant="destructive" className="text-xs">
                {stats.unread}
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              <CheckCheck className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 mx-4 mb-4">
              <TabsTrigger value="all">
                Todas ({stats.total})
              </TabsTrigger>
              <TabsTrigger value="unread">
                Não lidas ({stats.unread})
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Settings className="h-4 w-4" />
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-0">
              <ScrollArea className="h-96">
                <div className="space-y-2 px-4">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhuma notificação</p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-3 border rounded-lg space-y-2 ${
                          !notification.read ? 'bg-blue-50 border-blue-200' : 'bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-2">
                            {getPriorityIcon(notification.priority)}
                            <Badge className={getPriorityColor(notification.priority)}>
                              {notification.category}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-1">
                            {!notification.read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => markAsRead(notification.id)}
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteNotification(notification.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium text-sm">{notification.title}</h4>
                          <p className="text-xs text-gray-600 mt-1">
                            {notification.message}
                          </p>
                        </div>

                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{formatTimeAgo(notification.createdAt)}</span>
                          {notification.actionUrl && (
                            <Button
                              variant="link"
                              size="sm"
                              className="h-auto p-0 text-xs"
                              onClick={() => {
                                window.open(notification.actionUrl, '_blank');
                                if (!notification.read) {
                                  markAsRead(notification.id);
                                }
                              }}
                            >
                              {notification.actionLabel || 'Ver mais'}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="unread" className="mt-0">
              <ScrollArea className="h-96">
                <div className="space-y-2 px-4">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                  ) : notifications.filter(n => !n.read).length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Todas as notificações foram lidas</p>
                    </div>
                  ) : (
                    notifications
                      .filter(n => !n.read)
                      .map((notification) => (
                        <div
                          key={notification.id}
                          className="p-3 border rounded-lg space-y-2 bg-blue-50 border-blue-200"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-2">
                              {getPriorityIcon(notification.priority)}
                              <Badge className={getPriorityColor(notification.priority)}>
                                {notification.category}
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => markAsRead(notification.id)}
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteNotification(notification.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>

                          <div>
                            <h4 className="font-medium text-sm">{notification.title}</h4>
                            <p className="text-xs text-gray-600 mt-1">
                              {notification.message}
                            </p>
                          </div>

                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>{formatTimeAgo(notification.createdAt)}</span>
                            {notification.actionUrl && (
                              <Button
                                variant="link"
                                size="sm"
                                className="h-auto p-0 text-xs"
                                onClick={() => {
                                  window.open(notification.actionUrl, '_blank');
                                  markAsRead(notification.id);
                                }}
                              >
                                {notification.actionLabel || 'Ver mais'}
                              </Button>
                            )}
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="settings" className="mt-0">
              <div className="px-4 py-6 text-center text-gray-500">
                <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Configurações de notificação</p>
                <p className="text-xs mt-2">Em breve...</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}