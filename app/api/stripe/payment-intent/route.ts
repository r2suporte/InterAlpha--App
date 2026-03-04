import { NextRequest, NextResponse } from 'next/server';

import { getStripeServerClient } from '@/lib/stripe/server';

const DEFAULT_CURRENCY = 'brl';
const MIN_AMOUNT_CENTS = 50;

type PaymentIntentRequest = {
  amount?: number | string;
  currency?: string;
  metadata?: Record<string, string>;
};

function parseAmountToCents(amount: number | string | undefined): number | null {
  if (typeof amount === 'number') {
    if (!Number.isFinite(amount)) return null;
    return Number.isInteger(amount) ? amount : Math.round(amount * 100);
  }

  if (typeof amount === 'string') {
    const normalized = amount.replace(',', '.').trim();
    const parsed = Number.parseFloat(normalized);
    if (!Number.isFinite(parsed)) return null;
    return Math.round(parsed * 100);
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripeServerClient();
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe secret key is not configured' },
        { status: 503 }
      );
    }

    const body = (await request.json()) as PaymentIntentRequest;
    const amount = parseAmountToCents(body.amount);

    if (!amount || amount < MIN_AMOUNT_CENTS) {
      return NextResponse.json(
        { error: 'Invalid amount. Provide at least 0.50 in BRL.' },
        { status: 400 }
      );
    }

    const currency = (body.currency || DEFAULT_CURRENCY).toLowerCase();
    const metadata = body.metadata ?? {};

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      automatic_payment_methods: { enabled: true },
      metadata,
    });

    return NextResponse.json({
      id: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
    });
  } catch (error) {
    console.error('Error creating Stripe payment intent:', error);
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}

