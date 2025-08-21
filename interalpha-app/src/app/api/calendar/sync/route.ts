// API para sincronização de eventos com calendário

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { CalendarSyncService } from '@/services/calendar/calendar-sync-service'

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { ordemServicoId, action } = body

    const syncService = new CalendarSyncService()

    switch (action) {
      case 'sync_ordem':
        if (!ordemServicoId) {
          return NextResponse.json(
            { error: 'ID da ordem de serviço é obrigatório' },
            { status: 400 }
          )
        }

        const results = await syncService.syncOrdemServicoToCalendar(ordemServicoId, userId)
        
        const successCount = results.filter(r => r.success).length
        const totalCount = results.length

        return NextResponse.json({
          message: `${successCount}/${totalCount} integrações sincronizadas com sucesso`,
          results,
          success: successCount > 0
        })

      case 'sync_all':
        await syncService.syncPendingEvents()
        return NextResponse.json({ 
          message: 'Sincronização de eventos pendentes iniciada' 
        })

      default:
        return NextResponse.json(
          { error: 'Ação não suportada' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Erro ao sincronizar eventos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}