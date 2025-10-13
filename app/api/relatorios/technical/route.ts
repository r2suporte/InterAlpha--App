import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const periodo = searchParams.get('periodo') || '30'; // dias

    const supabase = await createClient();

    // Data de início baseada no período
    const dataInicio = new Date();
    dataInicio.setDate(dataInicio.getDate() - parseInt(periodo));

    // Buscar dados técnicos
    const { data: ordens, error: errorOrdens } = await supabase
      .from('ordens_servico')
      .select(
        'id, status, tipo_servico, tecnico_responsavel, created_at, updated_at'
      )
      .gte('created_at', dataInicio.toISOString());

    const { data: equipamentos, error: errorEquipamentos } = await supabase
      .from('equipamentos')
      .select('id, tipo, modelo, status');

    if (errorOrdens || errorEquipamentos) {
      throw new Error('Erro ao buscar dados técnicos');
    }

    // Análise de performance técnica
    const ordensFinalizadas =
      ordens?.filter(ordem => ordem.status === 'finalizada') || [];

    // Tempo médio de resolução (em dias)
    const temposResolucao = ordensFinalizadas.map(ordem => {
      const inicio = new Date(ordem.created_at);
      const fim = new Date(ordem.updated_at);
      return (fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24); // dias
    });

    const tempoMedioResolucao =
      temposResolucao.length > 0
        ? temposResolucao.reduce((acc, tempo) => acc + tempo, 0) /
          temposResolucao.length
        : 0;

    // Análise por tipo de serviço
    const servicosPorTipo = ordens?.reduce((acc: any, ordem: any) => {
      const tipo = ordem.tipo_servico || 'Não especificado';
      acc[tipo] = (acc[tipo] || 0) + 1;
      return acc;
    }, {});

    // Análise por técnico
    const ordensPorTecnico = ordens?.reduce((acc: any, ordem: any) => {
      const tecnico = ordem.tecnico_responsavel || 'Não atribuído';
      acc[tecnico] = (acc[tecnico] || 0) + 1;
      return acc;
    }, {});

    // Análise de equipamentos
    const equipamentosPorTipo = equipamentos?.reduce((acc: any, equip: any) => {
      acc[equip.tipo] = (acc[equip.tipo] || 0) + 1;
      return acc;
    }, {});

    const relatorio = {
      performance: {
        tempo_medio_resolucao_dias: Math.round(tempoMedioResolucao * 100) / 100,
        ordens_finalizadas: ordensFinalizadas.length,
        taxa_finalizacao: ordens?.length
          ? (ordensFinalizadas.length / ordens.length) * 100
          : 0,
      },
      servicos_por_tipo: servicosPorTipo,
      ordens_por_tecnico: ordensPorTecnico,
      equipamentos_por_tipo: equipamentosPorTipo,
      ordens_por_status: ordens?.reduce((acc: any, ordem: any) => {
        acc[ordem.status] = (acc[ordem.status] || 0) + 1;
        return acc;
      }, {}),
      metadata: {
        periodo_dias: parseInt(periodo),
        data_inicio: dataInicio.toISOString(),
        data_fim: new Date().toISOString(),
        tipo_relatorio: 'technical',
        gerado_em: new Date().toISOString(),
      },
    };

    return NextResponse.json(
      {
        success: true,
        message: 'Relatório técnico gerado com sucesso',
        data: relatorio,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao gerar relatório técnico:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Erro ao gerar relatório técnico',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}
