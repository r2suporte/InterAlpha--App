import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get('tipo') || 'basic'
    const formato = searchParams.get('formato') || 'json'
    const periodo = searchParams.get('periodo') || '30'
    
    const supabase = await createClient()

    // Data de início baseada no período
    const dataInicio = new Date()
    dataInicio.setDate(dataInicio.getDate() - parseInt(periodo))

    let dados: any = {}

    // Buscar dados baseado no tipo de relatório
    if (tipo === 'basic' || tipo === 'all') {
      const { data: clientes } = await supabase
        .from('clientes')
        .select('*')
        .gte('created_at', dataInicio.toISOString())

      const { data: ordens } = await supabase
        .from('ordens_servico')
        .select('*')
        .gte('created_at', dataInicio.toISOString())

      dados.basic = {
        clientes: clientes || [],
        ordens_servico: ordens || []
      }
    }

    if (tipo === 'financial' || tipo === 'all') {
      const { data: ordensFinanceiro } = await supabase
        .from('ordens_servico')
        .select('id, valor_total, status, created_at, cliente_id')
        .gte('created_at', dataInicio.toISOString())

      dados.financial = ordensFinanceiro || []
    }

    if (tipo === 'technical' || tipo === 'all') {
      const { data: ordensTecnico } = await supabase
        .from('ordens_servico')
        .select('id, status, tipo_servico, tecnico_responsavel, created_at, updated_at')
        .gte('created_at', dataInicio.toISOString())

      const { data: equipamentos } = await supabase
        .from('equipamentos')
        .select('*')

      dados.technical = {
        ordens: ordensTecnico || [],
        equipamentos: equipamentos || []
      }
    }

    // Preparar resposta baseada no formato
    if (formato === 'csv') {
      // Converter para CSV (implementação simplificada)
      let csvContent = ''
      
      if (dados.basic?.ordens_servico) {
        csvContent += 'ID,Status,Valor Total,Data Criação,Cliente ID\n'
        dados.basic.ordens_servico.forEach((ordem: any) => {
          csvContent += `${ordem.id},${ordem.status},${ordem.valor_total || 0},${ordem.created_at},${ordem.cliente_id}\n`
        })
      }

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="relatorio_${tipo}_${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    }

    // Retornar JSON por padrão
    return NextResponse.json({
      success: true,
      message: 'Dados exportados com sucesso',
      data: dados,
      metadata: {
        tipo_relatorio: tipo,
        formato: formato,
        periodo_dias: parseInt(periodo),
        data_inicio: dataInicio.toISOString(),
        data_fim: new Date().toISOString(),
        exportado_em: new Date().toISOString()
      }
    }, { status: 200 })

  } catch (error) {
    console.error('Erro ao exportar relatório:', error)
    return NextResponse.json({
      success: false,
      message: 'Erro ao exportar relatório',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tipo, formato = 'json', periodo = '30', filtros = {} } = body
    
    const supabase = await createClient()

    // Data de início baseada no período
    const dataInicio = new Date()
    dataInicio.setDate(dataInicio.getDate() - parseInt(periodo))

    // Implementar lógica de exportação com filtros personalizados
    // Esta é uma implementação básica que pode ser expandida

    let query = supabase
      .from('ordens_servico')
      .select('*')
      .gte('created_at', dataInicio.toISOString())

    // Aplicar filtros se fornecidos
    if (filtros.status) {
      query = query.eq('status', filtros.status)
    }
    if (filtros.tecnico_responsavel) {
      query = query.eq('tecnico_responsavel', filtros.tecnico_responsavel)
    }

    const { data: ordens, error } = await query

    if (error) {
      throw new Error('Erro ao buscar dados para exportação')
    }

    return NextResponse.json({
      success: true,
      message: 'Exportação personalizada gerada com sucesso',
      data: ordens,
      filtros_aplicados: filtros,
      metadata: {
        tipo_relatorio: tipo,
        formato: formato,
        periodo_dias: parseInt(periodo),
        data_inicio: dataInicio.toISOString(),
        data_fim: new Date().toISOString(),
        exportado_em: new Date().toISOString()
      }
    }, { status: 200 })

  } catch (error) {
    console.error('Erro ao exportar relatório personalizado:', error)
    return NextResponse.json({
      success: false,
      message: 'Erro ao exportar relatório personalizado',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}