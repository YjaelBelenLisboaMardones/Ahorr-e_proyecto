import { prisma } from "@ahorre/database";
import { NotFoundError, AppError, ERROR_CODES, HTTP_STATUS } from "@ahorre/shared";
import { transactionsRepository } from "../repositories";
import type { CreateTransactionInput } from "../types";

function getBudgetPeriodRange(period: string): { start: Date; end: Date } {
  const now = new Date();
  switch (period) {
    case "WEEKLY": {
      const start = new Date(now);
      const day = now.getDay();
      start.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    case "YEARLY": {
      const start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      return { start, end };
    }
    default: {
      // MONTHLY
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      return { start, end };
    }
  }
}

export const transactionsService = {
  async listByUser(userId: string) {
    return transactionsRepository.findAll(userId);
  },

  async create(userId: string, input: CreateTransactionInput) {
    // Validación de límite de presupuesto
    if (input.budgetId && input.type === "EXPENSE") {
      const budget = await prisma.budget.findFirst({
        where: { id: input.budgetId, userId },
      });

      if (!budget) {
        throw new NotFoundError("Presupuesto no encontrado.");
      }

      const { start, end } = getBudgetPeriodRange(budget.period);

      const spent = await prisma.transaction.aggregate({
        where: {
          budgetId: input.budgetId,
          type: "EXPENSE",
          date: { gte: start, lte: end },
        },
        _sum: { amount: true },
      });

      const totalSpent = Number(spent._sum.amount ?? 0);
      const remaining = Number(budget.amount) - totalSpent;

      if (input.amount > remaining) {
        throw new AppError(
          `Excede el presupuesto "${budget.name}". Disponible: $${Math.max(0, remaining).toLocaleString("es-CL")}`,
          {
            statusCode: HTTP_STATUS.UNPROCESSABLE_ENTITY,
            code: ERROR_CODES.VALIDATION_ERROR,
          }
        );
      }
    }

    return transactionsRepository.create({
      amount: input.amount,
      type: input.type,
      ...(input.description ? { description: input.description } : {}),
      ...(input.date ? { date: new Date(input.date) } : {}),
      profile: { connect: { userId } },
      ...(input.categoryId ? { category: { connect: { id: input.categoryId } } } : {}),
      ...(input.budgetId ? { budget: { connect: { id: input.budgetId } } } : {}),
    });
  },

  async delete(id: string, userId: string) {
    const existing = await transactionsRepository.findById(id, userId);
    if (!existing) throw new NotFoundError(`Transacción ${id} no encontrada.`);
    return transactionsRepository.delete(id);
  },
};
