import { verifyStripeWebhook } from '@loom/stripe-shim';
import { createWebhookVerifier } from '@loom/webhook-verifier';
import type Stripe from 'stripe';

const WEBHOOK_SECRET = process.env['STRIPE_WEBHOOK_SECRET'] ?? '';
const PLATFORM_WEBHOOK_SECRET = process.env['PLATFORM_WEBHOOK_SECRET'] ?? '';

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

const platformVerifier = createWebhookVerifier({
  secret: PLATFORM_WEBHOOK_SECRET || 'dev-platform-secret',
  algorithm: 'sha256',
  prefix: 'sha256=',
});

export function handlePlatformWebhook(
  rawBody: string,
  signatureHeader: string,
): { valid: boolean } {
  const valid = platformVerifier.verify(rawBody, signatureHeader);
  if (!valid) {
    throw new Error('platform webhook signature verification failed');
  }
  return { valid: true };
}
