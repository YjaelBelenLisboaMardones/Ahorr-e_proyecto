import { prisma } from "@ahorre/database";
import type { Prisma } from "@prisma/client";

export const budgetsRepository = {
  findAll: (userId: string) =>
    prisma.budget.findMany({
      where: { userId },
      include: { category: true },
      orderBy: { createdAt: "desc" },
    }),

  findById: (id: string, userId: string) =>
    prisma.budget.findFirst({ where: { id, userId }, include: { category: true } }),

  create: (data: Prisma.BudgetCreateInput) =>
    prisma.budget.create({ data, include: { category: true } }),

  delete: (id: string) => prisma.budget.delete({ where: { id } }),
};
