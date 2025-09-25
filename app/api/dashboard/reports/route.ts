// 📊 API de Relatórios do Dashboard - Dados Consolidados para Visualização
// Endpoint específico para relatórios do dashboard com métricas agregadas

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withAuthenticatedApiMetrics } from '@/lib/middleware/metrics-middleware'
import { requireAuth, AuthenticatedUser } from '@/lib/auth/role-middleware'

// 📈 Interfaces para Resposta de Relatórios do Dashboard
interface DashboardReportResponse {
  summary: {
    totalClientes: number
    totalOrdens: number
    ordensAbertas: number
    ordensFinalizadas: number
    faturamentoMes: number
    crescimentoClientes: number
  }
  charts: {
    ordensStatus: Array<{
      status: string
      count: number
      percentage: number
    }>
    faturamentoPorMes: Array<{
      mes: string
      valor: number
    }>
    clientesPorTipo: Array<{
      tipo: string
      count: number
    }>
    equipamentosPorTipo: Array<{
      tipo: string
      count: number
    }>
  }
  trends: {
    ordensUltimos7Dias: Array<{
      data: string
      count: number
    }>
    clientesUltimos30Dias: Array<{
      data: string
      count: number
    }>
  }
  alerts: Array<{
    id: string
    type: 'warning' | 'error' | 'info'
    title: string
    description: string
    timestamp: string
  }>
  metadata: {
    periodo: string
    dataInicio: string
    dataFim: string
    geradoEm: string
  }
}

// 🔧 Função para Calcular Crescimento Percentual
function calculateGrowth(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

// 📊 Função Principal para Gerar Relatórios do Dashboard
async function getDashboardReports(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const periodo = searchParams.get('periodo') || '30' // dias
    const includeCharts = searchParams.get('charts') !== 'false'
    const includeTrends = searchParams.get('trends') !== 'false'

    const supabase = await createClient()
    
    // Definir períodos
    const now = new Date()
    const dataFim = now
    const dataInicio = new Date(now.getTime() - parseInt(periodo) * 24 * 60 * 60 * 1000)
    const periodoAnterior = new Date(dataInicio.getTime() - parseInt(periodo) * 24 * 60 * 60 * 1000)

    // 📈 RESUMO EXECUTIVO
    const [
      { count: totalClientes },
      { count: clientesNovos },
      { count: clientesAnteriores },
      { count: totalOrdens },
      { count: ordensAbertas },
      { count: ordensFinalizadas }
    ] = await Promise.all([
      supabase.from('clientes').select('id', { count: 'exact', head: true }),
      supabase.from('clientes').select('id', { count: 'exact', head: true })
        .gte('created_at', dataInicio.toISOString()),
      supabase.from('clientes').select('id', { count: 'exact', head: true })
        .gte('created_at', periodoAnterior.toISOString())
        .lt('created_at', dataInicio.toISOString()),
      supabase.from('ordens_servico').select('id', { count: 'exact', head: true }),
      supabase.from('ordens_servico').select('id', { count: 'exact', head: true })
        .in('status', ['aberta', 'em_andamento', 'aguardando_peca']),
      supabase.from('ordens_servico').select('id', { count: 'exact', head: true })
        .eq('status', 'concluida')
    ])

    // Calcular faturamento
    const { data: ordensComValor } = await supabase
      .from('ordens_servico')
      .select('valor_servico')
      .eq('status', 'concluida')
      .gte('created_at', dataInicio.toISOString())

    const faturamentoMes = ordensComValor?.reduce((sum: number, ordem: any) => 
      sum + (parseFloat(ordem.valor_servico) || 0), 0) || 0

    const crescimentoClientes = calculateGrowth(
      clientesNovos || 0,
      clientesAnteriores || 0
    )

    const summary = {
      totalClientes: totalClientes || 0,
      totalOrdens: totalOrdens || 0,
      ordensAbertas: ordensAbertas || 0,
      ordensFinalizadas: ordensFinalizadas || 0,
      faturamentoMes,
      crescimentoClientes
    }

    // 📊 GRÁFICOS (opcional)
    let charts = {}
    if (includeCharts) {
      const [
        { data: ordensStatus },
        { data: equipamentos },
        { data: clientes }
      ] = await Promise.all([
        supabase.from('ordens_servico').select('status'),
        supabase.from('equipamentos').select('tipo'),
        supabase.from('clientes').select('tipo_cliente')
      ])

      // Distribuição por status
      const statusCount = ordensStatus?.reduce((acc: any, ordem: any) => {
        acc[ordem.status] = (acc[ordem.status] || 0) + 1
        return acc
      }, {}) || {}

      const totalOrdensChart = Object.values(statusCount).reduce((sum: number, count: any) => sum + count, 0)
      
      charts = {
        ordensStatus: Object.entries(statusCount).map(([status, count]) => ({
          status,
          count: count as number,
          percentage: totalOrdensChart > 0 ? Math.round(((count as number) / totalOrdensChart) * 100) : 0
        })),
        
        equipamentosPorTipo: Object.entries(
          equipamentos?.reduce((acc: any, equip: any) => {
            acc[equip.tipo] = (acc[equip.tipo] || 0) + 1
            return acc
          }, {}) || {}
        ).map(([tipo, count]) => ({ tipo, count: count as number })),

        clientesPorTipo: Object.entries(
          clientes?.reduce((acc: any, cliente: any) => {
            const tipo = cliente.tipo_cliente || 'Não especificado'
            acc[tipo] = (acc[tipo] || 0) + 1
            return acc
          }, {}) || {}
        ).map(([tipo, count]) => ({ tipo, count: count as number })),

        faturamentoPorMes: [] // Implementar conforme necessidade
      }
    }

    // 📈 TENDÊNCIAS (opcional)
    let trends = {}
    if (includeTrends) {
      // Ordens dos últimos 7 dias
      const ultimos7Dias = Array.from({ length: 7 }, (_, i) => {
        const data = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
        return data.toISOString().split('T')[0]
      }).reverse()

      const ordensUltimos7Dias = await Promise.all(
        ultimos7Dias.map(async (data) => {
          const { count } = await supabase
            .from('ordens_servico')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', `${data}T00:00:00.000Z`)
            .lt('created_at', `${data}T23:59:59.999Z`)
          
          return {
            data,
            count: count || 0
          }
        })
      )

      trends = {
        ordensUltimos7Dias,
        clientesUltimos30Dias: [] // Implementar se necessário
      }
    }

    // 🚨 ALERTAS
    const alerts = []
    
    // Alerta de ordens em atraso (exemplo)
    if (ordensAbertas && ordensAbertas > 10) {
      alerts.push({
        id: 'ordens-abertas-alto',
        type: 'warning' as const,
        title: 'Muitas ordens abertas',
        description: `Existem ${ordensAbertas} ordens de serviço abertas`,
        timestamp: now.toISOString()
      })
    }

    // Alerta de crescimento negativo
    if (crescimentoClientes < -10) {
      alerts.push({
        id: 'crescimento-negativo',
        type: 'error' as const,
        title: 'Queda no crescimento de clientes',
        description: `Crescimento de clientes caiu ${Math.abs(crescimentoClientes)}% no período`,
        timestamp: now.toISOString()
      })
    }

    const response: DashboardReportResponse = {
      summary,
      charts: charts as any,
      trends: trends as any,
      alerts,
      metadata: {
        periodo: `${periodo} dias`,
        dataInicio: dataInicio.toISOString(),
        dataFim: dataFim.toISOString(),
        geradoEm: now.toISOString()
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Relatório do dashboard gerado com sucesso',
      data: response
    })

  } catch (error) {
    console.error('Erro ao gerar relatório do dashboard:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Falha ao gerar relatório do dashboard',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

// Exportação com middleware de métricas
export async function GET(request: NextRequest) {
  const middleware = requireAuth();
  return await middleware(request, async (req: NextRequest, user: AuthenticatedUser) => {
    return await withAuthenticatedApiMetrics(getDashboardReports)(req);
  });
}