import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY não está definido')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-06-30.basil',
  typescript: true,
})

// Configurações do Stripe
export const STRIPE_CONFIG = {
  currency: 'brl',
  paymentMethods: ['card', 'pix'],
  successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/pagamentos/sucesso`,
  cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/pagamentos/cancelado`,
}

// Função para criar sessão de checkout
export async function createCheckoutSession({
  amount,
  description,
  customerEmail,
  metadata = {},
}: {
  amount: number
  description: string
  customerEmail?: string
  metadata?: Record<string, string>
}) {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'pix'],
      line_items: [
        {
          price_data: {
            currency: STRIPE_CONFIG.currency,
            product_data: {
              name: description,
            },
            unit_amount: Math.round(amount * 100), // Stripe usa centavos
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${STRIPE_CONFIG.successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: STRIPE_CONFIG.cancelUrl,
      customer_email: customerEmail,
      metadata,
      expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutos
    })

    return session
  } catch (error) {
    console.error('Erro ao criar sessão do Stripe:', error)
    throw new Error('Erro ao processar pagamento')
  }
}

// Função para criar Payment Intent (para pagamentos customizados)
export async function createPaymentIntent({
  amount,
  description,
  customerEmail,
  metadata = {},
}: {
  amount: number
  description: string
  customerEmail?: string
  metadata?: Record<string, string>
}) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: STRIPE_CONFIG.currency,
      description,
      receipt_email: customerEmail,
      metadata,
      payment_method_types: ['card', 'pix'],
    })

    return paymentIntent
  } catch (error) {
    console.error('Erro ao criar Payment Intent:', error)
    throw new Error('Erro ao processar pagamento')
  }
}

// Função para verificar status do pagamento
export async function retrievePaymentIntent(paymentIntentId: string) {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
    return paymentIntent
  } catch (error) {
    console.error('Erro ao recuperar Payment Intent:', error)
    throw new Error('Erro ao verificar pagamento')
  }
}

// Função para processar webhook
export async function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET não está definido')
  }

  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret
    )
    return event
  } catch (error) {
    console.error('Erro ao verificar webhook:', error)
    throw new Error('Webhook inválido')
  }
}

// Função para formatar valor para exibição
export function formatStripeAmount(amount: number): number {
  return amount / 100
}

// Função para converter valor para Stripe
export function convertToStripeAmount(amount: number): number {
  return Math.round(amount * 100)
}