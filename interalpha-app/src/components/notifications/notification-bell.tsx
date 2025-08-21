'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, BellRing } from 'lucide-react';
import { NotificationCenter } from './notification-center';

interface NotificationBellProps {
  className?: string;
}

export function NotificationBell({ className }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);

  useEffect(() => {
    fetchUnreadCount();
    
    // Polling para verificar novas notificações a cada 30 segundos
    const interval = setInterval(fetchUnreadCount, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch('/api/notifications/stats');
      
      if (response.ok) {
        const data = await response.json();
        const newUnreadCount = data.unread || 0;
        
        // Detectar novas notificações
        if (newUnreadCount > unreadCount && unreadCount > 0) {
          setHasNewNotifications(true);
          // Remover o indicador após 3 segundos
          setTimeout(() => setHasNewNotifications(false), 3000);
        }
        
        setUnreadCount(newUnreadCount);
      }
    } catch (error) {
      console.error('Erro ao buscar contagem de notificações:', error);
    }
  };

  const handleClick = () => {
    setIsOpen(!isOpen);
    setHasNewNotifications(false);
  };

  const handleClose = () => {
    setIsOpen(false);
    // Atualizar contagem após fechar
    fetchUnreadCount();
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className={`relative ${className}`}
        onClick={handleClick}
      >
        {hasNewNotifications ? (
          <BellRing className="h-5 w-5 text-blue-600 animate-pulse" />
        ) : (
          <Bell className="h-5 w-5" />
        )}
        
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0 min-w-[20px]"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      <NotificationCenter 
        isOpen={isOpen} 
        onClose={handleClose}
      />
    </>
  );
}