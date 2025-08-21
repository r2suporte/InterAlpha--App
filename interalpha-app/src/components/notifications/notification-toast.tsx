'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Bell, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { Notification } from '@/types/notifications';

interface NotificationToastProps {
  notification: Notification;
  onClose: () => void;
  onAction?: () => void;
  autoClose?: boolean;
  duration?: number;
}

export function NotificationToast({ 
  notification, 
  onClose, 
  onAction,
  autoClose = true,
  duration = 5000 
}: NotificationToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [autoClose, duration]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Aguardar animação
  };

  const handleAction = () => {
    if (notification.actionUrl) {
      window.open(notification.actionUrl, '_blank');
    }
    if (onAction) {
      onAction();
    }
    handleClose();
  };

  const getPriorityIcon = () => {
    switch (notification.priority) {
      case 'urgent':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'high':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'medium':
        return <Info className="h-5 w-5 text-blue-500" />;
      case 'low':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getPriorityColor = () => {
    switch (notification.priority) {
      case 'urgent':
        return 'border-red-500 bg-red-50';
      case 'high':
        return 'border-orange-500 bg-orange-50';
      case 'medium':
        return 'border-blue-500 bg-blue-50';
      case 'low':
        return 'border-green-500 bg-green-50';
      default:
        return 'border-gray-500 bg-gray-50';
    }
  };

  if (!isVisible) return null;

  return (
    <Card 
      className={`
        fixed top-4 right-4 w-96 z-50 shadow-lg border-l-4 
        ${getPriorityColor()}
        transform transition-all duration-300 ease-in-out
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 mt-0.5">
            {getPriorityIcon()}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-sm font-medium text-gray-900 truncate">
                {notification.title}
              </h4>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs">
                  {notification.category}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={handleClose}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 mb-3">
              {notification.message}
            </p>
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {new Date(notification.createdAt).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
              
              {notification.actionUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={handleAction}
                >
                  {notification.actionLabel || 'Ver mais'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Container para múltiplos toasts
interface NotificationToastContainerProps {
  notifications: Notification[];
  onClose: (id: string) => void;
  maxToasts?: number;
}

export function NotificationToastContainer({ 
  notifications, 
  onClose, 
  maxToasts = 3 
}: NotificationToastContainerProps) {
  // Mostrar apenas os mais recentes
  const visibleNotifications = notifications.slice(0, maxToasts);

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {visibleNotifications.map((notification, index) => (
        <div
          key={notification.id}
          style={{ 
            transform: `translateY(${index * 10}px)`,
            zIndex: 50 - index
          }}
        >
          <NotificationToast
            notification={notification}
            onClose={() => onClose(notification.id)}
            duration={5000 + (index * 1000)} // Toasts mais antigos ficam mais tempo
          />
        </div>
      ))}
    </div>
  );
}