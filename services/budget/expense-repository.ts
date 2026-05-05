import "server-only";

import { prisma } from "@/lib/prisma";
import type { Expense, ExpenseSource } from "@prisma/client";

/**
 * Repository pattern para `expenses`. Toda operación filtra por `profileId`
 * para garantizar ownership atómicamente.
 */

export type ExpenseInput = {
  budgetId: string;
  amount: number;
  description: string;
  spentAt: Date;
  source?: ExpenseSource;
};

export type ExpenseWithBudget = Expense & {
  budget: {
    id: string;
    amount: unknown;
    category: string | null;
    periodStart: Date;
    periodEnd: Date;
  };
};

export async function listExpensesByProfile(
  profileId: string,
): Promise<ExpenseWithBudget[]> {
  return prisma.expense.findMany({
    where: { profileId },
    orderBy: { spentAt: "desc" },
    include: {
      budget: {
        select: {
          id: true,
          amount: true,
          category: true,
          periodStart: true,
          periodEnd: true,
        },
      },
    },
  });
}

export async function listExpensesByBudget(
  budgetId: string,
  profileId: string,
): Promise<Expense[]> {
  return prisma.expense.findMany({
    where: { budgetId, profileId },
    orderBy: { spentAt: "desc" },
  });
}

export async function findExpenseById(
  id: string,
  profileId: string,
): Promise<ExpenseWithBudget | null> {
  return prisma.expense.findFirst({
    where: { id, profileId },
    include: {
      budget: {
        select: {
          id: true,
          amount: true,
          category: true,
          periodStart: true,
          periodEnd: true,
        },
      },
    },
  });
}

export async function createExpense(
  profileId: string,
  input: ExpenseInput,
): Promise<Expense> {
  return prisma.expense.create({
    data: {
      profileId,
      budgetId: input.budgetId,
      amount: input.amount,
      description: input.description,
      spentAt: input.spentAt,
      source: input.source ?? "MANUAL",
    },
  });
}

export async function deleteExpense(
  id: string,
  profileId: string,
): Promise<boolean> {
  const result = await prisma.expense.deleteMany({
    where: { id, profileId },
  });
  return result.count > 0;
}

/**
 * Suma de gastos asociados a un presupuesto. Usado por la lógica RF7.
 */
export async function sumExpensesByBudget(
  budgetId: string,
  profileId: string,
): Promise<number> {
  const result = await prisma.expense.aggregate({
    where: { budgetId, profileId },
    _sum: { amount: true },
  });
  return Number(result._sum.amount ?? 0);
}
