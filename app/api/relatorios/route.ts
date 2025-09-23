import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const periodo = searchParams.get('periodo') || '30' // dias
    const tipo = searchParams.get('tipo') || 'geral'

    const supabase = await createClient()

    // Data de início baseada no período
    const dataInicio = new Date()
    dataInicio.setDate(dataInicio.getDate() - parseInt(periodo))

    let relatorio: any = {}

    if (tipo === 'geral' || tipo === 'clientes') {
      // Relatório de clientes
      const { data: totalClientes, error: errorClientes } = await supabase
        .from('clientes')
        .select('id', { count: 'exact' })

      const { data: clientesNovos, error: errorClientesNovos } = await supabase
        .from('clientes')
        .select('id', { count: 'exact' })
        .gte('created_at', dataInicio.toISOString())

      if (!errorClientes && !errorClientesNovos) {
        relatorio.clientes = {
          total: totalClientes?.length || 0,
          novos_periodo: clientesNovos?.length || 0
        }
      }
    }

    if (tipo === 'geral' || tipo === 'ordens') {
      // Relatório de ordens de serviço
      const { data: totalOrdens, error: errorOrdens } = await supabase
        .from('ordens_servico')
        .select('id, status', { count: 'exact' })

      const { data: ordensNovos, error: errorOrdensNovos } = await supabase
        .from('ordens_servico')
        .select('id', { count: 'exact' })
        .gte('created_at', dataInicio.toISOString())

      if (!errorOrdens && !errorOrdensNovos) {
        // Contar por status
        const statusCount = totalOrdens?.reduce((acc: any, ordem: any) => {
          acc[ordem.status] = (acc[ordem.status] || 0) + 1
          return acc
        }, {})

        relatorio.ordens_servico = {
          total: totalOrdens?.length || 0,
          novas_periodo: ordensNovos?.length || 0,
          por_status: statusCount || {}
        }
      }
    }

    if (tipo === 'geral' || tipo === 'equipamentos') {
      // Relatório de equipamentos
      const { data: totalEquipamentos, error: errorEquipamentos } = await supabase
        .from('equipamentos')
        .select('id, tipo', { count: 'exact' })

      if (!errorEquipamentos) {
        // Contar por tipo
        const tipoCount = totalEquipamentos?.reduce((acc: any, equip: any) => {
          acc[equip.tipo] = (acc[equip.tipo] || 0) + 1
          return acc
        }, {})

        relatorio.equipamentos = {
          total: totalEquipamentos?.length || 0,
          por_tipo: tipoCount || {}
        }
      }
    }

    // Adicionar metadados do relatório
    relatorio.metadata = {
      periodo_dias: parseInt(periodo),
      data_inicio: dataInicio.toISOString(),
      data_fim: new Date().toISOString(),
      tipo_relatorio: tipo,
      gerado_em: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      message: 'Relatório gerado com sucesso',
      data: relatorio
    }, { status: 200 })

  } catch (error) {
    console.error('Erro ao gerar relatório:', error)
    return NextResponse.json({
      success: false,
      message: 'Erro ao gerar relatório',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}