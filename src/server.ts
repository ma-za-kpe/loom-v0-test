import http from 'node:http';
import { chargeOrder } from './billing.js';
import { handleStripeWebhook, processEvent } from './webhooks.js';

const PORT = process.env['PORT'] ? Number(process.env['PORT']) : 3000;

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function json(res: http.ServerResponse, status: number, data: unknown): void {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);

  if (req.method === 'POST' && url.pathname === '/charge') {
    try {
      const body = JSON.parse(await readBody(req));
      const result = await chargeOrder({
        amount: body.amount_cents,
        currency: body.currency ?? 'usd',
        customerId: body.customer_id,
        orderId: body.order_id,
        email: body.email,
      });
      json(res, 200, result);
    } catch (err) {
      json(res, 400, { error: (err as Error).message });
    }
    return;
  }

  if (req.method === 'POST' && url.pathname === '/webhooks/stripe') {
    try {
      const rawBody = await readBody(req);
      const sig = req.headers['stripe-signature'] as string;
      const event = handleStripeWebhook(rawBody, sig);
      const result = processEvent(event);
      json(res, 200, result);
    } catch (err) {
      json(res, 400, { error: (err as Error).message });
    }
    return;
  }

  if (req.method === 'GET' && url.pathname === '/health') {
    json(res, 200, { status: 'ok' });
    return;
  }

  json(res, 404, { error: 'not found' });
});

server.listen(PORT, () => {
  console.log(`acme-billing-service listening on :${PORT}`);
});
