// API para gerenciar integrações de calendário

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
    const integrations = await syncService.getUserIntegrations(userId)

    return NextResponse.json(integrations)
  } catch (error) {
    console.error('Erro ao buscar integrações:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { action, integrationId, isActive } = body

    const syncService = new CalendarSyncService()

    switch (action) {
      case 'toggle':
        if (!integrationId || typeof isActive !== 'boolean') {
          return NextResponse.json(
            { error: 'Parâmetros inválidos' },
            { status: 400 }
          )
        }
        
        await syncService.toggleIntegration(integrationId, isActive)
        return NextResponse.json({ 
          message: `Integração ${isActive ? 'ativada' : 'desativada'} com sucesso` 
        })

      case 'remove':
        if (!integrationId) {
          return NextResponse.json(
            { error: 'ID da integração é obrigatório' },
            { status: 400 }
          )
        }
        
        await syncService.removeIntegration(integrationId)
        return NextResponse.json({ message: 'Integração removida com sucesso' })

      default:
        return NextResponse.json(
          { error: 'Ação não suportada' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Erro ao gerenciar integração:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}