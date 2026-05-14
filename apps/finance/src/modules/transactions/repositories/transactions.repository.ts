import { prisma } from "@ahorre/database";
import type { Prisma } from "@prisma/client";

export const transactionsRepository = {
  findAll: (userId: string) =>
    prisma.transaction.findMany({
      where: { userId },
      include: { category: true },
      orderBy: { date: "desc" },
    }),

  findById: (id: string, userId: string) =>
    prisma.transaction.findFirst({ where: { id, userId } }),

  create: (data: Prisma.TransactionCreateInput) =>
    prisma.transaction.create({ data, include: { category: true } }),

  delete: (id: string) => prisma.transaction.delete({ where: { id } }),
};
