'use client'

import React from 'react'
import { CommunicationHub } from '@/components/communication/communication-hub'
import { useAuth } from '@/hooks/useAuth'
import { ErrorBoundary } from '@/components/ui/error-boundary'

export default function CommunicacaoPage() {
  const { user } = useAuth()

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="h-full">
        <CommunicationHub
          currentUserId={user.id}
          userRole={user.role}
          userName={user.name}
        />
      </div>
    </ErrorBoundary>
  )
}