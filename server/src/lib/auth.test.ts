import { afterAll, beforeAll, describe, expect, it } from 'vitest';

// Auth helpers read JWT_SECRET at import-time via env validation, so set test
// values before importing. Vitest gives each test file its own module graph.
beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret-please-do-not-use-in-prod';
  process.env.DATABASE_URL = 'file:./test.db';
});

afterAll(() => {
  delete process.env.JWT_SECRET;
  delete process.env.DATABASE_URL;
});

describe('auth helpers', () => {
  it('hashes and verifies a password (bcrypt round-trip)', async () => {
    const { hashPassword, verifyPassword } = await import('./auth.js');
    const hash = await hashPassword('correct-horse-battery');
    expect(hash).not.toBe('correct-horse-battery');
    expect(await verifyPassword('correct-horse-battery', hash)).toBe(true);
    expect(await verifyPassword('wrong-password', hash)).toBe(false);
  });

  it('signs and verifies a JWT, preserving the payload', async () => {
    const { signToken, verifyToken } = await import('./auth.js');
    const token = signToken({ sub: 'user-123', username: 'ash' });
    const payload = verifyToken(token);
    expect(payload.sub).toBe('user-123');
    expect(payload.username).toBe('ash');
  });

  it('rejects a tampered token', async () => {
    const { signToken, verifyToken } = await import('./auth.js');
    const token = signToken({ sub: 'user-123', username: 'ash' });
    const tampered = token.slice(0, -3) + 'aaa';
    expect(() => verifyToken(tampered)).toThrow();
  });
});
