'use client';

import * as React from 'react';

import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Clock,
  Pause,
  Play,
  Shield,
  XCircle,
  Zap,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type StatusType =
  | 'success'
  | 'pending'
  | 'error'
  | 'warning'
  | 'info'
  | 'active'
  | 'inactive'
  | 'processing'
  | 'cancelled';

interface StatusBadgeProps {
  status: StatusType;
  text?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const statusConfig = {
  success: {
    variant: 'default' as const,
    className:
      'bg-green-100 text-green-800 border-green-200 hover:bg-green-100',
    icon: CheckCircle,
    defaultText: 'Sucesso',
  },
  pending: {
    variant: 'secondary' as const,
    className:
      'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100',
    icon: Clock,
    defaultText: 'Pendente',
  },
  error: {
    variant: 'destructive' as const,
    className: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-100',
    icon: XCircle,
    defaultText: 'Erro',
  },
  warning: {
    variant: 'outline' as const,
    className:
      'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-100',
    icon: AlertTriangle,
    defaultText: 'Atenção',
  },
  info: {
    variant: 'secondary' as const,
    className: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100',
    icon: AlertCircle,
    defaultText: 'Info',
  },
  active: {
    variant: 'default' as const,
    className:
      'bg-green-100 text-green-800 border-green-200 hover:bg-green-100',
    icon: Play,
    defaultText: 'Ativo',
  },
  inactive: {
    variant: 'secondary' as const,
    className: 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-100',
    icon: Pause,
    defaultText: 'Inativo',
  },
  processing: {
    variant: 'outline' as const,
    className:
      'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-100',
    icon: Zap,
    defaultText: 'Processando',
  },
  cancelled: {
    variant: 'outline' as const,
    className: 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-100',
    icon: XCircle,
    defaultText: 'Cancelado',
  },
};

const sizeClasses = {
  sm: 'text-xs px-2 py-1',
  md: 'text-sm px-2.5 py-1.5',
  lg: 'text-base px-3 py-2',
};

const iconSizeClasses = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

export function StatusBadge({
  status,
  text,
  showIcon = true,
  size = 'md',
  className,
}: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;
  const displayText = text || config.defaultText;

  return (
    <Badge
      variant={config.variant}
      className={cn(
        config.className,
        sizeClasses[size],
        'inline-flex items-center gap-1.5 font-medium',
        className
      )}
    >
      {showIcon && <Icon className={iconSizeClasses[size]} />}
      {displayText}
    </Badge>
  );
}

// Componentes específicos para diferentes contextos
export function OrderStatusBadge({ status }: { status: string }) {
  const statusMap: Record<string, StatusType> = {
    pendente: 'pending',
    em_andamento: 'processing',
    aguardando_peca: 'warning',
    aguardando_cliente: 'info',
    concluido: 'success',
    entregue: 'success',
    cancelado: 'cancelled',
  };

  const statusText: Record<string, string> = {
    pendente: 'Pendente',
    em_andamento: 'Em Andamento',
    aguardando_peca: 'Aguardando Peça',
    aguardando_cliente: 'Aguardando Cliente',
    concluido: 'Concluído',
    entregue: 'Entregue',
    cancelado: 'Cancelado',
  };

  return (
    <StatusBadge
      status={statusMap[status] || 'info'}
      text={statusText[status] || status}
    />
  );
}

export function PaymentStatusBadge({ status }: { status: string }) {
  const statusMap: Record<string, StatusType> = {
    pendente: 'pending',
    pago: 'success',
    vencido: 'error',
    cancelado: 'cancelled',
    processando: 'processing',
  };

  const statusText: Record<string, string> = {
    pendente: 'Pendente',
    pago: 'Pago',
    vencido: 'Vencido',
    cancelado: 'Cancelado',
    processando: 'Processando',
  };

  return (
    <StatusBadge
      status={statusMap[status] || 'info'}
      text={statusText[status] || status}
    />
  );
}
