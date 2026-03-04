import { NextResponse } from 'next/server';

import { envPublic } from '@/lib/config/env.public';

export async function GET() {
  const publishableKey = envPublic.stripe.publishableKey();

  if (!publishableKey) {
    return NextResponse.json(
      { error: 'Stripe publishable key is not configured' },
      { status: 503 }
    );
  }

  return NextResponse.json({ publishableKey });
}

