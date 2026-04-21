import type { RequestHandler } from 'express';
import { AUTH_COOKIE_NAME, verifyToken } from '../lib/auth.js';
import { unauthorized } from '../lib/errors.js';

declare global {
  // Augment Express Request so downstream handlers can read req.user without casts.
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { id: string; username: string };
    }
  }
}

export const requireAuth: RequestHandler = (req, _res, next) => {
  const token = req.cookies?.[AUTH_COOKIE_NAME];
  if (!token || typeof token !== 'string') {
    return next(unauthorized());
  }
  try {
    const payload = verifyToken(token);
    req.user = { id: payload.sub, username: payload.username };
    next();
  } catch {
    next(unauthorized('INVALID_TOKEN', 'Your session has expired — please sign in again'));
  }
};
