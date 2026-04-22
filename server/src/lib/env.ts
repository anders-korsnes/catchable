import { config as loadEnv } from 'dotenv';
import { resolve } from 'node:path';
import { z } from 'zod';

// Load .env from the repo root so one file serves both client and server.
loadEnv({ path: resolve(process.cwd(), '../.env') });
loadEnv(); // server-local .env (CI, tests)

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z
    .string()
    .min(16, 'JWT_SECRET must be at least 16 characters'),
  PORT: z
    .string()
    .default('3001')
    .transform((v) => Number.parseInt(v, 10))
    .pipe(z.number().int().positive()),
  CLIENT_ORIGIN: z.string().url().default('http://localhost:5173'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // Fail on startup rather than on first request.
  const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
  console.error('\n[env] Invalid environment configuration:\n' + issues + '\n');
  console.error('Copy .env.example to .env and fill in the missing values.\n');
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
