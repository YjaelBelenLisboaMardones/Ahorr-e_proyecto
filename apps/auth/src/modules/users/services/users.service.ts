import { NotFoundError } from "@ahorre/shared";
import { usersRepository } from "../repositories";

export const usersService = {
  async getByUserId(userId: string) {
    const profile = await usersRepository.findByUserId(userId);
    if (!profile) throw new NotFoundError("Perfil no encontrado.");
    return profile;
  },
};
