import { describe, it, expect } from 'vitest';
import { issueToken, verifyBearerToken } from './auth.js';
import type http from 'node:http';

function fakeReq(authorization?: string): http.IncomingMessage {
  return {
    headers: authorization ? { authorization } : {},
  } as unknown as http.IncomingMessage;
}

describe('auth', () => {
  it('issueToken returns a valid JWT string', () => {
    const token = issueToken({ sub: 'user_123', role: 'admin' });
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);
  });

  it('verifyBearerToken accepts a valid token', () => {
    const token = issueToken({ sub: 'user_456', role: 'user' });
    const payload = verifyBearerToken(fakeReq(`Bearer ${token}`));
    expect(payload.sub).toBe('user_456');
    expect(payload.role).toBe('user');
  });

  it('verifyBearerToken rejects missing Authorization header', () => {
    expect(() => verifyBearerToken(fakeReq())).toThrow('missing or invalid Authorization header');
  });

  it('verifyBearerToken rejects non-Bearer scheme', () => {
    const token = issueToken({ sub: 'x' });
    expect(() => verifyBearerToken(fakeReq(`Basic ${token}`))).toThrow(
      'missing or invalid Authorization header',
    );
  });

  it('verifyBearerToken rejects a tampered token', () => {
    const token = issueToken({ sub: 'user_789' });
    const tampered = token.slice(0, -4) + 'xxxx';
    expect(() => verifyBearerToken(fakeReq(`Bearer ${tampered}`))).toThrow();
  });
});
