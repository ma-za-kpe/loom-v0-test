import { createJWTSigner, type TokenPayload } from '@loom/auth-core';
import type http from 'node:http';

const JWT_SECRET = process.env['JWT_SECRET'] ?? '';

const signer = createJWTSigner(JWT_SECRET || 'dev-secret-change-in-production', {
  algorithm: 'HS256',
  expiresIn: '1h',
  issuer: 'acme-billing',
});

export function issueToken(payload: TokenPayload): string {
  return signer.sign(payload);
}

export function verifyBearerToken(req: http.IncomingMessage): TokenPayload {
  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer ')) {
    throw new Error('missing or invalid Authorization header');
  }
  const token = header.slice(7);
  return signer.verify(token, { issuer: 'acme-billing' });
}
