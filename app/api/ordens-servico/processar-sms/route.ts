// 📱 API Processar SMS - Fila de Envio
// Endpoint para processar SMS pendentes em lote

import { NextRequest, NextResponse } from 'next/server';
import { smsService } from '@/lib/services/sms-service';
import { createClient } from '@/lib/supabase/server';

// 📤 POST - Processar fila de SMS pendentes
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { limit = 10 } = body; // Limite de SMS por processamento

    const supabase = await createClient();

    // Buscar SMS pendentes
    const { data: smsPendentes, error: smsError } = await supabase
      .from('comunicacoes_cliente')
      .select(`
        id,
        cliente_telefone,
        conteudo,
        ordem_servico_id,
        tipo_comunicacao
      `)
      .eq('tipo', 'sms')
      .eq('status', 'pendente')
      .limit(limit);

    if (smsError) {
      console.error('❌ Erro ao buscar SMS pendentes:', smsError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Erro ao buscar SMS pendentes' 
        },
        { status: 500 }
      );
    }

    if (!smsPendentes || smsPendentes.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Nenhum SMS pendente encontrado',
        processados: 0
      });
    }

    const resultados = [];
    let sucessos = 0;
    let falhas = 0;

    // Processar cada SMS
    for (const sms of smsPendentes) {
      try {
        const resultado = await smsService.sendSMS(
          sms.cliente_telefone,
          sms.conteudo
        );

        if (resultado.success) {
          // Atualizar status para enviado
          await supabase
            .from('comunicacoes_cliente')
            .update({
              status: 'enviado',
              message_id: resultado.messageId,
              data_envio: new Date().toISOString()
            })
            .eq('id', sms.id);

          sucessos++;
          resultados.push({
            id: sms.id,
            telefone: sms.cliente_telefone,
            status: 'enviado',
            messageId: resultado.messageId
          });
        } else {
          // Atualizar status para erro
          await supabase
            .from('comunicacoes_cliente')
            .update({
              status: 'erro',
              erro_mensagem: resultado.error,
              data_atualizacao: new Date().toISOString()
            })
            .eq('id', sms.id);

          falhas++;
          resultados.push({
            id: sms.id,
            telefone: sms.cliente_telefone,
            status: 'erro',
            erro: resultado.error
          });
        }

        // Pequena pausa entre envios para evitar rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`❌ Erro ao processar SMS ${sms.id}:`, error);
        
        // Atualizar status para erro
        await supabase
          .from('comunicacoes_cliente')
          .update({
            status: 'erro',
            erro_mensagem: error instanceof Error ? error.message : 'Erro desconhecido',
            data_atualizacao: new Date().toISOString()
          })
          .eq('id', sms.id);

        falhas++;
        resultados.push({
          id: sms.id,
          telefone: sms.cliente_telefone,
          status: 'erro',
          erro: error instanceof Error ? error.message : 'Erro desconhecido'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processamento concluído: ${sucessos} sucessos, ${falhas} falhas`,
      processados: smsPendentes.length,
      sucessos,
      falhas,
      resultados
    });

  } catch (error) {
    console.error('❌ Erro no processamento de SMS:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    );
  }
}

// 📊 GET - Status da fila de SMS
export async function GET() {
  try {
    const supabase = await createClient();

    // Contar SMS por status
    const { data: statusCount, error } = await supabase
      .from('comunicacoes_cliente')
      .select('status')
      .eq('tipo', 'sms');

    if (error) {
      console.error('❌ Erro ao buscar status SMS:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Erro ao buscar status' 
        },
        { status: 500 }
      );
    }

    const contadores = statusCount?.reduce((acc: any, item: any) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {}) || {};

    return NextResponse.json({
      success: true,
      fila: {
        pendentes: contadores.pendente || 0,
        enviados: contadores.enviado || 0,
        erros: contadores.erro || 0,
        total: statusCount?.length || 0
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro ao verificar fila SMS:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    );
  }
}