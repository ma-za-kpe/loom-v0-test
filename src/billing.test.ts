import { describe, it, expect, vi } from 'vitest';
import { createPaymentIntent, createStripeClient } from '@loom/stripe-shim';

describe('billing', () => {
  it('createStripeClient returns a client with paymentIntents', () => {
    const client = createStripeClient('sk_test_123', { telemetry: false });
    expect(typeof client.paymentIntents.create).toBe('function');
  });

  it('createPaymentIntent forwards the right params', async () => {
    const calls: unknown[] = [];
    const fakeClient = {
      paymentIntents: {
        create: async (params: unknown) => {
          calls.push(params);
          return { id: 'pi_test', amount: 2000, currency: 'usd', status: 'requires_payment_method' };
        },
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await createPaymentIntent(fakeClient as any, {
      amount: 2000,
      currency: 'usd',
      customerId: 'cus_test',
      orderId: 'order-1',
      email: 'test@example.com',
    } as Parameters<typeof createPaymentIntent>[1]);

    expect(result.id).toBe('pi_test');
    expect(calls).toHaveLength(1);
  });

  it('rejects zero amount', async () => {
    const client = createStripeClient('sk_test_123');
    await expect(
      createPaymentIntent(client, { amount: 0, currency: 'usd' }),
    ).rejects.toThrow('amount must be a positive integer');
  });

  it('rejects invalid currency', async () => {
    const client = createStripeClient('sk_test_123');
    await expect(
      createPaymentIntent(client, { amount: 100, currency: 'us-dollar' }),
    ).rejects.toThrow('currency must be a 3-letter ISO code');
  });
});
