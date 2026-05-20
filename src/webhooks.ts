import { verifyStripeWebhook } from '@loom/stripe-shim';
import type Stripe from 'stripe';

const WEBHOOK_SECRET = process.env['STRIPE_WEBHOOK_SECRET'] ?? '';

export function handleStripeWebhook(rawBody: string, signatureHeader: string): Stripe.Event {
  return verifyStripeWebhook({
    payload: rawBody,
    signatureHeader,
    secret: WEBHOOK_SECRET,
  });
}

export function processEvent(event: Stripe.Event): { handled: boolean; type: string } {
  switch (event.type) {
    case 'payment_intent.succeeded':
      console.log(`Payment succeeded: ${(event.data.object as Stripe.PaymentIntent).id}`);
      return { handled: true, type: event.type };

    case 'payment_intent.payment_failed':
      console.log(`Payment failed: ${(event.data.object as Stripe.PaymentIntent).id}`);
      return { handled: true, type: event.type };

    default:
      return { handled: false, type: event.type };
  }
}
