import http from 'node:http';
import { chargeOrder } from './billing.js';
import { handleStripeWebhook, processEvent, handlePlatformWebhook } from './webhooks.js';
import { verifyBearerToken, issueToken } from './auth.js';

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

  // Issue a short-lived JWT for local testing
  if (req.method === 'POST' && url.pathname === '/auth/token') {
    try {
      const body = JSON.parse(await readBody(req));
      const token = issueToken({ sub: body.sub ?? 'anonymous', role: body.role ?? 'user' });
      json(res, 200, { token });
    } catch (err) {
      json(res, 400, { error: (err as Error).message });
    }
    return;
  }

  if (req.method === 'POST' && url.pathname === '/charge') {
    try {
      const caller = verifyBearerToken(req);
      const body = JSON.parse(await readBody(req));
      const result = await chargeOrder({
        amount: body.amount_cents,
        currency: body.currency ?? 'usd',
        customerId: body.customer_id,
        orderId: body.order_id,
        email: body.email,
      });
      json(res, 200, { ...result, chargedBy: caller.sub });
    } catch (err) {
      const message = (err as Error).message;
      const status = message.includes('Authorization') || message.includes('jwt') ? 401 : 400;
      json(res, status, { error: message });
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

  if (req.method === 'POST' && url.pathname === '/webhooks/platform') {
    try {
      const rawBody = await readBody(req);
      const sig = req.headers['x-platform-signature'] as string;
      const result = handlePlatformWebhook(rawBody, sig);
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
