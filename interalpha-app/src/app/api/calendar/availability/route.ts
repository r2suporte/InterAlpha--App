// API para verificar disponibilidade no calendário

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { CalendarSyncService } from '@/services/calendar/calendar-sync-service'

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { startTime, endTime } = body

    if (!startTime || !endTime) {
      return NextResponse.json(
        { error: 'Horário de início e fim são obrigatórios' },
        { status: 400 }
      )
    }

    const start = new Date(startTime)
    const end = new Date(endTime)

    if (start >= end) {
      return NextResponse.json(
        { error: 'Horário de início deve ser anterior ao fim' },
        { status: 400 }
      )
    }

    const syncService = new CalendarSyncService()
    const availability = await syncService.checkAvailabilityForUser(userId, start, end)

    return NextResponse.json({
      available: availability.available,
      conflicts: availability.conflicts,
      period: {
        start: start.toISOString(),
        end: end.toISOString()
      }
    })
  } catch (error) {
    console.error('Erro ao verificar disponibilidade:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}