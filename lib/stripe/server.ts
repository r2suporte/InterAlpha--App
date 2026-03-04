import 'server-only';
import Stripe from 'stripe';

import { envServer } from '@/lib/config/env.server';

let stripeClient: Stripe | null = null;

export function getStripeServerClient(): Stripe | null {
  const stripeSecretKey = envServer.stripe.secretKey();
  if (!stripeSecretKey) {
    return null;
  }

  if (!stripeClient) {
    stripeClient = new Stripe(stripeSecretKey);
  }

  return stripeClient;
}

