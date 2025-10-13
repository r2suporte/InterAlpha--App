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

    // Buscar dados financeiros
    const { data: ordens, error: errorOrdens } = await supabase
      .from('ordens_servico')
      .select('id, valor_total, status, created_at')
      .gte('created_at', dataInicio.toISOString());

    if (errorOrdens) {
      throw new Error('Erro ao buscar ordens de serviço');
    }

    // Calcular métricas financeiras
    const ordensFinalizadas =
      ordens?.filter(ordem => ordem.status === 'finalizada') || [];
    const receitaTotal = ordensFinalizadas.reduce(
      (acc, ordem) => acc + (ordem.valor_total || 0),
      0
    );
    const ticketMedio =
      ordensFinalizadas.length > 0
        ? receitaTotal / ordensFinalizadas.length
        : 0;

    // Receita por mês (últimos 12 meses)
    const receitaPorMes: { [key: string]: number } = {};
    ordensFinalizadas.forEach(ordem => {
      const mes = new Date(ordem.created_at).toISOString().substring(0, 7); // YYYY-MM
      receitaPorMes[mes] = (receitaPorMes[mes] || 0) + (ordem.valor_total || 0);
    });

    const relatorio = {
      resumo: {
        receita_total: receitaTotal,
        ordens_finalizadas: ordensFinalizadas.length,
        ticket_medio: ticketMedio,
        periodo_dias: parseInt(periodo),
      },
      receita_por_mes: receitaPorMes,
      ordens_por_status: ordens?.reduce((acc: any, ordem: any) => {
        acc[ordem.status] = (acc[ordem.status] || 0) + 1;
        return acc;
      }, {}),
      metadata: {
        periodo_dias: parseInt(periodo),
        data_inicio: dataInicio.toISOString(),
        data_fim: new Date().toISOString(),
        tipo_relatorio: 'financial',
        gerado_em: new Date().toISOString(),
      },
    };

    return NextResponse.json(
      {
        success: true,
        message: 'Relatório financeiro gerado com sucesso',
        data: relatorio,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao gerar relatório financeiro:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Erro ao gerar relatório financeiro',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}
