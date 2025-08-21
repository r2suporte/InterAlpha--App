'use client'

/**
 * Componente de análise de feedback
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, MessageSquare, Star } from 'lucide-react'

interface FeedbackAnalyticsProps {
  className?: string
}

export function FeedbackAnalytics({ className }: FeedbackAnalyticsProps) {
  // Mock data - substituir por dados reais
  const analytics = {
    totalFeedbacks: 156,
    averageRating: 4.2,
    positivePercentage: 78,
    negativePercentage: 22,
    trends: {
      rating: 0.3,
      volume: 12
    }
  }

  return (
    <div className={className}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Feedbacks</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalFeedbacks}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              +{analytics.trends.volume}% este mês
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avaliação Média</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.averageRating}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              +{analytics.trends.rating} este mês
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Feedbacks Positivos</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{analytics.positivePercentage}%</div>
            <div className="text-xs text-muted-foreground">
              {Math.round(analytics.totalFeedbacks * analytics.positivePercentage / 100)} feedbacks
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Feedbacks Negativos</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{analytics.negativePercentage}%</div>
            <div className="text-xs text-muted-foreground">
              {Math.round(analytics.totalFeedbacks * analytics.negativePercentage / 100)} feedbacks
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Análise de Sentimento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Muito Positivo</span>
                <Badge className="bg-green-100 text-green-800">32%</Badge>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '32%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Positivo</span>
                <Badge className="bg-green-100 text-green-800">46%</Badge>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-400 h-2 rounded-full" style={{ width: '46%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Neutro</span>
                <Badge variant="secondary">12%</Badge>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-gray-400 h-2 rounded-full" style={{ width: '12%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Negativo</span>
                <Badge className="bg-red-100 text-red-800">10%</Badge>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-red-400 h-2 rounded-full" style={{ width: '10%' }}></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}