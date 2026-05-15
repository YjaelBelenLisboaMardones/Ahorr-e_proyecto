import { NotFoundError } from "@ahorre/shared";
import { budgetsRepository } from "../repositories";
import type { CreateBudgetInput } from "../types";

export const budgetsService = {
  async listByUser(userId: string) {
    return budgetsRepository.findAll(userId);
  },

  async create(userId: string, input: CreateBudgetInput) {
    return budgetsRepository.create({
      name: input.name,
      amount: input.amount,
      period: input.period,
      startDate: new Date(input.startDate),
      ...(input.endDate ? { endDate: new Date(input.endDate) } : {}),
      profile: { connect: { userId } },
      ...(input.categoryId ? { category: { connect: { id: input.categoryId } } } : {}),
    });
  },

  async delete(id: string, userId: string) {
    const existing = await budgetsRepository.findById(id, userId);
    if (!existing) throw new NotFoundError(`Presupuesto ${id} no encontrado.`);
    return budgetsRepository.delete(id);
  },
};
