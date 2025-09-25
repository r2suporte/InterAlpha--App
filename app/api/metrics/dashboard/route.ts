// 📊 API do Dashboard de Métricas - Agregação de Dados para Visualização
// Endpoint para fornecer dados consolidados do dashboard

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { applicationMetrics } from '@/lib/services/application-metrics'
import { withAuthenticatedApiMetrics } from '@/lib/middleware/metrics-middleware'

// 📈 Interfaces para Resposta do Dashboard
interface MetricValue {
  current: number
  previous: number
  trend: 'up' | 'down' | 'stable'
  unit: string
}

interface DashboardResponse {
  performance: {
    responseTime: MetricValue
    throughput: MetricValue
    errorRate: MetricValue
    uptime: MetricValue
  }
  usage: {
    activeUsers: MetricValue
    apiCalls: MetricValue
    pageViews: MetricValue
    sessionDuration: MetricValue
  }
  business: {
    ordersCreated: MetricValue
    clientsRegistered: MetricValue
    revenue: MetricValue
    conversionRate: MetricValue
  }
  system: {
    cpuUsage: MetricValue
    memoryUsage: MetricValue
    diskUsage: MetricValue
    networkLatency: MetricValue
  }
  alerts: Array<{
    id: string
    type: 'error' | 'warning' | 'info'
    title: string
    description: string
    timestamp: string
    resolved: boolean
  }>
  lastUpdated: string
}

// 🔧 Função para Calcular Tendência
function calculateTrend(current: number, previous: number): 'up' | 'down' | 'stable' {
  if (previous === 0) return 'stable'
  const change = ((current - previous) / previous) * 100
  if (Math.abs(change) < 5) return 'stable'
  return change > 0 ? 'up' : 'down'
}

// 📊 Função para Buscar Métricas de Performance
async function getPerformanceMetrics(supabase: any) {
  const now = new Date()
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000)

  // Buscar métricas de tempo de resposta
  const { data: responseTimeData } = await supabase
    .from('application_metrics')
    .select('value, created_at')
    .eq('name', 'api_response_time')
    .gte('created_at', twoDaysAgo.toISOString())
    .order('created_at', { ascending: false })

  // Calcular médias
  const currentPeriod = responseTimeData?.filter((m: any) => 
    new Date(m.created_at) >= oneDayAgo
  ) || []
  
  const previousPeriod = responseTimeData?.filter((m: any) => 
    new Date(m.created_at) >= twoDaysAgo && new Date(m.created_at) < oneDayAgo
  ) || []

  const currentAvg = currentPeriod.length > 0 
    ? currentPeriod.reduce((sum: number, m: any) => sum + m.value, 0) / currentPeriod.length
    : 0

  const previousAvg = previousPeriod.length > 0
    ? previousPeriod.reduce((sum: number, m: any) => sum + m.value, 0) / previousPeriod.length
    : 0

  // Buscar throughput (chamadas por minuto)
  const { data: throughputData } = await supabase
    .from('application_metrics')
    .select('value, created_at')
    .eq('name', 'api_calls')
    .gte('created_at', oneDayAgo.toISOString())

  const currentThroughput = throughputData?.length || 0
  const previousThroughput = Math.floor(currentThroughput * 0.9) // Simulado

  // Buscar taxa de erro
  const { data: errorData } = await supabase
    .from('application_metrics')
    .select('value, created_at')
    .eq('name', 'failed_requests')
    .gte('created_at', oneDayAgo.toISOString())

  const errorCount = errorData?.reduce((sum: number, m: any) => sum + m.value, 0) || 0
  const totalRequests = Math.max(currentThroughput, 1)
  const errorRate = (errorCount / totalRequests) * 100

  return {
    responseTime: {
      current: Math.round(currentAvg),
      previous: Math.round(previousAvg),
      trend: calculateTrend(currentAvg, previousAvg),
      unit: 'ms'
    },
    throughput: {
      current: currentThroughput,
      previous: previousThroughput,
      trend: calculateTrend(currentThroughput, previousThroughput),
      unit: 'req/min'
    },
    errorRate: {
      current: Math.round(errorRate * 100) / 100,
      previous: Math.round(errorRate * 0.8 * 100) / 100, // Simulado
      trend: calculateTrend(errorRate, errorRate * 0.8),
      unit: '%'
    },
    uptime: {
      current: 99.9,
      previous: 99.8,
      trend: 'up' as const,
      unit: '%'
    }
  }
}

// 👥 Função para Buscar Métricas de Uso
async function getUsageMetrics(supabase: any) {
  const now = new Date()
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  // Buscar usuários ativos (simulado baseado em chamadas de API)
  const { data: apiCallsData } = await supabase
    .from('application_metrics')
    .select('tags, created_at')
    .eq('name', 'api_calls')
    .gte('created_at', oneDayAgo.toISOString())

  const uniqueUsers = new Set(
    apiCallsData?.map((call: any) => call.tags?.user_id).filter(Boolean) || []
  ).size

  return {
    activeUsers: {
      current: uniqueUsers,
      previous: Math.floor(uniqueUsers * 0.9),
      trend: calculateTrend(uniqueUsers, uniqueUsers * 0.9),
      unit: 'usuários'
    },
    apiCalls: {
      current: apiCallsData?.length || 0,
      previous: Math.floor((apiCallsData?.length || 0) * 0.85),
      trend: 'up' as const,
      unit: 'chamadas'
    },
    pageViews: {
      current: Math.floor((apiCallsData?.length || 0) * 1.5), // Estimativa
      previous: Math.floor((apiCallsData?.length || 0) * 1.3),
      trend: 'up' as const,
      unit: 'visualizações'
    },
    sessionDuration: {
      current: 12.5,
      previous: 11.8,
      trend: 'up' as const,
      unit: 'min'
    }
  }
}

// 💼 Função para Buscar Métricas de Negócio
async function getBusinessMetrics(supabase: any) {
  const now = new Date()
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000)

  // Buscar ordens criadas
  const { data: ordersToday } = await supabase
    .from('ordens_servico')
    .select('id, valor_total')
    .gte('created_at', oneDayAgo.toISOString())

  const { data: ordersYesterday } = await supabase
    .from('ordens_servico')
    .select('id, valor_total')
    .gte('created_at', twoDaysAgo.toISOString())
    .lt('created_at', oneDayAgo.toISOString())

  // Buscar clientes registrados
  const { data: clientsToday } = await supabase
    .from('clientes')
    .select('id')
    .gte('created_at', oneDayAgo.toISOString())

  const { data: clientsYesterday } = await supabase
    .from('clientes')
    .select('id')
    .gte('created_at', twoDaysAgo.toISOString())
    .lt('created_at', oneDayAgo.toISOString())

  // Calcular receita
  const revenueToday = ordersToday?.reduce((sum: number, order: any) => 
    sum + (parseFloat(order.valor_total) || 0), 0) || 0
  
  const revenueYesterday = ordersYesterday?.reduce((sum: number, order: any) => 
    sum + (parseFloat(order.valor_total) || 0), 0) || 0

  return {
    ordersCreated: {
      current: ordersToday?.length || 0,
      previous: ordersYesterday?.length || 0,
      trend: calculateTrend(ordersToday?.length || 0, ordersYesterday?.length || 0),
      unit: 'ordens'
    },
    clientsRegistered: {
      current: clientsToday?.length || 0,
      previous: clientsYesterday?.length || 0,
      trend: calculateTrend(clientsToday?.length || 0, clientsYesterday?.length || 0),
      unit: 'clientes'
    },
    revenue: {
      current: Math.round(revenueToday * 100) / 100,
      previous: Math.round(revenueYesterday * 100) / 100,
      trend: calculateTrend(revenueToday, revenueYesterday),
      unit: 'R$'
    },
    conversionRate: {
      current: 2.5,
      previous: 2.1,
      trend: 'up' as const,
      unit: '%'
    }
  }
}

// 🖥️ Função para Buscar Métricas de Sistema (simuladas)
async function getSystemMetrics() {
  return {
    cpuUsage: {
      current: 45,
      previous: 52,
      trend: 'down' as const,
      unit: '%'
    },
    memoryUsage: {
      current: 68,
      previous: 71,
      trend: 'down' as const,
      unit: '%'
    },
    diskUsage: {
      current: 34,
      previous: 33,
      trend: 'up' as const,
      unit: '%'
    },
    networkLatency: {
      current: 12,
      previous: 15,
      trend: 'down' as const,
      unit: 'ms'
    }
  }
}

// 🚨 Função para Buscar Alertas
async function getAlerts(supabase: any) {
  const now = new Date()
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  // Buscar erros recentes para gerar alertas
  const { data: recentErrors } = await supabase
    .from('application_metrics')
    .select('*')
    .eq('name', 'exception_count')
    .gte('created_at', oneDayAgo.toISOString())
    .order('created_at', { ascending: false })
    .limit(10)

  const alerts = []

  // Gerar alertas baseados em erros
  if (recentErrors && recentErrors.length > 5) {
    alerts.push({
      id: 'high-error-rate',
      type: 'warning' as const,
      title: 'Taxa de Erro Elevada',
      description: `${recentErrors.length} erros detectados nas últimas 24 horas`,
      timestamp: new Date().toISOString(),
      resolved: false
    })
  }

  // Alertas simulados para demonstração
  if (Math.random() > 0.7) {
    alerts.push({
      id: 'slow-response',
      type: 'info' as const,
      title: 'Resposta Lenta Detectada',
      description: 'Algumas APIs estão respondendo mais lentamente que o normal',
      timestamp: new Date().toISOString(),
      resolved: false
    })
  }

  return alerts
}

// 📊 Handler Principal
async function getDashboardMetrics(request: NextRequest) {
  try {
    const supabase = createClient()

    // Buscar todas as métricas em paralelo
    const [performance, usage, business, system, alerts] = await Promise.all([
      getPerformanceMetrics(supabase),
      getUsageMetrics(supabase),
      getBusinessMetrics(supabase),
      getSystemMetrics(),
      getAlerts(supabase)
    ])

    const response: DashboardResponse = {
      performance,
      usage,
      business,
      system,
      alerts,
      lastUpdated: new Date().toISOString()
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Erro ao buscar métricas do dashboard:', error)
    
    return NextResponse.json(
      { 
        error: 'Falha ao carregar métricas do dashboard',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}

// Exportação com middleware de métricas
export const GET = withAuthenticatedApiMetrics(getDashboardMetrics)