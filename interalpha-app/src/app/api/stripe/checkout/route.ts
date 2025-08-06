import { NextRequest, NextResponse } from 'next/server'
import { createCheckoutSession } from '@/lib/stripe'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { pagamentoId, successUrl, cancelUrl } = body

    if (!pagamentoId) {
      return NextResponse.json(
        { error: 'ID do pagamento é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar dados do pagamento
    const pagamento = await prisma.pagamento.findUnique({
      where: { id: pagamentoId },
      include: {
        ordemServico: {
          include: {
            cliente: {
              select: {
                nome: true,
                email: true,
              },
            },
          },
        },
      },
    })

    if (!pagamento) {
      return NextResponse.json(
        { error: 'Pagamento não encontrado' },
        { status: 404 }
      )
    }

    if (pagamento.status === 'PAGO') {
      return NextResponse.json(
        { error: 'Pagamento já foi processado' },
        { status: 400 }
      )
    }

    // Criar descrição do pagamento
    let description = `Pagamento #${pagamento.id.slice(-8)}`
    if (pagamento.ordemServico) {
      description = `${pagamento.ordemServico.titulo} - ${pagamento.ordemServico.cliente.nome}`
    }

    // Criar sessão do Stripe
    const session = await createCheckoutSession({
      amount: pagamento.valor,
      description,
      customerEmail: pagamento.ordemServico?.cliente.email,
      metadata: {
        pagamentoId: pagamento.id,
        ordemServicoId: pagamento.ordemServicoId || '',
        clienteNome: pagamento.ordemServico?.cliente.nome || '',
      },
    })

    // Atualizar pagamento com ID da sessão
    await prisma.pagamento.update({
      where: { id: pagamento.id },
      data: {
        stripePaymentId: session.id,
      },
    })

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    })
  } catch (error) {
    console.error('Erro na API de checkout:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}