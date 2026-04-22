import { z } from 'zod';

// Mirrors the server-side schema for instant client-side feedback.
// The server re-validates — it remains the source of truth.
export const credentialsSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, 'Username must be at least 3 characters')
    .max(32, 'Username must be 32 characters or fewer')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Letters, numbers, _ and - only'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long'),
});

export type Credentials = z.infer<typeof credentialsSchema>;
