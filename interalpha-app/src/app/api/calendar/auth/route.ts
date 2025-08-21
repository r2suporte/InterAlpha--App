// API para iniciar autenticação com Google Calendar

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { CalendarSyncService } from '@/services/calendar/calendar-sync-service'

export async function GET() {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const syncService = new CalendarSyncService()
    const authUrl = await syncService.initiateAuth(userId)

    return NextResponse.json({ authUrl })
  } catch (error) {
    console.error('Erro ao iniciar autenticação:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}