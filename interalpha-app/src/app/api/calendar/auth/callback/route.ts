// API para callback da autenticação Google Calendar

import { NextRequest, NextResponse } from 'next/server'
import { CalendarSyncService } from '@/services/calendar/calendar-sync-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state') // userId
    const error = searchParams.get('error')

    if (error) {
      return NextResponse.redirect(
        new URL(`/dashboard/configuracoes/calendario?error=${error}`, request.url)
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/dashboard/configuracoes/calendario?error=missing_params', request.url)
      )
    }

    const syncService = new CalendarSyncService()
    const integration = await syncService.completeAuth(state, code)

    return NextResponse.redirect(
      new URL(`/dashboard/configuracoes/calendario?success=true&integration=${integration.id}`, request.url)
    )
  } catch (error) {
    console.error('Erro no callback de autenticação:', error)
    return NextResponse.redirect(
      new URL('/dashboard/configuracoes/calendario?error=auth_failed', request.url)
    )
  }
}