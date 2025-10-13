'use client';

import React from 'react';

import {
  BarChart3,
  DollarSign,
  FileText,
  Loader2,
  Package,
  Settings,
  Users,
} from 'lucide-react';

import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function LoadingSpinner({
  size = 'md',
  className,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  };

  return (
    <Loader2
      className={cn(
        'animate-spin text-muted-foreground',
        sizeClasses[size],
        className
      )}
    />
  );
}

interface LoadingSkeletonProps {
  className?: string;
  variant?: 'text' | 'card' | 'avatar' | 'button';
}

export function LoadingSkeleton({
  className,
  variant = 'text',
}: LoadingSkeletonProps) {
  const variantClasses = {
    text: 'h-4 w-full',
    card: 'h-32 w-full',
    avatar: 'h-10 w-10 rounded-full',
    button: 'h-10 w-24',
  };

  return (
    <div
      className={cn(
        'animate-pulse rounded bg-muted',
        variantClasses[variant],
        className
      )}
    />
  );
}

interface LoadingCardProps {
  title?: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}

export function LoadingCard({
  title = 'Carregando...',
  description = 'Aguarde enquanto os dados são carregados',
  icon: Icon = Loader2,
  className,
}: LoadingCardProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center',
        className
      )}
    >
      <Icon className="mb-4 h-8 w-8 animate-spin text-muted-foreground" />
      <h3 className="mb-2 text-lg font-medium text-foreground">{title}</h3>
      <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

interface LoadingTableProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export function LoadingTable({
  rows = 5,
  columns = 4,
  className,
}: LoadingTableProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {/* Header */}
      <div className="flex space-x-4">
        {Array.from({ length: columns }).map((_, i) => (
          <LoadingSkeleton key={i} className="h-4 flex-1" />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex space-x-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <LoadingSkeleton key={colIndex} className="h-8 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

interface LoadingFormProps {
  fields?: number;
  className?: string;
}

export function LoadingForm({ fields = 4, className }: LoadingFormProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <LoadingSkeleton className="h-4 w-24" />
          <LoadingSkeleton className="h-10 w-full" />
        </div>
      ))}
      <div className="flex justify-end space-x-2">
        <LoadingSkeleton variant="button" />
        <LoadingSkeleton variant="button" />
      </div>
    </div>
  );
}

interface LoadingDashboardProps {
  className?: string;
}

export function LoadingDashboard({ className }: LoadingDashboardProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="space-y-2">
        <LoadingSkeleton className="h-8 w-64" />
        <LoadingSkeleton className="h-4 w-96" />
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-3 rounded-lg border p-6">
            <div className="flex items-center justify-between">
              <LoadingSkeleton className="h-4 w-20" />
              <LoadingSkeleton variant="avatar" className="h-8 w-8" />
            </div>
            <LoadingSkeleton className="h-8 w-16" />
            <LoadingSkeleton className="h-3 w-24" />
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-lg border p-6">
          <LoadingSkeleton className="h-6 w-32" />
          <LoadingSkeleton className="h-64 w-full" />
        </div>
        <div className="space-y-4 rounded-lg border p-6">
          <LoadingSkeleton className="h-6 w-32" />
          <LoadingSkeleton className="h-64 w-full" />
        </div>
      </div>

      {/* Table */}
      <div className="space-y-4 rounded-lg border p-6">
        <LoadingSkeleton className="h-6 w-40" />
        <LoadingTable rows={8} columns={5} />
      </div>
    </div>
  );
}

// Loading states específicos por contexto
export const LoadingStates = {
  // Clientes
  Clientes: () => (
    <LoadingCard
      title="Carregando clientes..."
      description="Buscando informações dos clientes"
      icon={Users}
    />
  ),

  // Ordens de Serviço
  OrdensServico: () => (
    <LoadingCard
      title="Carregando ordens de serviço..."
      description="Buscando dados das ordens de serviço"
      icon={FileText}
    />
  ),

  // Peças
  Pecas: () => (
    <LoadingCard
      title="Carregando peças..."
      description="Carregando inventário de peças"
      icon={Package}
    />
  ),

  // Financeiro
  Financeiro: () => (
    <LoadingCard
      title="Carregando dados financeiros..."
      description="Processando informações financeiras"
      icon={DollarSign}
    />
  ),

  // Métricas
  Metricas: () => (
    <LoadingCard
      title="Carregando métricas..."
      description="Calculando métricas de performance"
      icon={BarChart3}
    />
  ),

  // Configurações
  Configuracoes: () => (
    <LoadingCard
      title="Carregando configurações..."
      description="Buscando configurações do sistema"
      icon={Settings}
    />
  ),

  // Genérico
  Generic: () => <LoadingCard />,
};

// Hook para estados de loading
export function useLoadingState(initialState = false) {
  const [isLoading, setIsLoading] = React.useState(initialState);

  const startLoading = React.useCallback(() => setIsLoading(true), []);
  const stopLoading = React.useCallback(() => setIsLoading(false), []);
  const toggleLoading = React.useCallback(
    () => setIsLoading(prev => !prev),
    []
  );

  return {
    isLoading,
    startLoading,
    stopLoading,
    toggleLoading,
    setIsLoading,
  };
}

// HOC para adicionar loading state a componentes
export function withLoadingState<T extends object>(
  Component: React.ComponentType<T>,
  LoadingComponent: React.ComponentType = LoadingStates.Generic
) {
  return function WrappedComponent(props: T & { isLoading?: boolean }) {
    const { isLoading, ...componentProps } = props;

    if (isLoading) {
      return <LoadingComponent />;
    }

    return <Component {...(componentProps as T)} />;
  };
}
