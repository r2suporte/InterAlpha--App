// Serviço de sincronização de calendários

import { prisma } from '@/lib/prisma'
import { GoogleCalendarService } from './google-calendar-service'
import { 
  CalendarIntegration, 
  EventSyncResult, 
  CalendarEvent,
  GoogleTokens 
} from '@/types/calendar'

export class CalendarSyncService {
  private googleService: GoogleCalendarService

  constructor() {
    this.googleService = new GoogleCalendarService()
  }

  // Iniciar processo de autenticação
  async initiateAuth(userId: string): Promise<string> {
    return this.googleService.generateAuthUrl(userId)
  }

  // Completar autenticação e salvar integração
  async completeAuth(userId: string, code: string): Promise<CalendarIntegration> {
    try {
      // Trocar código por tokens
      const tokens = await this.googleService.exchangeCodeForTokens(code)
      
      // Configurar credenciais para buscar calendários
      this.googleService.setCredentials(tokens)
      
      // Buscar calendário principal
      const calendars = await this.googleService.listCalendars()
      const primaryCalendar = calendars.find(cal => cal.primary) || calendars[0]
      
      if (!primaryCalendar) {
        throw new Error('Nenhum calendário encontrado')
      }

      // Salvar integração no banco
      const integration = await prisma.calendarIntegration.create({
        data: {
          userId,
          googleCalendarId: primaryCalendar.id,
          displayName: primaryCalendar.summary,
          isActive: true,
          syncEnabled: true,
          tokens: tokens as any,
          config: {
            syncDirection: 'bidirectional',
            eventTypes: ['ordemServico', 'agendamento'],
            autoCreateEvents: true,
            conflictResolution: 'skip',
            reminderSettings: {
              enabled: true,
              defaultMinutes: 15,
              methods: ['email', 'popup']
            }
          }
        }
      })

      // Configurar webhook para receber atualizações
      await this.setupWebhookForIntegration(integration.id)

      return integration as CalendarIntegration
    } catch (error) {
      console.error('Erro ao completar autenticação:', error)
      throw error
    }
  }

  // Configurar webhook para uma integração
  private async setupWebhookForIntegration(integrationId: string): Promise<void> {
    try {
      const integration = await prisma.calendarIntegration.findUnique({
        where: { id: integrationId }
      })

      if (!integration) return

      this.googleService.setCredentials(integration.tokens as GoogleTokens)
      
      const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/calendar/webhook`
      const webhook = await this.googleService.setupWebhook(
        integration.googleCalendarId,
        webhookUrl
      )

      if (webhook) {
        await prisma.calendarIntegration.update({
          where: { id: integrationId },
          data: { webhookId: webhook.id }
        })
      }
    } catch (error) {
      console.error('Erro ao configurar webhook:', error)
    }
  }

  // Sincronizar ordem de serviço com calendário
  async syncOrdemServicoToCalendar(ordemServicoId: string, userId: string): Promise<EventSyncResult[]> {
    try {
      // Buscar integrações ativas do usuário
      const integrations = await prisma.calendarIntegration.findMany({
        where: {
          userId,
          isActive: true,
          syncEnabled: true
        }
      })

      const results: EventSyncResult[] = []

      for (const integration of integrations) {
        try {
          // Verificar se tokens precisam ser atualizados
          await this.ensureValidTokens(integration.id)
          
          // Configurar credenciais
          this.googleService.setCredentials(integration.tokens as GoogleTokens)
          
          // Sincronizar evento
          const result = await this.googleService.syncWithOrdemServico(
            ordemServicoId,
            integration.googleCalendarId
          )

          results.push(result)

          // Salvar resultado da sincronização
          if (result.success && result.eventId) {
            await this.saveEventSync(ordemServicoId, integration.id, result.eventId)
          }
        } catch (error) {
          console.error(`Erro ao sincronizar com integração ${integration.id}:`, error)
          results.push({
            success: false,
            action: 'created',
            errorMessage: error instanceof Error ? error.message : 'Erro desconhecido',
            timestamp: new Date()
          })
        }
      }

      return results
    } catch (error) {
      console.error('Erro ao sincronizar ordem de serviço:', error)
      return [{
        success: false,
        action: 'created',
        errorMessage: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date()
      }]
    }
  }

  // Salvar sincronização de evento
  private async saveEventSync(ordemServicoId: string, integrationId: string, eventId: string): Promise<void> {
    try {
      await prisma.calendarEventSync.create({
        data: {
          ordemServicoId,
          integrationId,
          externalEventId: eventId,
          status: 'synced',
          lastSyncAt: new Date()
        }
      })
    } catch (error) {
      console.error('Erro ao salvar sincronização de evento:', error)
    }
  }

  // Garantir que os tokens estão válidos
  private async ensureValidTokens(integrationId: string): Promise<void> {
    try {
      const integration = await prisma.calendarIntegration.findUnique({
        where: { id: integrationId }
      })

      if (!integration) return

      const tokens = integration.tokens as GoogleTokens
      const now = Date.now()

      // Verificar se o token expira em menos de 5 minutos
      if (tokens.expiry_date && tokens.expiry_date - now < 5 * 60 * 1000) {
        if (tokens.refresh_token) {
          // Atualizar tokens
          const newTokens = await this.googleService.refreshTokens(tokens.refresh_token)
          
          await prisma.calendarIntegration.update({
            where: { id: integrationId },
            data: { tokens: newTokens as any }
          })
        } else {
          // Marcar integração como inativa se não há refresh_token
          await prisma.calendarIntegration.update({
            where: { id: integrationId },
            data: { 
              isActive: false,
              syncEnabled: false 
            }
          })
          throw new Error('Tokens expirados e sem refresh_token disponível')
        }
      }
    } catch (error) {
      console.error('Erro ao verificar tokens:', error)
      throw error
    }
  }

  // Verificar disponibilidade para agendamento
  async checkAvailabilityForUser(
    userId: string,
    startTime: Date,
    endTime: Date
  ): Promise<{ available: boolean; conflicts: string[] }> {
    try {
      const integrations = await prisma.calendarIntegration.findMany({
        where: {
          userId,
          isActive: true,
          syncEnabled: true
        }
      })

      const conflicts: string[] = []

      for (const integration of integrations) {
        try {
          await this.ensureValidTokens(integration.id)
          this.googleService.setCredentials(integration.tokens as GoogleTokens)

          const conflictInfo = await this.googleService.checkAvailability(
            integration.googleCalendarId,
            { start: startTime, end: endTime }
          )

          if (conflictInfo.hasConflict) {
            conflicts.push(...conflictInfo.conflictingEvents.map(e => e.summary))
          }
        } catch (error) {
          console.error(`Erro ao verificar disponibilidade na integração ${integration.id}:`, error)
        }
      }

      return {
        available: conflicts.length === 0,
        conflicts
      }
    } catch (error) {
      console.error('Erro ao verificar disponibilidade:', error)
      return { available: true, conflicts: [] }
    }
  }

  // Listar integrações do usuário
  async getUserIntegrations(userId: string): Promise<CalendarIntegration[]> {
    try {
      const integrations = await prisma.calendarIntegration.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      })

      return integrations as CalendarIntegration[]
    } catch (error) {
      console.error('Erro ao buscar integrações:', error)
      return []
    }
  }

  // Ativar/desativar integração
  async toggleIntegration(integrationId: string, isActive: boolean): Promise<void> {
    try {
      await prisma.calendarIntegration.update({
        where: { id: integrationId },
        data: { 
          isActive,
          syncEnabled: isActive 
        }
      })
    } catch (error) {
      console.error('Erro ao alterar status da integração:', error)
      throw error
    }
  }

  // Remover integração
  async removeIntegration(integrationId: string): Promise<void> {
    try {
      const integration = await prisma.calendarIntegration.findUnique({
        where: { id: integrationId }
      })

      if (!integration) return

      // Parar webhook se existir
      if (integration.webhookId) {
        try {
          this.googleService.setCredentials(integration.tokens as GoogleTokens)
          await this.googleService.stopWebhook(integration.webhookId, integration.googleCalendarId)
        } catch (error) {
          console.error('Erro ao parar webhook:', error)
        }
      }

      // Remover sincronizações de eventos
      await prisma.calendarEventSync.deleteMany({
        where: { integrationId }
      })

      // Remover integração
      await prisma.calendarIntegration.delete({
        where: { id: integrationId }
      })
    } catch (error) {
      console.error('Erro ao remover integração:', error)
      throw error
    }
  }

  // Processar webhook do Google Calendar
  async processWebhook(calendarId: string, resourceId: string): Promise<void> {
    try {
      // Buscar integração pelo calendarId
      const integration = await prisma.calendarIntegration.findFirst({
        where: { googleCalendarId: calendarId }
      })

      if (!integration) return

      // Atualizar última sincronização
      await prisma.calendarIntegration.update({
        where: { id: integration.id },
        data: { lastSyncAt: new Date() }
      })

      // Aqui você pode implementar lógica adicional para processar mudanças
      // Por exemplo, sincronizar eventos alterados de volta para o sistema
      console.log(`Webhook processado para calendário ${calendarId}`)
    } catch (error) {
      console.error('Erro ao processar webhook:', error)
    }
  }

  // Sincronizar todos os eventos pendentes
  async syncPendingEvents(): Promise<void> {
    try {
      // Buscar ordens de serviço que precisam ser sincronizadas
      const ordensServico = await prisma.ordemServico.findMany({
        where: {
          dataInicio: { not: null },
          // Adicionar condição para eventos não sincronizados
        },
        include: { user: true }
      })

      for (const ordem of ordensServico) {
        try {
          await this.syncOrdemServicoToCalendar(ordem.id, ordem.userId)
        } catch (error) {
          console.error(`Erro ao sincronizar ordem ${ordem.id}:`, error)
        }
      }
    } catch (error) {
      console.error('Erro ao sincronizar eventos pendentes:', error)
    }
  }
}