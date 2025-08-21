// Serviço de integração com Google Calendar

import { google } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'
import { prisma } from '@/lib/prisma'
import { 
  CalendarEvent, 
  TimeSlot, 
  ConflictInfo, 
  GoogleTokens, 
  EventSyncResult,
  AvailabilitySlot,
  CalendarWebhook
} from '@/types/calendar'

export class GoogleCalendarService {
  private oauth2Client: OAuth2Client
  private calendar: any

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    )

    this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client })
  }

  // Configurar tokens de autenticação
  setCredentials(tokens: GoogleTokens): void {
    this.oauth2Client.setCredentials({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      scope: tokens.scope,
      token_type: tokens.token_type,
      expiry_date: tokens.expiry_date
    })
  }

  // Gerar URL de autorização
  generateAuthUrl(userId: string): string {
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events'
    ]

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: userId, // Para identificar o usuário no callback
      prompt: 'consent' // Força nova autorização para obter refresh_token
    })
  }

  // Trocar código de autorização por tokens
  async exchangeCodeForTokens(code: string): Promise<GoogleTokens> {
    try {
      const { tokens } = await this.oauth2Client.getAccessToken(code)
      
      return {
        access_token: tokens.access_token!,
        refresh_token: tokens.refresh_token,
        scope: tokens.scope!,
        token_type: tokens.token_type!,
        expiry_date: tokens.expiry_date!
      }
    } catch (error) {
      console.error('Erro ao trocar código por tokens:', error)
      throw new Error('Falha na autenticação com Google')
    }
  }

  // Atualizar tokens usando refresh_token
  async refreshTokens(refreshToken: string): Promise<GoogleTokens> {
    try {
      this.oauth2Client.setCredentials({
        refresh_token: refreshToken
      })

      const { credentials } = await this.oauth2Client.refreshAccessToken()
      
      return {
        access_token: credentials.access_token!,
        refresh_token: credentials.refresh_token || refreshToken,
        scope: credentials.scope!,
        token_type: credentials.token_type!,
        expiry_date: credentials.expiry_date!
      }
    } catch (error) {
      console.error('Erro ao atualizar tokens:', error)
      throw new Error('Falha ao atualizar tokens do Google')
    }
  }

  // Criar evento no calendário
  async createEvent(calendarId: string, event: CalendarEvent): Promise<EventSyncResult> {
    try {
      const response = await this.calendar.events.insert({
        calendarId,
        requestBody: {
          summary: event.summary,
          description: event.description,
          start: event.start,
          end: event.end,
          attendees: event.attendees,
          location: event.location,
          reminders: event.reminders || {
            useDefault: true
          },
          status: event.status || 'confirmed',
          visibility: event.visibility || 'default'
        }
      })

      return {
        success: true,
        eventId: response.data.id!,
        externalId: response.data.id!,
        action: 'created',
        timestamp: new Date()
      }
    } catch (error) {
      console.error('Erro ao criar evento:', error)
      return {
        success: false,
        action: 'created',
        errorMessage: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date()
      }
    }
  }

  // Atualizar evento existente
  async updateEvent(calendarId: string, eventId: string, event: Partial<CalendarEvent>): Promise<EventSyncResult> {
    try {
      const response = await this.calendar.events.update({
        calendarId,
        eventId,
        requestBody: {
          summary: event.summary,
          description: event.description,
          start: event.start,
          end: event.end,
          attendees: event.attendees,
          location: event.location,
          reminders: event.reminders,
          status: event.status,
          visibility: event.visibility
        }
      })

      return {
        success: true,
        eventId: response.data.id!,
        externalId: response.data.id!,
        action: 'updated',
        timestamp: new Date()
      }
    } catch (error) {
      console.error('Erro ao atualizar evento:', error)
      return {
        success: false,
        action: 'updated',
        errorMessage: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date()
      }
    }
  }

  // Deletar evento
  async deleteEvent(calendarId: string, eventId: string): Promise<EventSyncResult> {
    try {
      await this.calendar.events.delete({
        calendarId,
        eventId
      })

      return {
        success: true,
        eventId,
        action: 'deleted',
        timestamp: new Date()
      }
    } catch (error) {
      console.error('Erro ao deletar evento:', error)
      return {
        success: false,
        action: 'deleted',
        errorMessage: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date()
      }
    }
  }

  // Buscar evento por ID
  async getEvent(calendarId: string, eventId: string): Promise<CalendarEvent | null> {
    try {
      const response = await this.calendar.events.get({
        calendarId,
        eventId
      })

      return this.mapGoogleEventToCalendarEvent(response.data)
    } catch (error) {
      console.error('Erro ao buscar evento:', error)
      return null
    }
  }

  // Listar eventos em um período
  async listEvents(
    calendarId: string, 
    timeMin: Date, 
    timeMax: Date,
    maxResults: number = 250
  ): Promise<CalendarEvent[]> {
    try {
      const response = await this.calendar.events.list({
        calendarId,
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        maxResults,
        singleEvents: true,
        orderBy: 'startTime'
      })

      return response.data.items?.map(this.mapGoogleEventToCalendarEvent) || []
    } catch (error) {
      console.error('Erro ao listar eventos:', error)
      return []
    }
  }

  // Verificar disponibilidade em um horário
  async checkAvailability(calendarId: string, timeSlot: TimeSlot): Promise<ConflictInfo> {
    try {
      const events = await this.listEvents(
        calendarId,
        timeSlot.start,
        timeSlot.end
      )

      const conflictingEvents = events.filter(event => {
        const eventStart = new Date(event.start.dateTime)
        const eventEnd = new Date(event.end.dateTime)
        
        // Verifica se há sobreposição
        return (eventStart < timeSlot.end && eventEnd > timeSlot.start)
      })

      return {
        hasConflict: conflictingEvents.length > 0,
        conflictingEvents,
        suggestedTimes: conflictingEvents.length > 0 ? 
          await this.suggestAlternativeTimes(calendarId, timeSlot) : undefined
      }
    } catch (error) {
      console.error('Erro ao verificar disponibilidade:', error)
      return {
        hasConflict: false,
        conflictingEvents: []
      }
    }
  }

  // Sugerir horários alternativos
  private async suggestAlternativeTimes(
    calendarId: string, 
    originalSlot: TimeSlot
  ): Promise<TimeSlot[]> {
    const suggestions: TimeSlot[] = []
    const duration = originalSlot.end.getTime() - originalSlot.start.getTime()
    
    // Buscar eventos do dia todo
    const dayStart = new Date(originalSlot.start)
    dayStart.setHours(8, 0, 0, 0) // 8:00 AM
    
    const dayEnd = new Date(originalSlot.start)
    dayEnd.setHours(18, 0, 0, 0) // 6:00 PM

    const dayEvents = await this.listEvents(calendarId, dayStart, dayEnd)
    
    // Encontrar slots livres
    let currentTime = new Date(dayStart)
    
    while (currentTime.getTime() + duration <= dayEnd.getTime()) {
      const slotEnd = new Date(currentTime.getTime() + duration)
      
      const hasConflict = dayEvents.some(event => {
        const eventStart = new Date(event.start.dateTime)
        const eventEnd = new Date(event.end.dateTime)
        return (eventStart < slotEnd && eventEnd > currentTime)
      })

      if (!hasConflict) {
        suggestions.push({
          start: new Date(currentTime),
          end: new Date(slotEnd),
          timeZone: originalSlot.timeZone
        })
        
        if (suggestions.length >= 3) break // Máximo 3 sugestões
      }

      currentTime.setMinutes(currentTime.getMinutes() + 30) // Incremento de 30 min
    }

    return suggestions
  }

  // Obter disponibilidade de um período
  async getAvailability(
    calendarId: string,
    startDate: Date,
    endDate: Date,
    slotDuration: number = 60 // em minutos
  ): Promise<AvailabilitySlot[]> {
    try {
      const events = await this.listEvents(calendarId, startDate, endDate)
      const slots: AvailabilitySlot[] = []
      
      let currentTime = new Date(startDate)
      
      while (currentTime < endDate) {
        const slotEnd = new Date(currentTime.getTime() + (slotDuration * 60 * 1000))
        
        const conflictingEvent = events.find(event => {
          const eventStart = new Date(event.start.dateTime)
          const eventEnd = new Date(event.end.dateTime)
          return (eventStart < slotEnd && eventEnd > currentTime)
        })

        slots.push({
          start: new Date(currentTime),
          end: new Date(slotEnd),
          available: !conflictingEvent,
          eventId: conflictingEvent?.id,
          eventTitle: conflictingEvent?.summary
        })

        currentTime = new Date(slotEnd)
      }

      return slots
    } catch (error) {
      console.error('Erro ao obter disponibilidade:', error)
      return []
    }
  }

  // Configurar webhook para receber notificações
  async setupWebhook(calendarId: string, webhookUrl: string): Promise<CalendarWebhook | null> {
    try {
      const response = await this.calendar.events.watch({
        calendarId,
        requestBody: {
          id: `webhook-${Date.now()}`,
          type: 'web_hook',
          address: webhookUrl,
          token: `token-${Date.now()}`
        }
      })

      return {
        id: response.data.id!,
        calendarId,
        resourceId: response.data.resourceId!,
        resourceUri: response.data.resourceUri!,
        token: response.data.token,
        expiration: response.data.expiration!,
        type: 'web_hook',
        address: webhookUrl
      }
    } catch (error) {
      console.error('Erro ao configurar webhook:', error)
      return null
    }
  }

  // Parar webhook
  async stopWebhook(channelId: string, resourceId: string): Promise<boolean> {
    try {
      await this.calendar.channels.stop({
        requestBody: {
          id: channelId,
          resourceId
        }
      })
      return true
    } catch (error) {
      console.error('Erro ao parar webhook:', error)
      return false
    }
  }

  // Listar calendários do usuário
  async listCalendars(): Promise<Array<{ id: string; summary: string; primary?: boolean }>> {
    try {
      const response = await this.calendar.calendarList.list()
      
      return response.data.items?.map((cal: any) => ({
        id: cal.id,
        summary: cal.summary,
        primary: cal.primary
      })) || []
    } catch (error) {
      console.error('Erro ao listar calendários:', error)
      return []
    }
  }

  // Mapear evento do Google para formato interno
  private mapGoogleEventToCalendarEvent(googleEvent: any): CalendarEvent {
    return {
      id: googleEvent.id,
      summary: googleEvent.summary || 'Sem título',
      description: googleEvent.description,
      start: {
        dateTime: googleEvent.start?.dateTime || googleEvent.start?.date,
        timeZone: googleEvent.start?.timeZone
      },
      end: {
        dateTime: googleEvent.end?.dateTime || googleEvent.end?.date,
        timeZone: googleEvent.end?.timeZone
      },
      attendees: googleEvent.attendees?.map((attendee: any) => ({
        email: attendee.email,
        displayName: attendee.displayName,
        responseStatus: attendee.responseStatus
      })),
      location: googleEvent.location,
      reminders: googleEvent.reminders,
      status: googleEvent.status,
      visibility: googleEvent.visibility,
      colorId: googleEvent.colorId,
      recurrence: googleEvent.recurrence,
      created: googleEvent.created,
      updated: googleEvent.updated,
      creator: googleEvent.creator,
      organizer: googleEvent.organizer
    }
  }

  // Sincronizar evento com ordem de serviço
  async syncWithOrdemServico(ordemServicoId: string, calendarId: string): Promise<EventSyncResult> {
    try {
      // Buscar ordem de serviço
      const ordemServico = await prisma.ordemServico.findUnique({
        where: { id: ordemServicoId },
        include: { cliente: true }
      })

      if (!ordemServico) {
        throw new Error('Ordem de serviço não encontrada')
      }

      // Criar evento baseado na ordem de serviço
      const event: CalendarEvent = {
        summary: ordemServico.titulo,
        description: `Ordem de Serviço: ${ordemServico.titulo}\n\nCliente: ${ordemServico.cliente.nome}\nDescrição: ${ordemServico.descricao || 'Sem descrição'}`,
        start: {
          dateTime: ordemServico.dataInicio?.toISOString() || new Date().toISOString(),
          timeZone: 'America/Sao_Paulo'
        },
        end: {
          dateTime: ordemServico.dataFim?.toISOString() || 
            new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 horas depois
          timeZone: 'America/Sao_Paulo'
        },
        attendees: [
          {
            email: ordemServico.cliente.email,
            displayName: ordemServico.cliente.nome
          }
        ],
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 60 },
            { method: 'popup', minutes: 15 }
          ]
        }
      }

      return await this.createEvent(calendarId, event)
    } catch (error) {
      console.error('Erro ao sincronizar com ordem de serviço:', error)
      return {
        success: false,
        action: 'created',
        errorMessage: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date()
      }
    }
  }
}