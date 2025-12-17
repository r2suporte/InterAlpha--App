import { NextRequest, NextResponse } from 'next/server';

import { verifyClienteToken } from '@/lib/auth/client-middleware';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await verifyClienteToken(request);

    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Buscar dados atualizados do cliente
    /* props { id: string; nome: string; email: string | null; email2: string | null; email3: string | null; telefone: string | null; endereco: string | null; cidade: string | null; estado: string | null; ... 12 more ...; createdBy: string | null; } */
    const clienteData = await prisma.cliente.findUnique({
      where: { id: session.clienteId },
    });

    if (!clienteData) {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      );
    }

    // Buscar ordens de serviço do cliente
    const ordensServico = await prisma.ordemServico.findMany({
      where: { clienteId: clienteData.id },
      select: {
        id: true,
        numeroOs: true,
        status: true,
        descricao: true,
        valorTotal: true,
        dataInicio: true,
        dataConclusao: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      cliente: {
        id: clienteData.id,
        nome: clienteData.nome,
        email: clienteData.email,
        login: clienteData.login,
        primeiro_acesso: clienteData.primeiroAcesso,
      },
      ordens_servico: ordensServico || [],
    });
  } catch (error) {
    console.error('Erro ao verificar autenticação do cliente:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
