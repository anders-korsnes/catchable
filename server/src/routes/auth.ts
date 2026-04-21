import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import {
  clearAuthCookie,
  hashPassword,
  setAuthCookie,
  signToken,
  verifyPassword,
} from '../lib/auth.js';
import { asyncHandler } from '../middleware/error-handler.js';
import { requireAuth } from '../middleware/require-auth.js';
import { badRequest, conflict, unauthorized } from '../lib/errors.js';

export const authRouter = Router();

const credentialsSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, 'Username must be at least 3 characters')
    .max(32, 'Username must be 32 characters or fewer')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, _ and -'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long'),
});

authRouter.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { username, password } = credentialsSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      throw conflict('USERNAME_TAKEN', 'That username is already taken');
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { username, passwordHash },
      select: { id: true, username: true },
    });

    const token = signToken({ sub: user.id, username: user.username });
    setAuthCookie(res, token);
    res.status(201).json({ user });
  }),
);

authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    // Use a permissive parse here — we don't want to leak which field was wrong.
    const parsed = credentialsSchema.safeParse(req.body);
    if (!parsed.success) {
      throw badRequest('INVALID_CREDENTIALS', 'Invalid username or password');
    }
    const { username, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { username } });
    // Constant-ish error path — same response whether user exists or password is wrong,
    // so we don't leak which usernames are registered.
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      throw unauthorized('INVALID_CREDENTIALS', 'Invalid username or password');
    }

    const token = signToken({ sub: user.id, username: user.username });
    setAuthCookie(res, token);
    res.json({ user: { id: user.id, username: user.username } });
  }),
);

authRouter.post('/logout', (_req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

authRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, username: true },
    });
    if (!user) {
      // Token is valid but the user no longer exists — clear the stale cookie.
      clearAuthCookie(res);
      throw unauthorized('USER_NOT_FOUND', 'Your account is no longer available');
    }
    res.json({ user });
  }),
);
