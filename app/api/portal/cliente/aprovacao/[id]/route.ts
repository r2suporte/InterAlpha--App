import { NextRequest, NextResponse } from 'next/server';

import { verifyClienteToken } from '@/lib/auth/client-middleware';
import prisma from '@/lib/prisma';

export async function PATCH(
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

    const { acao, observacoes } = await request.json();

    if (!acao || !['aprovar', 'rejeitar'].includes(acao)) {
      return NextResponse.json(
        { error: 'Ação inválida. Use "aprovar" ou "rejeitar"' },
        { status: 400 }
      );
    }

    const { id: aprovacaoId } = await params;

    // Buscar aprovação e verificar se pertence ao cliente
    // Include OrdemServico to check owner
    const aprovacao = await prisma.clienteAprovacao.findUnique({
      where: { id: aprovacaoId },
      include: {
        ordemServico: {
          select: {
            id: true,
            clienteId: true,
            numeroOs: true,
          }
        }
      }
    });

    if (!aprovacao) {
      return NextResponse.json(
        { error: 'Aprovação não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se a aprovação pertence ao cliente autenticado
    if (aprovacao.ordemServico.clienteId !== clienteData.clienteId) {
      return NextResponse.json(
        { error: 'Você não tem permissão para esta aprovação' },
        { status: 403 }
      );
    }

    // Verificar se a aprovação ainda está pendente
    if (aprovacao.status !== 'pendente') {
      return NextResponse.json(
        { error: 'Esta aprovação já foi processada' },
        { status: 400 }
      );
    }

    // Verificar se a aprovação não expirou
    if (aprovacao.expiresAt && new Date(aprovacao.expiresAt) < new Date()) {
      // Marcar como expirada
      await prisma.clienteAprovacao.update({
        where: { id: aprovacaoId },
        data: { status: 'expirado' }
      });

      return NextResponse.json(
        { error: 'Esta aprovação expirou' },
        { status: 400 }
      );
    }

    // Processar aprovação
    const novoStatus = acao === 'aprovar' ? 'aprovado' : 'rejeitado';
    const agora = new Date();

    const aprovacaoAtualizada = await prisma.clienteAprovacao.update({
      where: { id: aprovacaoId },
      data: {
        status: novoStatus,
        observacoesCliente: observacoes || null,
        aprovadoEm: agora,
        updatedAt: agora,
      }
    });

    // Registrar comunicação
    try {
      await prisma.comunicacaoCliente.create({
        data: {
          // No relation field for client in ComunicacaoCliente schema from step 468?
          // It has 'clientePortalId' (UUID) which maps to 'cliente_portal_id'.
          // Wait, verify schema for ComunicacaoCliente in Step 468.
          // Line 168: clientePortalId String? @map("cliente_portal_id") @db.Uuid
          // It doesn't use a relation for it, just an ID field?
          // Or relation is missing? Assuming ID field is sufficient.
          clientePortalId: clienteData.clienteId,
          ordemServicoId: aprovacao.ordemServicoId,
          tipo: 'aprovacao',
          provider: 'portal', // Mapped to provider (formerly canal if any, but schema calls it provider)
          conteudo: `${acao === 'aprovar' ? 'Aprovação' : 'Rejeição'} de ${aprovacao.tipo}: ${aprovacao.descricao}${observacoes ? `\nObservações: ${observacoes}` : ''}`,
          status: 'enviado',
          enviadoEm: agora,
          destinatario: 'sistema',
          dataEnvio: agora
        }
      });
    } catch (error) {
      console.error('Erro ao registrar comunicação:', error);
      // Não falhar a operação por causa disso
    }

    // TODO: Enviar notificação para a equipe interna

    return NextResponse.json({
      success: true,
      message: `${aprovacao.tipo} ${acao === 'aprovar' ? 'aprovado' : 'rejeitado'} com sucesso`,
      aprovacao: {
        id: aprovacaoAtualizada.id,
        status: novoStatus,
        aprovado_em: agora.toISOString(),
      },
    });

  } catch (error) {
    console.error('Erro na API de aprovação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
