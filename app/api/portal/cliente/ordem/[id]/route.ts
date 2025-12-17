import { NextRequest, NextResponse } from 'next/server';

import { verifyClienteToken } from '@/lib/auth/client-middleware';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticação do cliente
    const clienteData = await verifyClienteToken(request);
    if (!clienteData) {
      return NextResponse.json(
        { error: 'Token inválido ou expirado' },
        { status: 401 }
      );
    }

    const { id: ordemId } = await params;

    // Buscar ordem de serviço
    const ordemServico = await prisma.ordemServico.findFirst({
      where: {
        id: ordemId,
        clienteId: clienteData.clienteId,
      },
      include: {
        cliente: {
          select: {
            nome: true,
            email: true,
            telefone: true,
          }
        },
      }
    });

    if (!ordemServico) {
      // Check if exists to verify permissions
      const exists = await prisma.ordemServico.findUnique({
        where: { id: ordemId },
        select: { id: true }
      });

      if (!exists) {
        return NextResponse.json(
          { error: 'Ordem de serviço não encontrada' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: 'Você não tem permissão para acessar esta ordem de serviço' },
        { status: 403 }
      );
    }

    // Buscar aprovações
    const aprovacoes = await prisma.clienteAprovacao.findMany({
      where: {
        ordemServicoId: ordemId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Manually construct the response to match expected Supabase format
    // Equipment info is flattened on OrdemServico model
    const responseOrder = {
      ...ordemServico,
      numero_os: ordemServico.numeroOs,
      tipo_dispositivo: ordemServico.tipoDispositivo,
      modelo_dispositivo: ordemServico.modeloDispositivo,
      numero_serie: ordemServico.numeroSerie,
      defeito_relatado: ordemServico.defeitoRelatado,
      danos_aparentes: ordemServico.danosAparentes,
      valor_servico: ordemServico.valorServico,
      valor_pecas: ordemServico.valorPecas,
      valor_total: ordemServico.valorTotal,
      data_abertura: ordemServico.dataAbertura,
      data_inicio: ordemServico.dataInicio,
      data_conclusao: ordemServico.dataConclusao,
      created_at: ordemServico.createdAt,
      updated_at: ordemServico.updatedAt,
      // Construct virtual 'equipamento' object if frontend expects it
      equipamento: {
        marca: ordemServico.tipoDispositivo, // Assuming 'brand' is captured here or unavailable
        modelo: ordemServico.modeloDispositivo,
        numero_serie: ordemServico.numeroSerie
      }
    };

    return NextResponse.json({
      ordem_servico: responseOrder,
      aprovacoes: aprovacoes || [],
    });

  } catch (error) {
    console.error('Erro na API de detalhes da ordem:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
