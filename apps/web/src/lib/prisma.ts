import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../../api/generated/prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prismaClientSingleton = () => {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    const isBuildOrTest = process.env.NEXT_PHASE === 'phase-production-build' || process.env.NODE_ENV === 'test';
    if (isBuildOrTest) return {} as PrismaClient;
    throw new Error('DATABASE_URL is required to initialize Better Auth');
  }

  const adapter = new PrismaPg({ connectionString: databaseUrl });
  return new PrismaClient({ adapter });
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
