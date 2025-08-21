'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    // Enviar erro para serviço de monitoramento
    if (typeof window !== 'undefined') {
      // Aqui você pode integrar com Sentry, LogRocket, etc.
      console.error('Error details:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      })
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined })
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex flex-col items-center justify-center h-64 p-6 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Algo deu errado
          </h3>
          
          <p className="text-sm text-gray-600 text-center mb-4 max-w-md">
            Ocorreu um erro inesperado. Nossa equipe foi notificada e está trabalhando para resolver o problema.
          </p>
          
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-xs text-red-800 max-w-md">
              <summary className="cursor-pointer font-medium">Detalhes do erro (desenvolvimento)</summary>
              <pre className="mt-2 whitespace-pre-wrap">{this.state.error.message}</pre>
            </details>
          )}
          
          <Button onClick={this.handleRetry} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Tentar novamente
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook para capturar erros em componentes funcionais
export function useErrorHandler() {
  return (error: Error, errorInfo?: string) => {
    console.error('Error caught by useErrorHandler:', error)
    
    // Aqui você pode integrar com serviços de monitoramento
    if (typeof window !== 'undefined') {
      console.error('Error details:', {
        error: error.message,
        stack: error.stack,
        info: errorInfo
      })
    }
  }
}