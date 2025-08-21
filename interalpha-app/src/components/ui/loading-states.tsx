'use client'

import React from 'react'
import { Loader2, MessageSquare, Users, Headphones } from 'lucide-react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  return (
    <Loader2 className={`animate-spin ${sizeClasses[size]} ${className}`} />
  )
}

interface LoadingSkeletonProps {
  className?: string
  lines?: number
}

export function LoadingSkeleton({ className = '', lines = 1 }: LoadingSkeletonProps) {
  return (
    <div className={`animate-pulse ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={`bg-gray-200 rounded ${
            index === lines - 1 ? 'w-3/4' : 'w-full'
          } h-4 ${index > 0 ? 'mt-2' : ''}`}
        />
      ))}
    </div>
  )
}

export function MessageListSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="flex items-start space-x-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-20 h-4 bg-gray-200 rounded animate-pulse" />
              <div className="w-16 h-3 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="w-full h-4 bg-gray-200 rounded animate-pulse" />
            <div className="w-3/4 h-4 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function ChatRoomListSkeleton() {
  return (
    <div className="space-y-2 p-2">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="flex items-center p-3 space-x-3">
          <div className="relative">
            <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-gray-300 rounded-full animate-pulse" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-24 h-4 bg-gray-200 rounded animate-pulse" />
              <div className="w-12 h-3 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="w-32 h-3 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function TicketListSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="border rounded-lg p-4 space-y-3 animate-pulse">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
              <div className="w-20 h-4 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-12 h-5 bg-gray-200 rounded animate-pulse" />
              <div className="w-16 h-5 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
          
          <div className="w-3/4 h-5 bg-gray-200 rounded animate-pulse" />
          <div className="w-full h-4 bg-gray-200 rounded animate-pulse" />
          <div className="w-2/3 h-4 bg-gray-200 rounded animate-pulse" />
          
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-3 bg-gray-200 rounded animate-pulse" />
              <div className="w-20 h-3 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="w-12 h-3 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  )
}

interface LoadingStateProps {
  type: 'messages' | 'chat-rooms' | 'tickets' | 'general'
  message?: string
}

export function LoadingState({ type, message }: LoadingStateProps) {
  const getIcon = () => {
    switch (type) {
      case 'messages':
        return <MessageSquare className="w-8 h-8 text-gray-400" />
      case 'chat-rooms':
        return <Users className="w-8 h-8 text-gray-400" />
      case 'tickets':
        return <Headphones className="w-8 h-8 text-gray-400" />
      default:
        return <LoadingSpinner size="lg" className="text-gray-400" />
    }
  }

  const getDefaultMessage = () => {
    switch (type) {
      case 'messages':
        return 'Carregando mensagens...'
      case 'chat-rooms':
        return 'Carregando salas de chat...'
      case 'tickets':
        return 'Carregando tickets...'
      default:
        return 'Carregando...'
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-32 space-y-3">
      {getIcon()}
      <p className="text-sm text-gray-500">{message || getDefaultMessage()}</p>
    </div>
  )
}

export function EmptyState({ 
  type, 
  title, 
  description, 
  action 
}: {
  type: 'messages' | 'chat-rooms' | 'tickets' | 'general'
  title: string
  description: string
  action?: React.ReactNode
}) {
  const getIcon = () => {
    switch (type) {
      case 'messages':
        return <MessageSquare className="w-12 h-12 text-gray-400" />
      case 'chat-rooms':
        return <Users className="w-12 h-12 text-gray-400" />
      case 'tickets':
        return <Headphones className="w-12 h-12 text-gray-400" />
      default:
        return <div className="w-12 h-12 bg-gray-200 rounded-full" />
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-64 space-y-4 text-center">
      {getIcon()}
      <div className="space-y-2">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500 max-w-sm">{description}</p>
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}