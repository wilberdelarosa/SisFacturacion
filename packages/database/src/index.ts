export * from '@prisma/client';

import { PrismaClient } from '@prisma/client';

// PrismaClient singleton to prevent multiple connections in dev (HMR)
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient({
    log: ['query', 'error', 'warn'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
