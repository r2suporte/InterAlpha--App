import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

// GET - Listar equipamentos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');

    const supabase = await createClient();

    let query = supabase.from('equipamentos').select('*');

    // Aplicar filtro de busca
    if (search) {
      query = query.or(
        `modelo.ilike.%${search}%,serial_number.ilike.%${search}%,imei.ilike.%${search}%`
      );
    }

    // Aplicar paginação
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query.order('created_at', { ascending: false }).range(from, to);

    const { data: equipamentos, error, count } = await query;

    if (error) {
      console.error('Erro ao buscar equipamentos:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar equipamentos' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: equipamentos,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Erro na listagem de equipamentos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar novo equipamento
export async function POST(request: NextRequest) {
  try {
    const {
      tipo,
      modelo,
      serial_number,
      ano_fabricacao,
      cor,
      configuracao,
      status_garantia,
      data_compra,
      data_vencimento_garantia_apple,
      data_vencimento_garantia_loja,
      numero_nota_fiscal,
      loja_compra,
      condicao_geral,
      danos_visiveis,
      descricao_danos,
      acessorios_inclusos,
      versao_sistema,
      senha_desbloqueio,
      icloud_removido,
      find_my_desabilitado,
    } = await request.json();

    // Validação dos campos obrigatórios
    if (!tipo || !modelo || !serial_number) {
      return NextResponse.json(
        { error: 'Tipo, modelo e serial number são obrigatórios' },
        { status: 400 }
      );
    }

    // Validar tipo de equipamento
    const tiposValidos = [
      'macbook_air',
      'macbook_pro',
      'mac_mini',
      'imac',
      'mac_studio',
      'mac_pro',
      'ipad',
      'ipad_air',
      'ipad_pro',
      'ipad_mini',
    ];

    if (!tiposValidos.includes(tipo)) {
      return NextResponse.json(
        { error: `Tipo inválido. Tipos válidos: ${tiposValidos.join(', ')}` },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verificar se já existe equipamento com o mesmo serial number
    const { data: equipamentoExistente, error: errorBusca } = await supabase
      .from('equipamentos')
      .select('*')
      .eq('serial_number', serial_number)
      .single();

    if (errorBusca && errorBusca.code !== 'PGRST116') {
      console.error('Erro ao buscar equipamento:', errorBusca);
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      );
    }

    if (equipamentoExistente) {
      return NextResponse.json(
        { error: 'Já existe um equipamento cadastrado com este serial number' },
        { status: 409 }
      );
    }

    // Preparar dados para inserção
    const equipamentoData = {
      tipo: tipo.trim(),
      modelo: modelo.trim(),
      serial_number: serial_number.trim(),
      ano_fabricacao: ano_fabricacao || null,
      cor: cor?.trim() || null,
      configuracao: configuracao?.trim() || null,
      status_garantia: status_garantia || 'fora_garantia',
      data_compra: data_compra || null,
      data_vencimento_garantia_apple: data_vencimento_garantia_apple || null,
      data_vencimento_garantia_loja: data_vencimento_garantia_loja || null,
      numero_nota_fiscal: numero_nota_fiscal?.trim() || null,
      loja_compra: loja_compra?.trim() || null,
      condicao_geral: condicao_geral || 'bom',
      danos_visiveis: danos_visiveis || [],
      descricao_danos: descricao_danos?.trim() || null,
      acessorios_inclusos: acessorios_inclusos || [],
      versao_sistema: versao_sistema?.trim() || null,
      senha_desbloqueio: senha_desbloqueio?.trim() || null,
      icloud_removido: icloud_removido || false,
      find_my_desabilitado: find_my_desabilitado || false,
    };

    // Inserir novo equipamento
    const { data: novoEquipamento, error: errorCriacao } = await supabase
      .from('equipamentos')
      .insert(equipamentoData)
      .select()
      .single();

    if (errorCriacao) {
      console.error('Erro ao criar equipamento:', errorCriacao);
      return NextResponse.json(
        { error: 'Erro ao criar equipamento' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Equipamento criado com sucesso',
        data: novoEquipamento,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro na criação do equipamento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
