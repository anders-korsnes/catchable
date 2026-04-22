import { PrismaClient } from '@prisma/client';

// Shared Prisma client cached on globalThis so HMR doesn't open a new connection per reload.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
