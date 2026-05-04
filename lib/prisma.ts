import { PrismaClient } from "@prisma/client";

/**
 * Singleton de PrismaClient.
 * En dev, Next.js hace hot-reload y crearía múltiples instancias por reload,
 * agotando el pool de conexiones de Supabase. El truco del `globalThis` evita eso.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
