'use client';

import React, { createContext, useCallback, useContext, useState } from 'react';

import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from 'lucide-react';

import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (_toast: Omit<Toast, 'id'>) => void;
  removeToast: (_id: string) => void;
  success: (_title: string, _description?: string) => void;
  error: (_title: string, _description?: string) => void;
  warning: (_title: string, _description?: string) => void;
  info: (_title: string, _description?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

interface ToastProviderProps {
  children: React.ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { ...toast, id };

    setToasts(prev => [...prev, newToast]);

    // Auto remove after duration
    const duration = toast.duration ?? 5000;
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const success = useCallback(
    (title: string, description?: string) => {
      addToast({ type: 'success', title, description });
    },
    [addToast]
  );

  const error = useCallback(
    (title: string, description?: string) => {
      addToast({ type: 'error', title, description, duration: 7000 });
    },
    [addToast]
  );

  const warning = useCallback(
    (title: string, description?: string) => {
      addToast({ type: 'warning', title, description });
    },
    [addToast]
  );

  const info = useCallback(
    (title: string, description?: string) => {
      addToast({ type: 'info', title, description });
    },
    [addToast]
  );

  return (
    <ToastContext.Provider
      value={{
        toasts,
        addToast,
        removeToast,
        success,
        error,
        warning,
        info,
      }}
    >
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

function ToastContainer() {
  const { toasts } = useToast();

  return (
    <div className="fixed right-4 top-4 z-50 flex max-w-sm flex-col gap-2">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}

interface ToastItemProps {
  toast: Toast;
}

function ToastItem({ toast }: ToastItemProps) {
  const { removeToast } = useToast();

  const typeConfig = {
    success: {
      icon: CheckCircle,
      className: 'bg-green-50 border-green-200 text-green-800',
      iconClassName: 'text-green-600',
    },
    error: {
      icon: AlertCircle,
      className: 'bg-red-50 border-red-200 text-red-800',
      iconClassName: 'text-red-600',
    },
    warning: {
      icon: AlertTriangle,
      className: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      iconClassName: 'text-yellow-600',
    },
    info: {
      icon: Info,
      className: 'bg-blue-50 border-blue-200 text-blue-800',
      iconClassName: 'text-blue-600',
    },
  };

  const config = typeConfig[toast.type];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'relative flex items-start gap-3 rounded-lg border p-4 shadow-lg animate-in slide-in-from-right-full',
        config.className
      )}
    >
      <Icon
        className={cn('mt-0.5 h-5 w-5 flex-shrink-0', config.iconClassName)}
      />

      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium">{toast.title}</div>
        {toast.description && (
          <div className="mt-1 text-sm opacity-90">{toast.description}</div>
        )}
        {toast.action && (
          <button
            onClick={toast.action.onClick}
            className="mt-2 text-sm font-medium underline hover:no-underline"
          >
            {toast.action.label}
          </button>
        )}
      </div>

      <button
        onClick={() => removeToast(toast.id)}
        className="flex-shrink-0 rounded p-1 hover:bg-black/5"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

// Componente de confirmação
interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'default',
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 animate-in fade-in-0"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-lg animate-in zoom-in-95">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            {variant === 'destructive' ? (
              <AlertTriangle className="h-6 w-6 text-red-600" />
            ) : (
              <Info className="h-6 w-6 text-blue-600" />
            )}
          </div>

          <div className="flex-1">
            <h3 className="mb-2 text-lg font-medium text-gray-900">{title}</h3>
            {description && (
              <p className="mb-4 text-sm text-gray-600">{description}</p>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
              >
                {cancelText}
              </button>
              <button
                onClick={handleConfirm}
                className={cn(
                  'rounded-md px-4 py-2 text-sm font-medium transition-colors',
                  variant === 'destructive'
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                )}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook para confirmações
export function useConfirm() {
  const [dialog, setDialog] = useState<{
    isOpen: boolean;
    title: string;
    description?: string;
    onConfirm: () => void;
    variant?: 'default' | 'destructive';
  }>({
    isOpen: false,
    title: '',
    onConfirm: () => {},
  });

  const confirm = useCallback(
    (
      title: string,
      description?: string,
      variant: 'default' | 'destructive' = 'default'
    ): Promise<boolean> => {
      return new Promise(resolve => {
        setDialog({
          isOpen: true,
          title,
          description,
          variant,
          onConfirm: () => resolve(true),
        });
      });
    },
    []
  );

  const closeDialog = useCallback(() => {
    setDialog(prev => ({ ...prev, isOpen: false }));
  }, []);

  const ConfirmDialogComponent = useCallback(
    () => (
      <ConfirmDialog
        isOpen={dialog.isOpen}
        onClose={closeDialog}
        onConfirm={dialog.onConfirm}
        title={dialog.title}
        description={dialog.description}
        variant={dialog.variant}
      />
    ),
    [dialog, closeDialog]
  );

  return {
    confirm,
    ConfirmDialog: ConfirmDialogComponent,
  };
}

// Componente de feedback para ações
interface ActionFeedbackProps {
  isLoading?: boolean;
  success?: boolean;
  error?: string;
  children: React.ReactNode;
  loadingText?: string;
  successText?: string;
}

export function ActionFeedback({
  isLoading,
  success,
  error,
  children,
  loadingText = 'Processando...',
  successText = 'Concluído!',
}: ActionFeedbackProps) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-blue-600">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        <span className="text-sm">{loadingText}</span>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex items-center gap-2 text-green-600">
        <CheckCircle className="h-4 w-4" />
        <span className="text-sm">{successText}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-red-600">
        <AlertCircle className="h-4 w-4" />
        <span className="text-sm">{error}</span>
      </div>
    );
  }

  return <>{children}</>;
}
