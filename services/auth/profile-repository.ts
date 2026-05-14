import "server-only";

import { prisma } from "@/app/lib/prisma";
import type { Profile } from "@prisma/client";

/**
 * Repository pattern: encapsula el acceso a la tabla `profiles`.
 * Cualquier código que necesite leer/escribir un profile pasa por aquí,
 * no consume Prisma directamente.
 */

export async function findProfileById(id: string): Promise<Profile | null> {
  return prisma.profile.findUnique({ where: { id } });
}

export async function findProfileByEmail(email: string): Promise<Profile | null> {
  return prisma.profile.findUnique({ where: { email } });
}

/**
 * Crea un profile a partir de un usuario recién registrado en Supabase Auth.
 * Idempotente: si ya existe, lo devuelve sin error.
 */
export async function ensureProfile(input: {
  id: string;
  email: string;
  fullName?: string | null;
}): Promise<Profile> {
  return prisma.profile.upsert({
    where: { id: input.id },
    create: {
      id: input.id,
      email: input.email,
      fullName: input.fullName ?? null,
    },
    update: {},
  });
}
