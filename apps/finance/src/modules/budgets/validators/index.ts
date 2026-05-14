import { z } from "zod";

export const createBudgetSchema = z
  .object({
    name: z.string().min(1).max(100),
    amount: z.number().positive(),
    categoryId: z.string().uuid().optional(),
    period: z.enum(["WEEKLY", "MONTHLY", "YEARLY"]),
    startDate: z.string().datetime(),
    endDate: z.string().datetime().optional(),
  })
  .strict();
