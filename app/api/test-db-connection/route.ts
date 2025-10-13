import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Teste simples de conexão - buscar uma linha de uma tabela básica
    const { data, error } = await supabase
      .from('clientes')
      .select('id')
      .limit(1);

    if (error) {
      console.error('Erro na conexão com o banco:', error);
      return NextResponse.json(
        {
          success: false,
          message: 'Falha na conexão com o banco de dados',
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }

    // Teste adicional - verificar se consegue executar uma query simples
    const { data: testQuery, error: testError } = await supabase.rpc('version');

    return NextResponse.json(
      {
        success: true,
        message: 'Conexão com o banco de dados estabelecida com sucesso',
        details: {
          database_accessible: true,
          tables_accessible: true,
          query_execution: !testError,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro no teste de conexão:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Erro interno no teste de conexão',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
