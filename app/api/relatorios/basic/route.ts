import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const periodo = searchParams.get('periodo') || '30' // dias
    
    const supabase = await createClient()

    // Data de início baseada no período
    const dataInicio = new Date()
    dataInicio.setDate(dataInicio.getDate() - parseInt(periodo))

    // Relatório básico com informações gerais
    const { data: totalClientes, error: errorClientes } = await supabase
      .from('clientes')
      .select('id', { count: 'exact' })

    const { data: clientesNovos, error: errorClientesNovos } = await supabase
      .from('clientes')
      .select('id', { count: 'exact' })
      .gte('created_at', dataInicio.toISOString())

    const { data: totalOrdens, error: errorOrdens } = await supabase
      .from('ordens_servico')
      .select('id, status', { count: 'exact' })

    const { data: ordensNovos, error: errorOrdensNovos } = await supabase
      .from('ordens_servico')
      .select('id', { count: 'exact' })
      .gte('created_at', dataInicio.toISOString())

    if (errorClientes || errorClientesNovos || errorOrdens || errorOrdensNovos) {
      throw new Error('Erro ao buscar dados para relatório')
    }

    // Contar ordens por status
    const statusCount = totalOrdens?.reduce((acc: any, ordem: any) => {
      acc[ordem.status] = (acc[ordem.status] || 0) + 1
      return acc
    }, {})

    const relatorio = {
      clientes: {
        total: totalClientes?.length || 0,
        novos_periodo: clientesNovos?.length || 0
      },
      ordens_servico: {
        total: totalOrdens?.length || 0,
        novas_periodo: ordensNovos?.length || 0,
        por_status: statusCount || {}
      },
      metadata: {
        periodo_dias: parseInt(periodo),
        data_inicio: dataInicio.toISOString(),
        data_fim: new Date().toISOString(),
        tipo_relatorio: 'basic',
        gerado_em: new Date().toISOString()
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Relatório básico gerado com sucesso',
      data: relatorio
    }, { status: 200 })

  } catch (error) {
    console.error('Erro ao gerar relatório básico:', error)
    return NextResponse.json({
      success: false,
      message: 'Erro ao gerar relatório básico',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}