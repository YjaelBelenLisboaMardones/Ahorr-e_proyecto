import { categoriesRepository } from "../repositories";
import type { CreateCategoryInput } from "../types";

export const categoriesService = {
  async listByUser(userId: string) {
    return categoriesRepository.findAll(userId);
  },

  async create(userId: string, input: CreateCategoryInput) {
    return categoriesRepository.create({
      name: input.name,
      type: input.type,
      ...(input.icon ? { icon: input.icon } : {}),
      ...(input.color ? { color: input.color } : {}),
      profile: { connect: { userId } },
    });
  },
};
