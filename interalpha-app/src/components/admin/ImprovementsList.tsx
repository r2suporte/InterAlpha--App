'use client'

/**
 * Lista de melhorias sugeridas e implementadas
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  User, 
  Calendar,
  MessageSquare,
  TrendingUp,
  Filter,
  Search
} from 'lucide-react'
// import { improvementAnalyticsService, ImprovementSuggestion } from '@/services/improvement-analytics-service'

// Definindo o tipo localmente para evitar dependências do servidor
interface ImprovementSuggestion {
  id: string
  title: string
  description: string
  category: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED'
  score: number
  impact: string
  effort: string
  assignedTo?: string
  createdAt: string
  relatedFeedbacks: string[]
  metadata?: {
    feedbackCount?: number
    avgRating?: number
    commonIssues?: string[]
  }
}
import { toast } from 'sonner'

interface ImprovementsListProps {
  status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED'
  limit?: number
}

export function ImprovementsList({ status, limit = 20 }: ImprovementsListProps) {
  const [improvements, setImprovements] = useState<ImprovementSuggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({
    status: status || 'all',
    priority: 'all',
    category: 'all',
    search: ''
  })

  useEffect(() => {
    loadImprovements()
  }, [filter])

  const loadImprovements = async () => {
    try {
      setLoading(true)
      
      // Mock data para demonstração - substituir por chamada à API
      const mockSuggestions: ImprovementSuggestion[] = [
        {
          id: '1',
          title: 'Melhorar performance do dashboard',
          description: 'Dashboard está carregando lentamente, especialmente com muitos dados',
          category: 'PERFORMANCE',
          priority: 'HIGH',
          status: 'PENDING',
          score: 8.5,
          impact: 'Alto',
          effort: 'Médio',
          assignedTo: 'João Silva',
          createdAt: new Date().toISOString(),
          relatedFeedbacks: ['fb1', 'fb2', 'fb3'],
          metadata: {
            feedbackCount: 15,
            avgRating: 2.3,
            commonIssues: ['Lentidão', 'Timeout', 'Interface travando']
          }
        },
        {
          id: '2',
          title: 'Adicionar filtros avançados',
          description: 'Usuários solicitam mais opções de filtro nas listagens',
          category: 'FEATURE',
          priority: 'MEDIUM',
          status: 'IN_PROGRESS',
          score: 7.2,
          impact: 'Médio',
          effort: 'Alto',
          assignedTo: 'Maria Santos',
          createdAt: new Date().toISOString(),
          relatedFeedbacks: ['fb4', 'fb5'],
          metadata: {
            feedbackCount: 8,
            avgRating: 4.1,
            commonIssues: ['Falta de filtros', 'Busca limitada']
          }
        }
      ]
      
      let filtered = mockSuggestions
      
      if (filter.status !== 'all') {
        filtered = filtered.filter(imp => imp.status === filter.status)
      }
      
      if (filter.priority !== 'all') {
        filtered = filtered.filter(imp => imp.priority === filter.priority)
      }
      
      if (filter.category !== 'all') {
        filtered = filtered.filter(imp => imp.category === filter.category)
      }
      
      if (filter.search) {
        const searchLower = filter.search.toLowerCase()
        filtered = filtered.filter(imp => 
          imp.title.toLowerCase().includes(searchLower) ||
          imp.description.toLowerCase().includes(searchLower)
        )
      }
      
      setImprovements(filtered.slice(0, limit))
    } catch (error) {
      console.error('Erro ao carregar melhorias:', error)
      toast.error('Erro ao carregar melhorias')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (improvementId: string, newStatus: ImprovementSuggestion['status']) => {
    try {
      // Implementar atualização de status
      toast.success('Status atualizado com sucesso')
      loadImprovements()
    } catch (error) {
      toast.error('Erro ao atualizar status')
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-200'
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'LOW': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'BUG': return '🐛'
      case 'FEATURE': return '✨'
      case 'UX': return '🎨'
      case 'PERFORMANCE': return '⚡'
      case 'SECURITY': return '🔒'
      default: return '📝'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock className="w-4 h-4 text-yellow-500" />
      case 'IN_PROGRESS': return <TrendingUp className="w-4 h-4 text-blue-500" />
      case 'COMPLETED': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'REJECTED': return <AlertTriangle className="w-4 h-4 text-red-500" />
      default: return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Carregando melhorias...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <span>Melhorias Sugeridas</span>
            <Badge variant="secondary">{improvements.length}</Badge>
          </CardTitle>
          
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar melhorias..."
                value={filter.search}
                onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            
            <select
              value={filter.status}
              onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">Todos os Status</option>
              <option value="PENDING">Pendente</option>
              <option value="IN_PROGRESS">Em Progresso</option>
              <option value="COMPLETED">Concluído</option>
              <option value="REJECTED">Rejeitado</option>
            </select>
            
            <select
              value={filter.priority}
              onChange={(e) => setFilter(prev => ({ ...prev, priority: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">Todas as Prioridades</option>
              <option value="CRITICAL">Crítica</option>
              <option value="HIGH">Alta</option>
              <option value="MEDIUM">Média</option>
              <option value="LOW">Baixa</option>
            </select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {improvements.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma melhoria encontrada</p>
          </div>
        ) : (
          <div className="space-y-4">
            {improvements.map((improvement) => (
              <div
                key={improvement.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-lg">{getCategoryIcon(improvement.category)}</span>
                      <h3 className="font-semibold text-lg">{improvement.title}</h3>
                      <Badge className={getPriorityColor(improvement.priority)}>
                        {improvement.priority}
                      </Badge>
                      <Badge variant="outline">
                        Score: {improvement.score.toFixed(1)}
                      </Badge>
                    </div>
                    
                    <p className="text-muted-foreground mb-3">
                      {improvement.description}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(improvement.createdAt).toLocaleDateString()}</span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <MessageSquare className="w-4 h-4" />
                        <span>{improvement.relatedFeedbacks.length} feedbacks</span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <span>Impacto: {improvement.impact}</span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <span>Esforço: {improvement.effort}</span>
                      </div>
                      
                      {improvement.assignedTo && (
                        <div className="flex items-center space-x-1">
                          <User className="w-4 h-4" />
                          <span>{improvement.assignedTo}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    {getStatusIcon(improvement.status)}
                    
                    <select
                      value={improvement.status}
                      onChange={(e) => handleStatusChange(
                        improvement.id, 
                        e.target.value as ImprovementSuggestion['status']
                      )}
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                    >
                      <option value="PENDING">Pendente</option>
                      <option value="IN_PROGRESS">Em Progresso</option>
                      <option value="COMPLETED">Concluído</option>
                      <option value="REJECTED">Rejeitado</option>
                    </select>
                  </div>
                </div>
                
                {improvement.metadata && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      {improvement.metadata.feedbackCount && (
                        <span>Feedbacks: {improvement.metadata.feedbackCount}</span>
                      )}
                      {improvement.metadata.avgRating && (
                        <span>Avaliação média: {improvement.metadata.avgRating.toFixed(1)}/5</span>
                      )}
                      {improvement.metadata.commonIssues && (
                        <span>Problemas: {improvement.metadata.commonIssues.join(', ')}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {improvements.length >= limit && (
          <div className="text-center mt-6">
            <Button variant="outline" onClick={() => setFilter(prev => ({ ...prev }))}>
              Carregar mais melhorias
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}