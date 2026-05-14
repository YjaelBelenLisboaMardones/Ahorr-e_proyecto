import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

/**
 * Supabase pooler (pgbouncer) en serverless requiere connection_limit=1 y pgbouncer=true.
 * Sin esto: error 42P05 "prepared statement already exists" en cold starts.
 */
function buildDatasourceUrl(): string | undefined {
  const raw = process.env["DATABASE_URL"];
  if (!raw) return undefined;

  const [basePart, existingQuery = ""] = raw.split("?", 2) as [string, string | undefined];
  const base = basePart;
  const params = existingQuery ? existingQuery.split("&").filter(Boolean) : [];
  const hasConnectionLimit = params.some((p) => p.startsWith("connection_limit="));
  const hasPgBouncer = params.some((p) => p.startsWith("pgbouncer="));

  if (!hasConnectionLimit) params.push("connection_limit=1");
  if (base.includes("pooler.supabase.com") && !hasPgBouncer) {
    params.push("pgbouncer=true");
  }

  return params.length > 0 ? `${base}?${params.join("&")}` : base;
}

const prismaClientSingleton = () => {
  const url = buildDatasourceUrl();
  return new PrismaClient({
    log: ["error"],
    ...(url ? { datasources: { db: { url } } } : {}),
  });
};

export const prisma = globalThis.prisma ?? prismaClientSingleton();
globalThis.prisma = prisma;

export { PrismaClient } from "@prisma/client";
