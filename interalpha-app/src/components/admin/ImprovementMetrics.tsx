'use client'

/**
 * Métricas e KPIs de melhorias contínuas
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, 
  TrendingDown,
  Target,
  Clock,
  CheckCircle,
  AlertTriangle,
  Users,
  Star,
  Zap,
  BarChart3
} from 'lucide-react'
import { improvementAnalyticsService } from '@/services/improvement-analytics-service'

interface MetricCard {
  title: string
  value: string | number
  change?: {
    value: number
    type: 'increase' | 'decrease'
    period: string
  }
  icon: React.ReactNode
  color: string
  description?: string
}

export function ImprovementMetrics() {
  const [metrics, setMetrics] = useState<MetricCard[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter'>('month')

  useEffect(() => {
    loadMetrics()
  }, [period])

  const loadMetrics = async () => {
    try {
      setLoading(true)
      
      // Simular dados - em produção, buscar do serviço
      const mockMetrics: MetricCard[] = [
        {
          title: 'Melhorias Implementadas',
          value: 47,
          change: { value: 12, type: 'increase', period: 'vs mês anterior' },
          icon: <CheckCircle className="w-5 h-5" />,
          color: 'text-green-600',
          description: 'Total de melhorias concluídas'
        },
        {
          title: 'Satisfação do Usuário',
          value: '4.2/5',
          change: { value: 0.3, type: 'increase', period: 'vs mês anterior' },
          icon: <Star className="w-5 h-5" />,
          color: 'text-yellow-600',
          description: 'Avaliação média dos usuários'
        },
        {
          title: 'Tempo Médio de Resolução',
          value: '5.2 dias',
          change: { value: 1.8, type: 'decrease', period: 'vs mês anterior' },
          icon: <Clock className="w-5 h-5" />,
          color: 'text-blue-600',
          description: 'Tempo para implementar melhorias'
        },
        {
          title: 'Taxa de Adoção',
          value: '87%',
          change: { value: 5, type: 'increase', period: 'vs mês anterior' },
          icon: <Users className="w-5 h-5" />,
          color: 'text-purple-600',
          description: 'Usuários usando novas funcionalidades'
        },
        {
          title: 'Bugs Resolvidos',
          value: 23,
          change: { value: 8, type: 'increase', period: 'esta semana' },
          icon: <Target className="w-5 h-5" />,
          color: 'text-red-600',
          description: 'Problemas corrigidos'
        },
        {
          title: 'Performance Geral',
          value: '+18%',
          change: { value: 3, type: 'increase', period: 'vs trimestre anterior' },
          icon: <Zap className="w-5 h-5" />,
          color: 'text-orange-600',
          description: 'Melhoria na performance do sistema'
        },
        {
          title: 'ROI das Melhorias',
          value: '340%',
          change: { value: 45, type: 'increase', period: 'acumulado' },
          icon: <BarChart3 className="w-5 h-5" />,
          color: 'text-indigo-600',
          description: 'Retorno sobre investimento'
        },
        {
          title: 'Alertas Críticos',
          value: 2,
          change: { value: 5, type: 'decrease', period: 'vs semana anterior' },
          icon: <AlertTriangle className="w-5 h-5" />,
          color: 'text-red-500',
          description: 'Problemas que precisam atenção imediata'
        }
      ]

      setMetrics(mockMetrics)
    } catch (error) {
      console.error('Erro ao carregar métricas:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatChange = (change: MetricCard['change']) => {
    if (!change) return null

    const isPositive = change.type === 'increase'
    const icon = isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />
    const colorClass = isPositive ? 'text-green-600' : 'text-red-600'
    const sign = isPositive ? '+' : '-'

    return (
      <div className={`flex items-center space-x-1 text-xs ${colorClass}`}>
        {icon}
        <span>{sign}{Math.abs(change.value)}</span>
        <span className="text-muted-foreground">{change.period}</span>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Seletor de Período */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Métricas de Melhoria</h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">Período:</span>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as typeof period)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value="week">Última Semana</option>
            <option value="month">Último Mês</option>
            <option value="quarter">Último Trimestre</option>
          </select>
        </div>
      </div>

      {/* Grid de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <span className={metric.color}>{metric.icon}</span>
                  <span>{metric.title}</span>
                </span>
                {metric.title === 'Alertas Críticos' && metric.value > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {metric.value}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold">{metric.value}</div>
                {formatChange(metric.change)}
                {metric.description && (
                  <p className="text-xs text-muted-foreground">
                    {metric.description}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Resumo Executivo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>Resumo Executivo</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h4 className="font-semibold text-green-600">Sucessos</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• 47 melhorias implementadas este mês</li>
                <li>• Satisfação do usuário aumentou 0.3 pontos</li>
                <li>• Performance geral melhorou 18%</li>
                <li>• ROI de 340% nas melhorias</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-yellow-600">Em Progresso</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• 8 melhorias sendo implementadas</li>
                <li>• Tempo médio de resolução: 5.2 dias</li>
                <li>• Taxa de adoção de 87%</li>
                <li>• 23 bugs em processo de correção</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-red-600">Atenção Necessária</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• 2 alertas críticos ativos</li>
                <li>• 23 melhorias pendentes de priorização</li>
                <li>• Necessário revisar processo de feedback</li>
                <li>• Implementar automação de testes</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metas e Objetivos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="w-5 h-5" />
            <span>Metas do Próximo Período</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Satisfação do Usuário</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '84%' }} />
                  </div>
                  <span className="text-xs text-muted-foreground">4.2/5.0</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Taxa de Resolução</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '78%' }} />
                  </div>
                  <span className="text-xs text-muted-foreground">78%</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Tempo de Resposta</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '65%' }} />
                  </div>
                  <span className="text-xs text-muted-foreground">5.2 dias</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold">Próximas Ações</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Reduzir tempo de resolução para 4 dias</li>
                <li>• Aumentar satisfação para 4.5/5</li>
                <li>• Implementar 60 melhorias no próximo mês</li>
                <li>• Zerar alertas críticos</li>
                <li>• Melhorar ROI para 400%</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}