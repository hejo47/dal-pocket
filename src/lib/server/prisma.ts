import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { pocketPrisma?: PrismaClient };

export function getPrisma() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_NOT_CONFIGURED");
  if (!globalForPrisma.pocketPrisma) {
    const adapter = new PrismaPg({ connectionString, max: 3, connectionTimeoutMillis: 8000, idleTimeoutMillis: 30000 });
    globalForPrisma.pocketPrisma = new PrismaClient({ adapter });
  }
  return globalForPrisma.pocketPrisma;
}
