import { NextRequest, NextResponse } from 'next/server'
import { constructWebhookEvent } from '@/lib/stripe'
import prisma from '@/lib/prisma'
import { headers } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headersList = await headers()
    const signature = headersList.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'Assinatura do webhook não encontrada' },
        { status: 400 }
      )
    }

    // Verificar e construir evento do webhook
    const event = await constructWebhookEvent(body, signature)

    // Processar diferentes tipos de eventos
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const pagamentoId = session.metadata?.pagamentoId

        if (pagamentoId) {
          // Atualizar status do pagamento para PAGO
          await prisma.pagamento.update({
            where: { id: pagamentoId },
            data: {
              status: 'PAGO',
              dataPagamento: new Date(),
              stripePaymentId: session.id,
            },
          })

          console.log(`Pagamento ${pagamentoId} marcado como PAGO`)
        }
        break
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object
        const pagamentoId = paymentIntent.metadata?.pagamentoId

        if (pagamentoId) {
          await prisma.pagamento.update({
            where: { id: pagamentoId },
            data: {
              status: 'PAGO',
              dataPagamento: new Date(),
              stripePaymentId: paymentIntent.id,
            },
          })

          console.log(`Payment Intent ${paymentIntent.id} processado com sucesso`)
        }
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object
        const pagamentoId = paymentIntent.metadata?.pagamentoId

        if (pagamentoId) {
          await prisma.pagamento.update({
            where: { id: pagamentoId },
            data: {
              status: 'CANCELADO',
              stripePaymentId: paymentIntent.id,
            },
          })

          console.log(`Payment Intent ${paymentIntent.id} falhou`)
        }
        break
      }

      case 'checkout.session.expired': {
        const session = event.data.object
        const pagamentoId = session.metadata?.pagamentoId

        if (pagamentoId) {
          // Limpar stripePaymentId se a sessão expirou
          await prisma.pagamento.update({
            where: { id: pagamentoId },
            data: {
              stripePaymentId: null,
            },
          })

          console.log(`Sessão ${session.id} expirou`)
        }
        break
      }

      default:
        console.log(`Evento não tratado: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Erro no webhook do Stripe:', error)
    return NextResponse.json(
      { error: 'Erro ao processar webhook' },
      { status: 400 }
    )
  }
}