/**
 * Dashboard de Melhorias e Feedback
 */

import { Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  TrendingUp, 
  MessageSquare, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Lightbulb,
  Bug,
  Zap,
  Users,
  BarChart3,
  Filter,
  Download
} from 'lucide-react'
import { ImprovementsList } from '@/components/admin/ImprovementsList'
import { FeedbackAnalytics } from '@/components/admin/FeedbackAnalytics'
import { UserJourneyMap } from '@/components/admin/UserJourneyMap'
import { ImprovementMetrics } from '@/components/admin/ImprovementMetrics'

export default function MelhoriasPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Melhorias Contínuas</h1>
          <p className="text-muted-foreground">
            Análise de feedback e sugestões de melhoria do sistema
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Métricas Resumo */}
      <Suspense fallback={<MetricsSkeleton />}>
        <ImprovementMetrics />
      </Suspense>

      {/* Tabs Principais */}
      <Tabs defaultValue="melhorias" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="melhorias" className="flex items-center space-x-2">
            <Lightbulb className="w-4 h-4" />
            <span>Melhorias</span>
          </TabsTrigger>
          <TabsTrigger value="feedback" className="flex items-center space-x-2">
            <MessageSquare className="w-4 h-4" />
            <span>Feedback</span>
          </TabsTrigger>
          <TabsTrigger value="jornada" className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>Jornada do Usuário</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4" />
            <span>Analytics</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab: Melhorias */}
        <TabsContent value="melhorias" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-yellow-500" />
                  Pendentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">23</div>
                <p className="text-xs text-muted-foreground">
                  +3 esta semana
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Zap className="w-4 h-4 mr-2 text-blue-500" />
                  Em Progresso
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">8</div>
                <p className="text-xs text-muted-foreground">
                  5 desenvolvedores
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                  Concluídas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">47</div>
                <p className="text-xs text-muted-foreground">
                  Este mês
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2 text-purple-500" />
                  Score Médio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">8.7</div>
                <p className="text-xs text-muted-foreground">
                  +0.3 vs mês anterior
                </p>
              </CardContent>
            </Card>
          </div>

          <Suspense fallback={<ImprovementsListSkeleton />}>
            <ImprovementsList />
          </Suspense>
        </TabsContent>

        {/* Tab: Feedback */}
        <TabsContent value="feedback" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <MessageSquare className="w-4 h-4 mr-2 text-blue-500" />
                  Total de Feedbacks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">342</div>
                <p className="text-xs text-muted-foreground">
                  +28 esta semana
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2 text-green-500" />
                  Satisfação Média
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">4.2</div>
                <p className="text-xs text-muted-foreground">
                  ⭐ de 5 estrelas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Bug className="w-4 h-4 mr-2 text-red-500" />
                  Bugs Reportados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-muted-foreground">
                  -5 vs semana anterior
                </p>
              </CardContent>
            </Card>
          </div>

          <Suspense fallback={<FeedbackAnalyticsSkeleton />}>
            <FeedbackAnalytics />
          </Suspense>
        </TabsContent>

        {/* Tab: Jornada do Usuário */}
        <TabsContent value="jornada" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Análise da Jornada do Usuário
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Mapeamento de comportamento e pontos de fricção
              </p>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<UserJourneyMapSkeleton />}>
                <UserJourneyMap />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Analytics */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tendências de Melhoria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  Gráfico de tendências será implementado aqui
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Impacto vs Esforço</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  Matriz de priorização será implementada aqui
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">ROI das Melhorias</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Redução de Bugs</span>
                    <Badge variant="secondary">-45%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Aumento de Satisfação</span>
                    <Badge variant="secondary">+23%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Melhoria de Performance</span>
                    <Badge variant="secondary">+18%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Redução de Suporte</span>
                    <Badge variant="secondary">-32%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Próximas Ações</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">
                        Otimizar carregamento da página de produtos
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Alta prioridade • 15 feedbacks
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <Lightbulb className="w-4 h-4 text-yellow-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">
                        Implementar busca avançada
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Média prioridade • 8 sugestões
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">
                        Melhorar UX do formulário
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Baixa prioridade • 3 feedbacks
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Componentes de Loading
function MetricsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
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

function ImprovementsListSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="h-6 bg-gray-200 rounded animate-pulse w-1/3" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function FeedbackAnalyticsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="h-6 bg-gray-200 rounded animate-pulse w-1/3" />
      </CardHeader>
      <CardContent>
        <div className="h-64 bg-gray-200 rounded animate-pulse" />
      </CardContent>
    </Card>
  )
}

function UserJourneyMapSkeleton() {
  return (
    <div className="h-96 bg-gray-200 rounded animate-pulse" />
  )
}