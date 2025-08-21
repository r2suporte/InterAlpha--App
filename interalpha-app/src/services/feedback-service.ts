/**
 * Serviço para coleta e análise de feedback dos usuários
 */

import { prisma } from '@/lib/prisma'
import { cacheService } from './cache-service'

export interface UserFeedback {
  id: string
  userId: string
  userName: string
  userEmail: string
  type: 'bug' | 'feature' | 'improvement' | 'usability' | 'performance'
  category: 'products' | 'stock' | 'orders' | 'dashboard' | 'general'
  title: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  page?: string
  userAgent?: string
  screenshot?: string
  steps?: string[]
  expectedBehavior?: string
  actualBehavior?: string
  createdAt: Date
  updatedAt: Date
  resolvedAt?: Date
  resolvedBy?: string
  resolution?: string
  votes: number
  tags: string[]
}

export interface FeedbackAnalytics {
  totalFeedback: number
  byType: Record<string, number>
  byCategory: Record<string, number>
  byPriority: Record<string, number>
  byStatus: Record<string, number>
  averageResolutionTime: number
  topIssues: Array<{
    title: string
    count: number
    category: string
    priority: string
  }>
  userSatisfaction: {
    score: number
    responses: number
    trend: 'up' | 'down' | 'stable'
  }
  monthlyTrend: Array<{
    month: string
    count: number
    resolved: number
  }>
}

export interface ImprovementSuggestion {
  id: string
  title: string
  description: string
  impact: 'low' | 'medium' | 'high'
  effort: 'low' | 'medium' | 'high'
  priority: number
  category: string
  relatedFeedback: string[]
  estimatedHours: number
  benefits: string[]
  risks: string[]
  implementation: {
    steps: string[]
    files: string[]
    dependencies: string[]
  }
}

export class FeedbackService {
  /**
   * Submeter novo feedback
   */
  async submitFeedback(data: Omit<UserFeedback, 'id' | 'createdAt' | 'updatedAt' | 'votes'>): Promise<UserFeedback> {
    const feedback: UserFeedback = {
      id: `feedback_${Date.now()}`,
      ...data,
      votes: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Salvar no cache para processamento rápido
    await cacheService.set(
      `feedback:${feedback.id}`,
      feedback,
      { ttl: 86400 * 30 } // 30 dias
    )

    // Adicionar à lista de feedback ativo
    const activeFeedback = await this.getActiveFeedback()
    activeFeedback.push(feedback)
    
    await cacheService.set(
      'feedback:active',
      activeFeedback,
      { ttl: 86400 }
    )

    // Processar automaticamente se for crítico
    if (feedback.priority === 'critical') {
      await this.processCriticalFeedback(feedback)
    }

    return feedback
  }

  /**
   * Obter feedback ativo
   */
  async getActiveFeedback(): Promise<UserFeedback[]> {
    const cached = await cacheService.get<UserFeedback[]>('feedback:active')
    if (cached) return cached

    // Em produção, isso viria do banco de dados
    return []
  }

  /**
   * Atualizar status do feedback
   */
  async updateFeedbackStatus(
    feedbackId: string, 
    status: UserFeedback['status'],
    resolution?: string,
    resolvedBy?: string
  ): Promise<UserFeedback | null> {
    const feedback = await cacheService.get<UserFeedback>(`feedback:${feedbackId}`)
    if (!feedback) return null

    feedback.status = status
    feedback.updatedAt = new Date()

    if (status === 'resolved' || status === 'closed') {
      feedback.resolvedAt = new Date()
      feedback.resolvedBy = resolvedBy
      feedback.resolution = resolution
    }

    await cacheService.set(`feedback:${feedbackId}`, feedback, { ttl: 86400 * 30 })

    return feedback
  }

  /**
   * Votar em feedback
   */
  async voteFeedback(feedbackId: string, userId: string): Promise<boolean> {
    const feedback = await cacheService.get<UserFeedback>(`feedback:${feedbackId}`)
    if (!feedback) return false

    // Verificar se usuário já votou
    const userVotes = await cacheService.get<string[]>(`feedback:votes:${feedbackId}`) || []
    
    if (userVotes.includes(userId)) {
      return false // Já votou
    }

    // Adicionar voto
    userVotes.push(userId)
    feedback.votes = userVotes.length
    feedback.updatedAt = new Date()

    await Promise.all([
      cacheService.set(`feedback:${feedbackId}`, feedback, { ttl: 86400 * 30 }),
      cacheService.set(`feedback:votes:${feedbackId}`, userVotes, { ttl: 86400 * 30 })
    ])

    return true
  }

  /**
   * Analisar feedback e gerar analytics
   */
  async analyzeFeedback(): Promise<FeedbackAnalytics> {
    const activeFeedback = await this.getActiveFeedback()
    
    if (activeFeedback.length === 0) {
      return this.getEmptyAnalytics()
    }

    // Análise por tipo
    const byType = activeFeedback.reduce((acc, f) => {
      acc[f.type] = (acc[f.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Análise por categoria
    const byCategory = activeFeedback.reduce((acc, f) => {
      acc[f.category] = (acc[f.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Análise por prioridade
    const byPriority = activeFeedback.reduce((acc, f) => {
      acc[f.priority] = (acc[f.priority] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Análise por status
    const byStatus = activeFeedback.reduce((acc, f) => {
      acc[f.status] = (acc[f.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Tempo médio de resolução
    const resolvedFeedback = activeFeedback.filter(f => f.resolvedAt)
    const averageResolutionTime = resolvedFeedback.length > 0
      ? resolvedFeedback.reduce((sum, f) => {
          const resolutionTime = f.resolvedAt!.getTime() - f.createdAt.getTime()
          return sum + resolutionTime
        }, 0) / resolvedFeedback.length / (1000 * 60 * 60) // em horas
      : 0

    // Top issues (por votos e prioridade)
    const topIssues = activeFeedback
      .sort((a, b) => {
        const priorityWeight = { critical: 4, high: 3, medium: 2, low: 1 }
        const scoreA = a.votes + priorityWeight[a.priority]
        const scoreB = b.votes + priorityWeight[b.priority]
        return scoreB - scoreA
      })
      .slice(0, 10)
      .map(f => ({
        title: f.title,
        count: f.votes,
        category: f.category,
        priority: f.priority
      }))

    // Satisfação do usuário (simulada)
    const userSatisfaction = {
      score: 4.2, // De 1 a 5
      responses: activeFeedback.length,
      trend: 'up' as const
    }

    // Tendência mensal (simulada)
    const monthlyTrend = this.generateMonthlyTrend(activeFeedback)

    return {
      totalFeedback: activeFeedback.length,
      byType,
      byCategory,
      byPriority,
      byStatus,
      averageResolutionTime,
      topIssues,
      userSatisfaction,
      monthlyTrend
    }
  }

  /**
   * Gerar sugestões de melhoria baseadas no feedback
   */
  async generateImprovementSuggestions(): Promise<ImprovementSuggestion[]> {
    const analytics = await this.analyzeFeedback()
    const suggestions: ImprovementSuggestion[] = []

    // Sugestão baseada em bugs críticos
    if (analytics.byPriority.critical > 0) {
      suggestions.push({
        id: 'critical_bugs_fix',
        title: 'Correção de Bugs Críticos',
        description: `Há ${analytics.byPriority.critical} bugs críticos reportados que precisam de atenção imediata.`,
        impact: 'high',
        effort: 'medium',
        priority: 10,
        category: 'bug_fixes',
        relatedFeedback: [],
        estimatedHours: analytics.byPriority.critical * 4,
        benefits: [
          'Melhora a estabilidade do sistema',
          'Reduz frustração dos usuários',
          'Evita perda de dados'
        ],
        risks: [
          'Pode introduzir novos bugs se não testado adequadamente'
        ],
        implementation: {
          steps: [
            'Priorizar bugs por impacto',
            'Criar testes para reproduzir os bugs',
            'Implementar correções',
            'Executar testes de regressão'
          ],
          files: ['src/services/', 'src/components/', 'tests/'],
          dependencies: []
        }
      })
    }

    // Sugestão baseada em problemas de performance
    if (analytics.byType.performance > 2) {
      suggestions.push({
        id: 'performance_optimization',
        title: 'Otimização de Performance',
        description: `${analytics.byType.performance} usuários reportaram problemas de performance.`,
        impact: 'high',
        effort: 'high',
        priority: 8,
        category: 'performance',
        relatedFeedback: [],
        estimatedHours: 16,
        benefits: [
          'Melhora a experiência do usuário',
          'Reduz tempo de carregamento',
          'Aumenta a satisfação geral'
        ],
        risks: [
          'Pode requerer mudanças arquiteturais',
          'Risco de introduzir instabilidade'
        ],
        implementation: {
          steps: [
            'Identificar gargalos de performance',
            'Implementar cache adicional',
            'Otimizar queries do banco',
            'Implementar lazy loading'
          ],
          files: ['src/services/cache-service.ts', 'src/services/optimized-product-service.ts'],
          dependencies: ['Redis', 'Database indexes']
        }
      })
    }

    // Sugestão baseada em problemas de usabilidade
    if (analytics.byType.usability > 3) {
      suggestions.push({
        id: 'ux_improvements',
        title: 'Melhorias de UX/UI',
        description: `${analytics.byType.usability} usuários reportaram problemas de usabilidade.`,
        impact: 'medium',
        effort: 'medium',
        priority: 6,
        category: 'usability',
        relatedFeedback: [],
        estimatedHours: 12,
        benefits: [
          'Interface mais intuitiva',
          'Reduz curva de aprendizado',
          'Aumenta produtividade dos usuários'
        ],
        risks: [
          'Usuários podem precisar se readaptar',
          'Pode afetar workflows existentes'
        ],
        implementation: {
          steps: [
            'Analisar feedback de usabilidade',
            'Criar protótipos de melhorias',
            'Implementar mudanças incrementais',
            'Coletar feedback das mudanças'
          ],
          files: ['src/components/', 'src/app/'],
          dependencies: ['Design system', 'User testing']
        }
      })
    }

    // Sugestão baseada em solicitações de features
    if (analytics.byType.feature > 5) {
      suggestions.push({
        id: 'new_features',
        title: 'Implementação de Novas Funcionalidades',
        description: `${analytics.byType.feature} solicitações de novas funcionalidades foram feitas.`,
        impact: 'medium',
        effort: 'high',
        priority: 5,
        category: 'features',
        relatedFeedback: [],
        estimatedHours: 24,
        benefits: [
          'Atende necessidades dos usuários',
          'Aumenta valor do produto',
          'Diferencial competitivo'
        ],
        risks: [
          'Pode aumentar complexidade do sistema',
          'Requer recursos de desenvolvimento significativos'
        ],
        implementation: {
          steps: [
            'Priorizar features por demanda',
            'Criar especificações detalhadas',
            'Implementar em fases',
            'Coletar feedback de cada fase'
          ],
          files: ['src/services/', 'src/components/', 'src/app/api/'],
          dependencies: ['Database schema changes', 'API updates']
        }
      })
    }

    // Ordenar por prioridade
    return suggestions.sort((a, b) => b.priority - a.priority)
  }

  /**
   * Processar feedback crítico automaticamente
   */
  private async processCriticalFeedback(feedback: UserFeedback) {
    // Notificar equipe imediatamente
    console.error(`🚨 FEEDBACK CRÍTICO: ${feedback.title}`)
    console.error(`Usuário: ${feedback.userName} (${feedback.userEmail})`)
    console.error(`Descrição: ${feedback.description}`)

    // Criar issue automático (simulado)
    const issue = {
      title: `[CRÍTICO] ${feedback.title}`,
      description: feedback.description,
      priority: 'critical',
      assignee: 'dev-team',
      labels: ['critical', 'user-feedback', feedback.category]
    }

    // Salvar issue para processamento
    await cacheService.set(
      `critical-issue:${feedback.id}`,
      issue,
      { ttl: 86400 * 7 }
    )
  }

  /**
   * Gerar tendência mensal
   */
  private generateMonthlyTrend(feedback: UserFeedback[]) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const currentMonth = new Date().getMonth()
    
    return months.slice(Math.max(0, currentMonth - 5), currentMonth + 1).map((month, index) => {
      const monthFeedback = feedback.filter(f => {
        const feedbackMonth = f.createdAt.getMonth()
        return feedbackMonth === (currentMonth - 5 + index)
      })

      return {
        month,
        count: monthFeedback.length,
        resolved: monthFeedback.filter(f => f.status === 'resolved').length
      }
    })
  }

  /**
   * Analytics vazio
   */
  private getEmptyAnalytics(): FeedbackAnalytics {
    return {
      totalFeedback: 0,
      byType: {},
      byCategory: {},
      byPriority: {},
      byStatus: {},
      averageResolutionTime: 0,
      topIssues: [],
      userSatisfaction: {
        score: 0,
        responses: 0,
        trend: 'stable'
      },
      monthlyTrend: []
    }
  }

  /**
   * Obter feedback por ID
   */
  async getFeedbackById(id: string): Promise<UserFeedback | null> {
    return await cacheService.get<UserFeedback>(`feedback:${id}`)
  }

  /**
   * Buscar feedback por critérios
   */
  async searchFeedback(criteria: {
    type?: string
    category?: string
    priority?: string
    status?: string
    userId?: string
    search?: string
  }): Promise<UserFeedback[]> {
    const allFeedback = await this.getActiveFeedback()
    
    return allFeedback.filter(feedback => {
      if (criteria.type && feedback.type !== criteria.type) return false
      if (criteria.category && feedback.category !== criteria.category) return false
      if (criteria.priority && feedback.priority !== criteria.priority) return false
      if (criteria.status && feedback.status !== criteria.status) return false
      if (criteria.userId && feedback.userId !== criteria.userId) return false
      if (criteria.search) {
        const searchLower = criteria.search.toLowerCase()
        const matchesTitle = feedback.title.toLowerCase().includes(searchLower)
        const matchesDescription = feedback.description.toLowerCase().includes(searchLower)
        if (!matchesTitle && !matchesDescription) return false
      }
      return true
    })
  }

  /**
   * Implementar melhoria baseada em sugestão
   */
  async implementImprovement(suggestionId: string, implementedBy: string): Promise<boolean> {
    try {
      // Marcar sugestão como implementada
      await cacheService.set(
        `improvement:${suggestionId}:implemented`,
        {
          implementedBy,
          implementedAt: new Date(),
          status: 'completed'
        },
        { ttl: 86400 * 30 }
      )

      // Atualizar feedback relacionado
      const suggestion = await cacheService.get<ImprovementSuggestion>(`suggestion:${suggestionId}`)
      if (suggestion) {
        for (const feedbackId of suggestion.relatedFeedback) {
          await this.updateFeedbackStatus(
            feedbackId,
            'resolved',
            `Implementado via sugestão: ${suggestion.title}`,
            implementedBy
          )
        }
      }

      return true
    } catch (error) {
      console.error('Erro ao implementar melhoria:', error)
      return false
    }
  }
}

// Singleton instance
export const feedbackService = new FeedbackService()