// API para receber webhooks do Google Calendar

import { NextRequest, NextResponse } from 'next/server'
import { CalendarSyncService } from '@/services/calendar/calendar-sync-service'

export async function POST(request: NextRequest) {
  try {
    // Verificar headers do webhook
    const channelId = request.headers.get('x-goog-channel-id')
    const resourceId = request.headers.get('x-goog-resource-id')
    const resourceState = request.headers.get('x-goog-resource-state')
    const resourceUri = request.headers.get('x-goog-resource-uri')

    if (!channelId || !resourceId) {
      return NextResponse.json(
        { error: 'Headers obrigatórios ausentes' },
        { status: 400 }
      )
    }

    // Extrair calendarId da resourceUri
    const calendarId = resourceUri?.match(/calendars\/([^\/]+)\/events/)?.[1]
    
    if (!calendarId) {
      return NextResponse.json(
        { error: 'Calendar ID não encontrado' },
        { status: 400 }
      )
    }

    // Processar apenas mudanças (não sync inicial)
    if (resourceState === 'exists') {
      const syncService = new CalendarSyncService()
      await syncService.processWebhook(decodeURIComponent(calendarId), resourceId)
    }

    return NextResponse.json({ message: 'Webhook processado com sucesso' })
  } catch (error) {
    console.error('Erro ao processar webhook:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Verificação de webhook (usado pelo Google para validar o endpoint)
export async function GET() {
  return NextResponse.json({ message: 'Webhook endpoint ativo' })
}