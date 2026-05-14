import "server-only";

import { prisma } from "@/app/lib/prisma";
import type { Budget } from "@prisma/client";

/**
 * Repository pattern para `budgets`.
 * Toda operación recibe `profileId` y filtra por él, garantizando ownership
 * incluso si la RLS de la BD fallara o se desactivara.
 */

export type BudgetInput = {
  amount: number;
  periodStart: Date;
  periodEnd: Date;
  category: string | null;
};

export async function listBudgetsByProfile(profileId: string): Promise<Budget[]> {
  return prisma.budget.findMany({
    where: { profileId },
    orderBy: { periodStart: "desc" },
  });
}

export async function findBudgetById(
  id: string,
  profileId: string,
): Promise<Budget | null> {
  return prisma.budget.findFirst({
    where: { id, profileId },
  });
}

export async function createBudget(
  profileId: string,
  input: BudgetInput,
): Promise<Budget> {
  return prisma.budget.create({
    data: { profileId, ...input },
  });
}

export async function updateBudget(
  id: string,
  profileId: string,
  input: BudgetInput,
): Promise<Budget | null> {
  // updateMany permite filtrar por id + profileId (ownership atómico).
  const result = await prisma.budget.updateMany({
    where: { id, profileId },
    data: input,
  });
  if (result.count === 0) return null;
  return prisma.budget.findUnique({ where: { id } });
}

export async function deleteBudget(id: string, profileId: string): Promise<boolean> {
  const result = await prisma.budget.deleteMany({
    where: { id, profileId },
  });
  return result.count > 0;
}
