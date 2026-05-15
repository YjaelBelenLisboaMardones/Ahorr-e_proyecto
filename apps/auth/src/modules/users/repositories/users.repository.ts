import { prisma } from "@ahorre/database";

export const usersRepository = {
  findByUserId: (userId: string) =>
    prisma.userProfile.findUnique({ where: { userId } }),

  create: (data: { userId: string; fullName: string; role: "USER" | "ADMIN" }) =>
    prisma.userProfile.create({ data }),

  upsert: (userId: string, data: { fullName: string; role: "USER" | "ADMIN" }) =>
    prisma.userProfile.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    }),
};
