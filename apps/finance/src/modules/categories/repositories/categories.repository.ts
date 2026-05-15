import { prisma } from "@ahorre/database";
import type { Prisma } from "@prisma/client";

export const categoriesRepository = {
  findAll: (userId: string) =>
    prisma.category.findMany({
      where: { userId },
      orderBy: { name: "asc" },
    }),

  findById: (id: string, userId: string) =>
    prisma.category.findFirst({ where: { id, userId } }),

  create: (data: Prisma.CategoryCreateInput) => prisma.category.create({ data }),

  delete: (id: string) => prisma.category.delete({ where: { id } }),
};
