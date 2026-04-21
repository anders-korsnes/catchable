import { PrismaClient } from '@prisma/client';

// A single shared client. tsx --watch reloads the module, so we cache on globalThis
// to avoid spawning a new connection on every reload.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
