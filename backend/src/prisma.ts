import { PrismaClient } from '@prisma/client';

/**
 * Singleton PrismaClient. The DAL is the only layer that imports this; no other
 * layer touches the ORM. Reusing one client avoids exhausting the connection
 * pool across hot-reloads and repeated imports.
 */
let client: PrismaClient | undefined;

export const getPrisma = (): PrismaClient => {
  if (!client) {
    client = new PrismaClient();
  }
  return client;
};

export const disconnectPrisma = async (): Promise<void> => {
  if (client) {
    await client.$disconnect();
    client = undefined;
  }
};
