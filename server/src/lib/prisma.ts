import { PrismaClient } from '@prisma/client';

// Single shared Prisma client. Cached on globalThis so hot-module reloads
// don't spawn a new database connection on every file change.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
