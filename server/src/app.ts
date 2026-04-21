import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { env } from './lib/env.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { authRouter } from './routes/auth.js';
import { preferencesRouter } from './routes/preferences.js';
import { referenceRouter } from './routes/reference.js';
import { choicesRouter } from './routes/choices.js';
import { deckRouter } from './routes/deck.js';
import { achievementsRouter } from './routes/achievements.js';

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.CLIENT_ORIGIN,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/preferences', preferencesRouter);
  app.use('/api/pokemon', referenceRouter);
  app.use('/api/choices', choicesRouter);
  app.use('/api/deck', deckRouter);
  app.use('/api/achievements', achievementsRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
