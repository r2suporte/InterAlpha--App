'use client';

import { useEffect, useState } from 'react';

import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AlertCircle,
  Bell,
  Check,
  CheckCircle,
  Info,
  Wrench,
  X,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useWebSocket } from '@/hooks/use-websocket';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  data?: any;
}

interface NotificationCenterProps {
  userId?: string;
  userRole?: 'user' | 'tecnico' | 'admin';
}

export function NotificationCenter({
  userId,
  userRole = 'user',
}: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Configurar WebSocket baseado no papel do usuário
  const webSocketOptions = {
    userId,
    technicianId: userRole === 'tecnico' ? userId : undefined,
    isAdmin: userRole === 'admin',
  };

  const {
    isConnected,
    newOrderNotifications,
    orderStatusUpdates,
    clearOrderStatusUpdates,
    clearNewOrderNotifications,
  } = useWebSocket(webSocketOptions);

  // Função auxiliar para determinar o tipo de notificação baseado no status
  const getNotificationTypeFromStatus = (
    status: string
  ): 'info' | 'success' | 'warning' | 'error' => {
    switch (status.toLowerCase()) {
      case 'concluido':
      case 'finalizado':
        return 'success';
      case 'cancelado':
        return 'error';
      case 'em_andamento':
      case 'em andamento':
        return 'info';
      default:
        return 'info';
    }
  };

  // Converter notificações do WebSocket para o formato local
  useEffect(() => {
    const wsNotifications: Notification[] = [];

    // Adicionar notificações de novas ordens
    newOrderNotifications.forEach(order => {
      wsNotifications.push({
        id: `new-order-${order.orderId}`,
        type: 'info',
        title: 'Nova Ordem de Serviço',
        message: `Ordem para ${order.clientName} - ${order.equipmentType}`,
        timestamp: order.timestamp,
        read: false,
        data: {
          orderId: order.orderId,
          clientName: order.clientName,
          equipmentType: order.equipmentType,
          priority: order.priority,
        },
      });
    });

    // Adicionar notificações de mudanças de status
    orderStatusUpdates.forEach(update => {
      wsNotifications.push({
        id: `status-update-${update.orderId}-${update.timestamp}`,
        type: getNotificationTypeFromStatus(update.status),
        title: 'Status Atualizado',
        message:
          update.message ||
          `Ordem ${update.orderId} - Status: ${update.status}`,
        timestamp: update.timestamp,
        read: false,
        data: {
          orderId: update.orderId,
          status: update.status,
          clientId: update.clientId,
          technicianId: update.technicianId,
        },
      });
    });

    // Ordenar por timestamp (mais recentes primeiro)
    wsNotifications.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    setNotifications(wsNotifications);
  }, [newOrderNotifications, orderStatusUpdates]);

  // Calculate unread notifications count
  const unreadCount = notifications.filter(n => !n.read).length;

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'concluido':
      case 'finalizado':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'em_andamento':
      case 'em andamento':
        return <Wrench className="h-4 w-4 text-blue-500" />;
      case 'cancelado':
        return <X className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'concluido':
      case 'finalizado':
        return 'bg-green-100 text-green-800';
      case 'em_andamento':
      case 'em andamento':
        return 'bg-blue-100 text-blue-800';
      case 'cancelado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), {
        addSuffix: true,
        locale: ptBR,
      });
    } catch {
      return 'Agora mesmo';
    }
  };

  const clearAllNotifications = () => {
    clearOrderStatusUpdates();
    clearNewOrderNotifications();
    setNotifications([]);
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      // Mark all as read when opened
      markAllAsRead();
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <span>Notificações</span>
            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
              />
              <span className="text-xs text-muted-foreground">
                {isConnected ? 'Conectado' : 'Desconectado'}
              </span>
            </div>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {notifications.length > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {notifications.length} notificações
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllNotifications}
                className="text-xs"
              >
                Limpar todas
              </Button>
            </div>
          )}

          <div className="max-h-[calc(100vh-200px)] space-y-3 overflow-y-auto">
            {notifications.map(notification => {
              const getNotificationIcon = (type: string) => {
                switch (type) {
                  case 'success':
                    return <CheckCircle className="h-4 w-4 text-green-500" />;
                  case 'warning':
                    return <AlertCircle className="h-4 w-4 text-yellow-500" />;
                  case 'error':
                    return <X className="h-4 w-4 text-red-500" />;
                  default:
                    return <Info className="h-4 w-4 text-blue-500" />;
                }
              };

              const getBorderColor = (type: string) => {
                switch (type) {
                  case 'success':
                    return 'border-l-green-500';
                  case 'warning':
                    return 'border-l-yellow-500';
                  case 'error':
                    return 'border-l-red-500';
                  default:
                    return 'border-l-blue-500';
                }
              };

              return (
                <Card
                  key={notification.id}
                  className={cn(
                    'cursor-pointer border-l-4 transition-colors',
                    getBorderColor(notification.type),
                    !notification.read && 'bg-muted/50'
                  )}
                  onClick={() => markAsRead(notification.id)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      {getNotificationIcon(notification.type)}
                      {notification.title}
                      {!notification.read && (
                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-1">
                      <p className="text-sm">{notification.message}</p>
                      {notification.data && (
                        <div className="flex items-center justify-between">
                          {notification.data.status && (
                            <Badge
                              variant="outline"
                              className={getStatusColor(
                                notification.data.status
                              )}
                            >
                              {notification.data.status.replace('_', ' ')}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {formatTimeAgo(notification.timestamp)}
                          </span>
                        </div>
                      )}
                      {!notification.data?.status && (
                        <div className="flex justify-end">
                          <span className="text-xs text-muted-foreground">
                            {formatTimeAgo(notification.timestamp)}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {notifications.length === 0 && (
              <div className="py-8 text-center">
                <Bell className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Nenhuma notificação no momento
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Você será notificado sobre atualizações em tempo real
                </p>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default NotificationCenter;
