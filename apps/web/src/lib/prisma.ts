import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../../api/generated/prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prismaClientSingleton = () => {
  const databaseUrl = process.env.DATABASE_URL;

  // During build time, skip Prisma initialization if DATABASE_URL is not set
  if (!databaseUrl) {
    // Return a mock client for build-time usage
    // This allows the build to succeed without a real database connection
    return {} as PrismaClient;
  }

  const adapter = new PrismaPg({ connectionString: databaseUrl });
  return new PrismaClient({ adapter });
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
