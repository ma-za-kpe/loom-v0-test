import {
  createStripeClient,
  createPaymentIntent,
  type PaymentIntentInput,
} from '@loom/stripe-shim';
import type Stripe from 'stripe';

const stripe = createStripeClient(process.env['STRIPE_SECRET_KEY'] ?? '', {
  telemetry: false,
  maxNetworkRetries: 2,
});

export interface ChargeOrderParams {
  amount: number;
  currency: string;
  customerId: string;
  orderId: string;
  email: string;
}

export interface ChargeOrderResult {
  paymentIntentId: string;
  status: Stripe.PaymentIntent['status'];
  amountCents: number;
}

export async function chargeOrder(params: ChargeOrderParams): Promise<ChargeOrderResult> {
  const input: PaymentIntentInput = {
    amount: params.amount,
    currency: params.currency,
    customer: params.customerId,
    description: `Order ${params.orderId}`,
    metadata: { order_id: params.orderId },
    receiptEmail: params.email,
    confirm: true,
    idempotencyKey: `order-${params.orderId}`,
  };

  const intent = await createPaymentIntent(stripe, input);

  return {
    paymentIntentId: intent.id,
    status: intent.status,
    amountCents: intent.amount,
  };
}
